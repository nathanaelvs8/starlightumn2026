"use client";

import { useEffect, useId, useMemo, useRef, useState, type ClipboardEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { PosterTim } from "@/components/site/PosterTim";
import clsx from "@/lib/clsx";
import {
  BATAS_VIDEO_MB,
  BUCKET_FOTO,
  BUCKET_VIDEO,
  FORMAT_VIDEO,
  formatDurasi,
  idInstagram,
  idYoutube,
  jenisVideo,
  pathDariUrlPublik,
  sampulTim,
  youtubeShorts,
  type TimVote,
} from "@/lib/videoTim";

/**
 * Form tambah / ubah satu tim voting (panel admin).
 *
 * Video tiap tim bisa dari tiga sumber, dipilih admin:
 *   - Tanpa video  → cuma gambar.
 *   - Unggah video → file dari komputer; thumbnail dibikin otomatis dari
 *                    tiga cuplikan videonya (kayak YouTube Studio).
 *   - Tempel link  → YouTube (thumbnail otomatis dari YouTube) atau
 *                    Instagram (sampul dicoba diambil otomatis dari
 *                    Instagram; kalau gagal → wajib unggah).
 * Di semua sumber admin tetap bisa pakai gambar sampul sendiri — dipilih,
 * diseret ke kotak unggah, atau ditempel (Ctrl+V) di mana aja di form.
 *
 * File diunggah langsung dari browser ke Supabase Storage (sesi admin),
 * bukan lewat server kita — server Vercel nolak body di atas ±4,5 MB.
 */

type Sumber = "tanpa" | "upload" | "link";

type PilihanSampul =
  | { tipe: "cuplikan"; i: number }
  | { tipe: "lama" }
  | { tipe: "youtube" }
  | { tipe: "instagram" }
  | { tipe: "sendiri" }
  | { tipe: "kosong" };

type Cuplikan = { url: string; blob: Blob };

/** Sampul yang diambil dari Instagram buat satu kode reel/post. */
type SampulIg = { kode: string } & (
  | { status: "memuat" }
  | { status: "ok"; url: string; blob: Blob }
  | { status: "gagal" }
);

/* Link Instagram duluan: video tim kebanyakan reels Instagram. */
const SUMBER: { id: Sumber; label: string }[] = [
  { id: "link", label: "Link Instagram / YouTube" },
  { id: "upload", label: "Unggah video" },
  { id: "tanpa", label: "Tanpa video" },
];

const PESAN_FORMAT =
  "Video ini memakai format HEVC (biasanya dari iPhone) yang tidak dapat diputar di sebagian HP. Ekspor ulang ke MP4 (H.264), lalu unggah kembali.";
const PESAN_TAK_DIKENAL = "Format video tidak dikenali. Gunakan video MP4 (H.264).";
const PESAN_WEBM = "Video WebM tidak dapat diputar di sebagian iPhone. Gunakan video MP4 (H.264).";

/** Sampul diperkecil ke sisi terpanjang segini sebelum diunggah. */
const SISI_SAMPUL = 1280;

export function EditorTimVote({
  awal,
  siap,
  onSelesai,
  onBatal,
}: {
  /** Tim yang diubah. Kosong = tambah tim baru. */
  awal?: TimVote;
  /** Kolom video sudah ada di database (SQL sudah dijalankan). */
  siap: boolean;
  onSelesai: () => void;
  onBatal?: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const idForm = useId();
  const jenisAwal = jenisVideo(awal?.video_url);

  const [nama, setNama] = useState(awal?.name ?? "");
  const [deskripsi, setDeskripsi] = useState(awal?.deskripsi ?? "");
  const [sumber, setSumber] = useState<Sumber>(
    // Tim baru → langsung siap ditempel link reel. Tim lama tanpa video
    // tetap "tanpa", biar nggak dipaksa ngisi link pas cuma ganti nama.
    !awal ? "link" : !jenisAwal ? "tanpa" : jenisAwal === "file" ? "upload" : "link",
  );
  const [link, setLink] = useState(jenisAwal && jenisAwal !== "file" ? awal!.video_url! : "");

  // Video baru yang dipilih dari komputer + hasil olahannya.
  const [videoBaru, setVideoBaru] = useState<File | null>(null);
  const [durasi, setDurasi] = useState<number | null>(null);
  const [cuplikan, setCuplikan] = useState<Cuplikan[]>([]);
  const [mengolah, setMengolah] = useState(false);
  const [galatVideo, setGalatVideo] = useState<string | null>(null);
  const inputVideo = useRef<HTMLInputElement>(null);

  // Gambar sampul.
  const [sampul, setSampul] = useState<PilihanSampul>(
    awal?.photo_url ? { tipe: "lama" } : jenisAwal === "youtube" ? { tipe: "youtube" } : { tipe: "kosong" },
  );
  /** Gambar sampul pilihan sendiri — udah diperkecil & jadi JPEG. */
  const [fileSampul, setFileSampul] = useState<Blob | null>(null);
  const [pratinjauSampul, setPratinjauSampul] = useState<string | null>(null);
  const [galatSampul, setGalatSampul] = useState<string | null>(null);
  const inputSampul = useRef<HTMLInputElement>(null);
  const [sampulIg, setSampulIg] = useState<SampulIg | null>(null);
  /** Gambar lagi diseret di atas kotak unggah. */
  const [diseret, setDiseret] = useState(false);

  const [menyimpan, setMenyimpan] = useState(false);
  const [progres, setProgres] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const ytId = sumber === "link" ? idYoutube(link) : null;
  const igId = sumber === "link" ? idInstagram(link) : null;
  const linkSalah = sumber === "link" && link.trim() !== "" && !ytId && !igId;

  // Bersihkan object URL cuplikan & pratinjau biar memorinya nggak bocor.
  useEffect(() => () => cuplikan.forEach((c) => URL.revokeObjectURL(c.url)), [cuplikan]);
  useEffect(() => () => {
    if (pratinjauSampul) URL.revokeObjectURL(pratinjauSampul);
  }, [pratinjauSampul]);

  // Link YouTube baru ditempel & belum ada sampul → pakai thumbnail YouTube.
  useEffect(() => {
    if (ytId && sampul.tipe === "kosong") setSampul({ tipe: "youtube" });
    if (!ytId && sampul.tipe === "youtube") setSampul(awal?.photo_url ? { tipe: "lama" } : { tipe: "kosong" });
  }, [ytId, sampul.tipe, awal?.photo_url]);

  /*
    Link Instagram ditempel → sampulnya langsung dicoba diambil (lewat
    server kita; browser nggak boleh baca halaman Instagram langsung).
    Berhasil & belum ada sampul → langsung dipakai. Link diganti sebelum
    selesai → hasil yang lama dibuang.
  */
  const igKode = siap && igId ? igId.kode : null;
  const igTipe = igId?.tipe;
  /**
   * Reel tim ini sebelum diubah. Kalau admin menggantinya dengan reel lain,
   * "sampul saat ini" hampir pasti sampul reel LAMA — jadi sampul reel
   * baru yang dipilih otomatis (sampul lama tetap bisa diklik balik).
   */
  const igKodeAwal = idInstagram(awal?.video_url)?.kode ?? null;
  useEffect(() => {
    if (!igKode || !igTipe) return;
    let batal = false;
    const t = window.setTimeout(async () => {
      setSampulIg({ kode: igKode, status: "memuat" });
      try {
        const res = await fetch("/api/admin/vote-teams/sampul-instagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: `https://www.instagram.com/${igTipe}/${igKode}/` }),
        });
        if (!res.ok) throw new Error("gagal");
        const blob = await kecilkanGambar(await res.blob(), SISI_SAMPUL);
        if (batal) return;
        setSampulIg({ kode: igKode, status: "ok", url: URL.createObjectURL(blob), blob });
        setSampul((s) =>
          s.tipe === "kosong" || (s.tipe === "lama" && igKodeAwal && igKode !== igKodeAwal) ? { tipe: "instagram" } : s,
        );
      } catch {
        if (!batal) setSampulIg({ kode: igKode, status: "gagal" });
      }
    }, 300);
    return () => {
      batal = true;
      window.clearTimeout(t);
    };
  }, [igKode, igTipe, igKodeAwal]);
  const sampulIgSiap = sampulIg?.status === "ok" && sampulIg.kode === igKode ? sampulIg : null;
  const sampulIgUrl = sampulIg?.status === "ok" ? sampulIg.url : null;
  useEffect(() => () => {
    if (sampulIgUrl) URL.revokeObjectURL(sampulIgUrl);
  }, [sampulIgUrl]);
  // Link Instagram-nya diganti / dihapus → sampul dari link lama dilepas.
  useEffect(() => {
    if (sampul.tipe === "instagram" && !sampulIgSiap)
      setSampul(awal?.photo_url ? { tipe: "lama" } : { tipe: "kosong" });
  }, [sampul.tipe, sampulIgSiap, awal?.photo_url]);

  // Cuplikan cuma berlaku buat video unggahan. Ganti sumber → lepas.
  useEffect(() => {
    if (sumber !== "upload" && sampul.tipe === "cuplikan")
      setSampul(awal?.photo_url ? { tipe: "lama" } : { tipe: "kosong" });
  }, [sumber, sampul.tipe, awal?.photo_url]);

  /**
   * Nomor urut pemilihan video. Olah video bisa makan beberapa detik; kalau
   * admin keburu milih video lain (atau nutup form), hasil olahan yang lama
   * dibuang — bukan menimpa video yang baru.
   */
  const giliran = useRef(0);
  /** Sama, buat gambar sampul: tempel A (besar) lalu B (kecil) → yang dipakai B. */
  const giliranGambar = useRef(0);
  const [mengolahGambar, setMengolahGambar] = useState(false);
  useEffect(() => () => {
    giliran.current = -1;
    giliranGambar.current = -1;
  }, []);

  const lepasCuplikan = () => {
    setCuplikan([]);
    // Sampul yang nunjuk cuplikan lama jangan dibiarin nunjuk ke kosong.
    setSampul((s) => (s.tipe === "cuplikan" ? (awal?.photo_url ? { tipe: "lama" } : { tipe: "kosong" }) : s));
  };

  const pilihVideo = async (f: File | null) => {
    const g = ++giliran.current;
    const tolak = (pesan: string) => {
      setGalatVideo(pesan);
      if (inputVideo.current) inputVideo.current.value = "";
    };
    setGalatVideo(null);
    setVideoBaru(null);
    setDurasi(null);
    lepasCuplikan();
    if (!f) return;
    if (f.type === "video/webm" || /\.webm$/i.test(f.name)) return tolak(PESAN_WEBM);
    if (f.size > BATAS_VIDEO_MB * 1024 * 1024)
      return tolak(
        `Ukuran video ${(f.size / 1024 / 1024).toFixed(1)} MB melebihi batas ${BATAS_VIDEO_MB} MB. Kompres video terlebih dahulu (720p sudah cukup).`,
      );

    setMengolah(true);
    try {
      /*
        Codec dicek dari ISI file, bukan dari "browser admin bisa muter atau
        nggak": Chrome di laptop admin mungkin bisa muter HEVC, tapi HP
        pengunjung belum tentu. Yang diterima cuma H.264.
      */
      const codec = await codecVideo(f);
      if (g !== giliran.current) return;
      if (codec !== "h264") return tolak(codec === "hevc" ? PESAN_FORMAT : PESAN_TAK_DIKENAL);

      const hasil = await ambilCuplikan(f);
      if (g !== giliran.current) {
        hasil.cuplikan.forEach((c) => URL.revokeObjectURL(c.url));
        return;
      }
      setVideoBaru(f);
      setDurasi(hasil.durasi);
      setCuplikan(hasil.cuplikan);
      if (hasil.cuplikan.length) setSampul((s) => (s.tipe === "sendiri" ? s : { tipe: "cuplikan", i: 0 }));
    } catch {
      if (g === giliran.current) tolak(PESAN_TAK_DIKENAL);
    } finally {
      if (g === giliran.current) setMengolah(false);
    }
  };

  const pilihGambar = async (f: File | null) => {
    if (menyimpan) return;
    const g = ++giliranGambar.current;
    setGalatSampul(null);
    if (!f) return;
    setMengolahGambar(true);
    try {
      // Foto HP bisa 5–10 MB & 4000px; di kartu cuma tampil ±300px.
      const kecil = await kecilkanGambar(f, SISI_SAMPUL);
      if (g !== giliranGambar.current) return;
      setFileSampul(kecil);
      setPratinjauSampul(URL.createObjectURL(kecil));
      setSampul({ tipe: "sendiri" });
    } catch {
      if (g === giliranGambar.current)
        setGalatSampul("Format gambar tidak didukung (misalnya HEIC dari iPhone). Gunakan gambar JPG atau PNG.");
    } finally {
      if (g === giliranGambar.current) setMengolahGambar(false);
      if (inputSampul.current) inputSampul.current.value = "";
    }
  };

  /** Pilihan sampul yang masuk akal buat sumber video sekarang. */
  const pilihanSampul: { kunci: string; pilihan: PilihanSampul; gambar: string | null; label: string }[] = [];
  if (sumber === "upload")
    cuplikan.forEach((c, i) =>
      pilihanSampul.push({ kunci: `c${i}`, pilihan: { tipe: "cuplikan", i }, gambar: c.url, label: `Cuplikan ${i + 1}` }),
    );
  if (ytId)
    pilihanSampul.push({
      kunci: "yt",
      pilihan: { tipe: "youtube" },
      gambar: sampulTim({ photo_url: null, video_url: link }),
      label: "Thumbnail YouTube",
    });
  if (sampulIgSiap)
    pilihanSampul.push({ kunci: "ig", pilihan: { tipe: "instagram" }, gambar: sampulIgSiap.url, label: "Dari Instagram" });
  if (awal?.photo_url)
    pilihanSampul.push({ kunci: "lama", pilihan: { tipe: "lama" }, gambar: awal.photo_url, label: "Sampul saat ini" });
  if (fileSampul)
    pilihanSampul.push({ kunci: "sendiri", pilihan: { tipe: "sendiri" }, gambar: pratinjauSampul, label: "Gambar unggahan" });

  /** Gambar yang bakal tampil di kartu, buat pratinjau. */
  const gambarPratinjau =
    sampul.tipe === "youtube"
      ? sampulTim({ photo_url: null, video_url: link }, "poster")
      : sampul.tipe === "cuplikan"
        ? (cuplikan[sampul.i]?.url ?? null)
        : sampul.tipe === "instagram"
          ? (sampulIgSiap?.url ?? null)
          : sampul.tipe === "sendiri"
            ? pratinjauSampul
            : sampul.tipe === "lama"
              ? (awal?.photo_url ?? null)
              : null;
  const adaVideoNanti =
    siap && (sumber === "upload" ? !!videoBaru || jenisAwal === "file" : sumber === "link" ? !!(ytId || igId) : false);

  const samaDengan = (a: PilihanSampul, b: PilihanSampul) =>
    a.tipe === b.tipe && (a.tipe !== "cuplikan" || (b.tipe === "cuplikan" && a.i === b.i));

  const simpan = async () => {
    setGalat(null);
    const namaBersih = nama.trim();
    if (!namaBersih) return setGalat("Nama tim wajib diisi.");

    // ---- cek kelengkapan sebelum ada yang diunggah ----
    const videoFileLama = jenisAwal === "file" ? awal!.video_url! : null;
    if (siap && sumber === "upload" && !videoBaru && !videoFileLama)
      return setGalat("Pilih file video terlebih dahulu, atau ganti sumber ke Tanpa video.");
    if (siap && sumber === "link" && !ytId && !igId)
      return setGalat("Link belum dikenali. Tempel link video YouTube atau reel/post Instagram.");
    if (sampul.tipe === "sendiri" && !fileSampul) return setGalat("Pilih gambar sampul terlebih dahulu.");
    if (sampul.tipe === "cuplikan" && !cuplikan[sampul.i]) return setGalat("Pilih ulang gambar sampul.");
    if (sampul.tipe === "instagram" && !sampulIgSiap) return setGalat("Pilih ulang gambar sampul.");
    if (siap && igId && (sampul.tipe === "kosong" || sampul.tipe === "youtube"))
      return setGalat(
        sampulIg?.kode === igId.kode && sampulIg.status === "memuat"
          ? "Sampul dari Instagram masih diambil. Tunggu sebentar, lalu simpan kembali."
          : "Video Instagram memerlukan gambar sampul. Unggah gambar sampul terlebih dahulu.",
      );

    setMenyimpan(true);
    const baruDiunggah: { bucket: string; path: string }[] = [];
    /**
     * Permintaan simpan ke server udah terkirim tapi jawabannya nggak
     * sampai (sinyal putus). Bisa jadi datanya UDAH tersimpan — jadi file
     * yang barusan diunggah jangan dibuang, nanti tim nunjuk file hilang.
     */
    let hasilTakPasti = false;
    try {
      // ---- 1. video (kolomnya belum ada → sumber video diabaikan) ----
      let video_url: string | null = null;
      if (siap && sumber === "upload") {
        if (videoBaru) {
          const ext = (videoBaru.name.split(".").pop() || "mp4").toLowerCase();
          const path = `tim-${Date.now()}-${acak()}.${ext}`;
          setProgres("Mengunggah video… 0%");
          video_url = await unggah(supabase, BUCKET_VIDEO, path, videoBaru, videoBaru.type || "video/mp4", (p) =>
            setProgres(`Mengunggah video… ${Math.round(p * 100)}%`),
          );
          baruDiunggah.push({ bucket: BUCKET_VIDEO, path });
        } else video_url = videoFileLama;
      } else if (siap && sumber === "link") {
        // Shorts disimpan tetap sebagai Shorts: pemutarnya beda (tegak).
        video_url = ytId
          ? youtubeShorts(link)
            ? `https://www.youtube.com/shorts/${ytId}`
            : `https://www.youtube.com/watch?v=${ytId}`
          : `https://www.instagram.com/${igId!.tipe}/${igId!.kode}/`;
      }

      // ---- 2. gambar sampul ----
      let photo_url: string | null = null;
      if (sampul.tipe === "cuplikan" || sampul.tipe === "sendiri" || sampul.tipe === "instagram") {
        setProgres("Mengunggah gambar sampul…");
        const berkas =
          sampul.tipe === "cuplikan" ? cuplikan[sampul.i].blob : sampul.tipe === "instagram" ? sampulIgSiap!.blob : fileSampul!;
        const path = `team-${Date.now()}-${acak()}.jpg`;
        photo_url = await unggah(supabase, BUCKET_FOTO, path, berkas, "image/jpeg");
        baruDiunggah.push({ bucket: BUCKET_FOTO, path });
      } else if (sampul.tipe === "lama") photo_url = awal?.photo_url ?? null;

      // ---- 3. simpan data tim ----
      /*
        Ubah tim → yang dikirim cuma kolom yang memang diubah di form ini.
        Kalau admin lain barusan ganti sampulnya, form yang dibuka sebelum
        itu (isinya udah basi) nggak menimpanya balik ke file yang udah
        dihapus — kecuali sampulnya juga diubah di sini.
      */
      const isi: Record<string, unknown> = {};
      const isiKalauBeda = (kolom: string, baru: unknown, lama: unknown) => {
        if (!awal || baru !== lama) isi[kolom] = baru;
      };
      isiKalauBeda("name", namaBersih, awal?.name);
      isiKalauBeda("photo_url", photo_url, awal?.photo_url ?? null);
      if (siap) {
        isiKalauBeda("video_url", video_url, awal?.video_url ?? null);
        isiKalauBeda("deskripsi", deskripsi.trim(), awal?.deskripsi ?? "");
      }
      if (awal && Object.keys(isi).length === 0) return onSelesai(); // nggak ada yang berubah
      if (awal) isi.id = awal.id;
      setProgres("Menyimpan data tim…");
      let res: Response;
      try {
        res = await fetch("/api/admin/vote-teams", {
          method: awal ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isi),
        });
      } catch {
        hasilTakPasti = true;
        throw new Error(
          "Koneksi terputus saat menyimpan. Muat ulang halaman untuk memastikan data tim sudah tersimpan sebelum mencoba lagi.",
        );
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Data tim gagal disimpan. Silakan coba lagi.");
      }

      // ---- 4. buang file lama yang udah diganti (kalau gagal, biarin) ----
      if (awal) {
        const buang: { bucket: string; path: string | null }[] = [];
        if (videoFileLama && video_url !== videoFileLama)
          buang.push({ bucket: BUCKET_VIDEO, path: pathDariUrlPublik(videoFileLama, BUCKET_VIDEO) });
        if (awal.photo_url && photo_url !== awal.photo_url)
          buang.push({ bucket: BUCKET_FOTO, path: pathDariUrlPublik(awal.photo_url, BUCKET_FOTO) });
        for (const b of buang) if (b.path) await buangFile(supabase, b.bucket, b.path);
      }

      onSelesai();
    } catch (e) {
      // Data tim PASTI nggak tersimpan → file yang barusan diunggah dibuang lagi.
      if (!hasilTakPasti) for (const b of baruDiunggah) await buangFile(supabase, b.bucket, b.path);
      setGalat(e instanceof Error ? e.message : "Data tim gagal disimpan. Silakan coba lagi.");
    } finally {
      setMenyimpan(false);
      setProgres(null);
    }
  };

  /** Gambar yang ditempel (Ctrl+V) di mana aja di form → jadi gambar sampul. Teks tetap ditempel biasa. */
  const tempelGambar = (e: ClipboardEvent) => {
    const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/"));
    if (!f) return;
    e.preventDefault();
    pilihGambar(f);
  };

  const kelasInput =
    "w-full rounded-md border border-white/20 bg-night px-3 py-2 font-alice text-sm text-white placeholder:text-white/40";
  const kelasLabel = "mb-1.5 block font-alice text-sm text-white/80";

  return (
    // Selama menyimpan semua isian dikunci: perubahan yang diketik di
    // tengah proses bakal hilang pas form-nya direset sesudah tersimpan.
    <fieldset disabled={menyimpan} className="min-w-0 space-y-5" onPaste={tempelGambar}>
      <div>
        <label className={kelasLabel} htmlFor={`nama-${awal?.id ?? "baru"}`}>
          Nama tim
        </label>
        <input
          id={`nama-${awal?.id ?? "baru"}`}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          maxLength={80}
          placeholder="Contoh: Tim Aurora"
          className={kelasInput}
        />
      </div>

      {!siap ? (
        <p className="rounded-lg border border-amber-300/30 bg-amber-300/5 p-3 font-alice text-sm text-amber-100">
          Video dan keterangan tim belum tersedia di database. Jalankan SQL yang tercantum di{" "}
          <code>src/app/api/admin/vote-teams/route.ts</code> pada SQL Editor Supabase. Sementara itu tim
          tetap dapat ditambahkan dengan gambar saja.
        </p>
      ) : (
        <>
          <div>
            <label className={kelasLabel} htmlFor={`desk-${awal?.id ?? "baru"}`}>
              Keterangan <span className="text-white/45">(opsional, tampil di pop-up detail)</span>
            </label>
            <textarea
              id={`desk-${awal?.id ?? "baru"}`}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              maxLength={600}
              rows={3}
              placeholder="Contoh: judul lagu, nama anggota, atau konsep penampilan."
              className={clsx(kelasInput, "resize-y")}
            />
          </div>

          {/* ---- Sumber video ----
              Radio asli (disamarkan, gayanya di <span>): panah kiri/kanan,
              Tab, dan pembaca layar langsung jalan tanpa kode tambahan. */}
          <fieldset>
            <legend className={kelasLabel}>Video</legend>
            <div className="grid grid-cols-1 gap-1 rounded-lg border border-white/10 bg-night/60 p-1 sm:grid-cols-3">
              {SUMBER.map((s) => (
                <label key={s.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`sumber-${idForm}`}
                    value={s.id}
                    checked={sumber === s.id}
                    onChange={() => setSumber(s.id)}
                    className="peer sr-only"
                  />
                  <span className="block rounded-md px-2 py-2.5 text-center font-alice text-xs uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10 hover:text-white peer-checked:bg-cyan-500/80 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-200 sm:text-[13px]">
                    {s.label}
                  </span>
                </label>
              ))}
            </div>

            {sumber === "upload" && (
              <div className="mt-3 space-y-2">
                {jenisAwal === "file" && !videoBaru && (
                  <p className="font-alice text-sm text-white/60">
                    Video saat ini tetap dipakai. Pilih file baru untuk menggantinya.
                  </p>
                )}
                <input
                  ref={inputVideo}
                  type="file"
                  accept={FORMAT_VIDEO}
                  onChange={(e) => pilihVideo(e.target.files?.[0] ?? null)}
                  className="w-full font-alice text-sm text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
                />
                <p className="font-alice text-xs text-white/50">
                  MP4 (H.264) paling aman diputar di semua HP. Maksimal {BATAS_VIDEO_MB} MB.
                </p>
                {mengolah && <p className="font-alice text-sm text-cyan-200">Membaca video…</p>}
                {videoBaru && durasi !== null && (
                  <p className="font-alice text-sm text-white/70">
                    {videoBaru.name} · {formatDurasi(durasi)} · {(videoBaru.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
                {galatVideo && (
                  <p role="alert" className="font-alice text-sm text-red-300">
                    {galatVideo}
                  </p>
                )}
              </div>
            )}

            {sumber === "link" && (
              <div className="mt-3 space-y-2">
                <label htmlFor={`${idForm}-link`} className="block font-alice text-xs text-white/60">
                  Tautan video
                </label>
                <input
                  id={`${idForm}-link`}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  inputMode="url"
                  placeholder="https://www.instagram.com/reel/…"
                  aria-describedby={`${idForm}-link-ket`}
                  aria-invalid={linkSalah || undefined}
                  className={kelasInput}
                />
                <div id={`${idForm}-link-ket`} aria-live="polite" className="space-y-2">
                {!link.trim() && (
                  <p className="font-alice text-xs leading-relaxed text-white/50">
                    Di Instagram, buka reel tim → ketuk ikon kirim atau titik tiga → <b>Salin tautan</b>, lalu
                    tempel di sini. Akun Instagram-nya harus publik. Link YouTube juga bisa.
                  </p>
                )}
                {ytId && <p className="font-alice text-sm text-cyan-200">Video YouTube terbaca.</p>}
                {igId && (
                  <p className="font-alice text-sm text-cyan-200">
                    {igId.tipe === "reel" ? "Reel" : "Post"} Instagram terbaca.{" "}
                    {sampulIg?.kode !== igId.kode || sampulIg.status === "memuat" ? (
                      <span className="text-white/60">Mengambil sampul dari Instagram…</span>
                    ) : sampulIg.status === "ok" ? (
                      <span className="text-white/70">
                        Sampul diambil otomatis dari Instagram; lihat pratinjau kartu di bawah.
                      </span>
                    ) : fileSampul || awal?.photo_url ? (
                      <span className="text-white/60">Sampul tidak dapat diambil otomatis dari Instagram.</span>
                    ) : (
                      <span className="text-amber-200">
                        Sampul tidak dapat diambil otomatis. Unggah tangkapan layar reel-nya sebagai gambar
                        sampul di bawah.
                      </span>
                    )}
                  </p>
                )}
                {linkSalah && (
                  <p className="font-alice text-sm text-red-300">
                    Link belum dikenali. Gunakan link video YouTube atau reel/post Instagram.
                  </p>
                )}
                </div>
              </div>
            )}
          </fieldset>
        </>
      )}

      {/* ---- Gambar sampul ---- */}
      <div>
        <p className={kelasLabel}>
          Gambar sampul{" "}
          <span className="text-white/45">
            {sumber === "upload" && siap
              ? "(pilih cuplikan atau unggah gambar sendiri)"
              : "(gambar tegak paling pas, misalnya screenshot reel)"}
          </span>
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
        {/* Kartu persis seperti yang dilihat pengunjung di halaman Vote. */}
        <div className="w-36 shrink-0">
          <p className="mb-1.5 font-alice text-xs text-white/50">Pratinjau kartu</p>
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/15 bg-night/70">
            <PosterTim
              nama={nama.trim()}
              sampul={gambarPratinjau}
              adaVideo={adaVideoNanti}
              jumlah={awal?.vote_count ?? 0}
              kecil
            />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 content-start gap-2 sm:grid-cols-3">
          {pilihanSampul.map((p) => {
            const aktif = samaDengan(p.pilihan, sampul);
            return (
              <button
                key={p.kunci}
                type="button"
                aria-pressed={aktif}
                onClick={() => setSampul(p.pilihan)}
                className={clsx(
                  "group overflow-hidden rounded-lg border text-left transition-colors",
                  aktif ? "border-cyan-300 ring-2 ring-cyan-300/60" : "border-white/15 hover:border-white/40",
                )}
              >
                {p.gambar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.gambar} alt="" className="aspect-video w-full bg-night object-cover" />
                ) : (
                  <span className="grid aspect-video w-full place-items-center bg-white/5" />
                )}
                <span
                  className={clsx(
                    "block px-2 py-1.5 font-alice text-xs",
                    aktif ? "bg-cyan-400/20 text-cyan-100" : "bg-white/5 text-white/70",
                  )}
                >
                  {p.label}
                </span>
              </button>
            );
          })}

          {/* Unggah gambar sendiri — klik, seret file ke sini, atau tempel. */}
          <button
            type="button"
            onClick={() => inputSampul.current?.click()}
            onDragOver={(e) => {
              if (!Array.from(e.dataTransfer.items).some((i) => i.kind === "file")) return;
              e.preventDefault();
              setDiseret(true);
            }}
            onDragLeave={() => setDiseret(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDiseret(false);
              pilihGambar(e.dataTransfer.files[0] ?? null);
            }}
            className={clsx(
              "grid aspect-video place-items-center rounded-lg border border-dashed px-2 text-center font-alice text-xs transition-colors",
              diseret
                ? "border-cyan-300 bg-cyan-400/10 text-cyan-100"
                : "border-white/25 text-white/65 hover:border-white/50 hover:text-white",
            )}
          >
            <span>
              {mengolahGambar ? "Memproses gambar…" : fileSampul ? "Ganti gambar" : "Unggah gambar"}
              <span className="mt-0.5 block text-[11px] text-white/45 [@media(hover:none)]:hidden">
                atau seret / tempel (Ctrl+V)
              </span>
            </span>
          </button>
          <input
            ref={inputSampul}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => pilihGambar(e.target.files?.[0] ?? null)}
          />
        </div>
        </div>
        {galatSampul && (
          <p role="alert" className="mt-2 font-alice text-sm text-red-300">
            {galatSampul}
          </p>
        )}
        {/* YouTube tanpa sampul = otomatis pakai thumbnail YouTube, jadi
            pilihan ini cuma buat sumber lain. Instagram wajib bersampul. */}
        {pilihanSampul.length > 0 && sampul.tipe !== "kosong" && !igId && !ytId && (
          <button
            type="button"
            onClick={() => setSampul({ tipe: "kosong" })}
            className="mt-2 font-alice text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
          >
            Tanpa gambar sampul
          </button>
        )}
      </div>

      {galat && (
        <p role="alert" className="font-alice text-sm text-red-300">
          {galat}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={simpan}
          disabled={menyimpan || mengolah || mengolahGambar}
          className="rounded-md bg-cyan-500/80 px-4 py-2 font-alice text-sm text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
        >
          {menyimpan ? "Menyimpan…" : awal ? "Simpan perubahan" : "Tambah tim"}
        </button>
        {onBatal && (
          <button
            type="button"
            onClick={onBatal}
            disabled={menyimpan}
            className="rounded-md border border-white/25 px-4 py-2 font-alice text-sm text-white/70 disabled:opacity-50"
          >
            Batal
          </button>
        )}
        {progres && (
          <span role="status" className="font-alice text-sm text-cyan-200">
            {progres}
          </span>
        )}
      </div>
    </fieldset>
  );
}

const acak = () => Math.random().toString(36).slice(2, 8);

/**
 * Hapus satu file di Storage. Gagal = dicatat aja, nggak bikin proses
 * simpan gagal. (Supabase nggak melempar galat — galatnya dikembalikan di
 * `{ error }`, jadi `.catch()` doang nggak nangkep apa-apa.)
 */
async function buangFile(supabase: ReturnType<typeof createClient>, bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.warn("[vote] file lama gagal dihapus:", bucket, path, error.message);
}

/**
 * Codec video di dalam file MP4/MOV, dibaca dari kotak `stsd` (daftar
 * format sampel). Bukan nyari teks "avc1" sembarangan di seluruh file —
 * data video acak bisa kebetulan berisi 4 huruf itu.
 */
async function codecVideo(file: File): Promise<"h264" | "hevc" | "lain"> {
  const d = new Uint8Array(await file.arrayBuffer());
  const huruf = (i: number) => String.fromCharCode(d[i], d[i + 1], d[i + 2], d[i + 3]);
  let h264 = false;
  for (let i = 4; i < d.length - 20; i++) {
    // "stsd" = 73 74 73 64
    if (d[i] !== 0x73 || d[i + 1] !== 0x74 || d[i + 2] !== 0x73 || d[i + 3] !== 0x64) continue;
    const jumlah = (d[i + 8] << 24) | (d[i + 9] << 16) | (d[i + 10] << 8) | d[i + 11];
    if (jumlah < 1 || jumlah > 8) continue;
    const tipe = huruf(i + 16);
    if (tipe === "hvc1" || tipe === "hev1") return "hevc";
    if (tipe === "avc1" || tipe === "avc3") h264 = true;
  }
  return h264 ? "h264" : "lain";
}

/** Perkecil gambar ke sisi terpanjang `sisi` px & jadiin JPEG. HEIC dll. → melempar. */
async function kecilkanGambar(f: Blob, sisi: number): Promise<Blob> {
  const bmp = await createImageBitmap(f);
  const skala = Math.min(1, sisi / Math.max(bmp.width, bmp.height));
  const kanvas = document.createElement("canvas");
  kanvas.width = Math.round(bmp.width * skala);
  kanvas.height = Math.round(bmp.height * skala);
  kanvas.getContext("2d")!.drawImage(bmp, 0, 0, kanvas.width, kanvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((ok) => kanvas.toBlob(ok, "image/jpeg", 0.86));
  if (!blob) throw new Error("gagal");
  return blob;
}

/**
 * Tiga cuplikan (15%, 50%, 85% durasi) dari video yang dipilih, jadi
 * JPEG maks. lebar 1280px. Sekalian ngecek videonya bisa diputar di
 * browser: video HEVC/.mov iPhone sering nggak bisa di Chrome — kalau
 * di sini gagal dibaca, di halaman Vote juga bakal gagal.
 */
async function ambilCuplikan(file: File): Promise<{ durasi: number; cuplikan: Cuplikan[] }> {
  const src = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = src;
  try {
    await new Promise<void>((ok, gagal) => {
      const t = window.setTimeout(() => gagal(new Error("waktu habis")), 20000);
      v.onloadeddata = () => (window.clearTimeout(t), ok());
      v.onerror = () => (window.clearTimeout(t), gagal(new Error("format")));
    });
    if (!v.videoWidth || !v.videoHeight) throw new Error("format");

    // Sebagian file (mis. rekaman layar) durasinya "Infinity" sampai
    // diputar habis — pakai detik tetap aja.
    const d = Number.isFinite(v.duration) ? v.duration : 0;
    const titik = d > 0 ? [0.15, 0.5, 0.85].map((p) => Math.min(d - 0.05, d * p)) : [0.5, 1.5, 3];

    const lebar = Math.min(1280, v.videoWidth);
    const tinggi = Math.round((v.videoHeight * lebar) / v.videoWidth);
    const kanvas = document.createElement("canvas");
    kanvas.width = lebar;
    kanvas.height = tinggi;
    const ctx = kanvas.getContext("2d")!;

    const hasil: Cuplikan[] = [];
    for (const t of titik) {
      v.currentTime = Math.max(0, t);
      await new Promise<void>((ok) => {
        v.onseeked = () => ok();
        window.setTimeout(ok, 4000);
      });
      ctx.drawImage(v, 0, 0, lebar, tinggi);
      const blob = await new Promise<Blob | null>((ok) => kanvas.toBlob(ok, "image/jpeg", 0.85));
      if (blob) hasil.push({ url: URL.createObjectURL(blob), blob });
    }
    return { durasi: d, cuplikan: hasil };
  } finally {
    v.removeAttribute("src");
    v.load();
    URL.revokeObjectURL(src);
  }
}

/**
 * Unggah satu file ke Supabase Storage, dengan progres.
 *
 * Sengaja pakai XMLHttpRequest, bukan `supabase.storage.upload()`:
 * yang itu nggak ngasih tau progres, padahal video puluhan MB bisa makan
 * semenit — tanpa angka admin bakal ngira halamannya macet.
 */
async function unggah(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
  berkas: Blob,
  tipe: string,
  onProgres?: (p: number) => void,
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sesi admin sudah berakhir. Silakan masuk kembali.");

  await new Promise<void>((ok, gagal) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", tipe);
    // Nama file selalu baru tiap unggahan, jadi aman di-cache setahun.
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgres?.(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status < 300 ? ok() : gagal(new Error(pesanGagalUnggah(xhr.status, xhr.responseText, bucket))));
    xhr.onerror = () => gagal(new Error("Koneksi terputus saat mengunggah. Periksa jaringan Anda, lalu coba lagi."));
    // 50 MB di koneksi lambat (±1 Mbps) makan ±7 menit; lewat 15 menit anggap macet.
    xhr.timeout = 15 * 60 * 1000;
    xhr.ontimeout = () => gagal(new Error("Unggahan terlalu lama dan dihentikan. Periksa jaringan Anda, lalu coba lagi."));
    xhr.send(berkas);
  });

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Pesan galat Supabase Storage → kalimat yang bisa ditindaklanjuti admin. */
function pesanGagalUnggah(status: number, teks: string, bucket: string) {
  const isi = teks.toLowerCase();
  if (status === 413 || isi.includes("maximum allowed size") || isi.includes("too large"))
    return `Ukuran file melebihi batas penyimpanan Supabase. Kompres video terlebih dahulu (maks. ${BATAS_VIDEO_MB} MB di paket gratis).`;
  if (isi.includes("bucket not found"))
    return `Tempat penyimpanan "${bucket}" belum dibuat. Jalankan SQL yang tercantum di src/app/api/admin/vote-teams/route.ts pada SQL Editor Supabase.`;
  if (status === 401 || status === 403 || isi.includes("row-level security") || isi.includes("unauthorized"))
    return "Akun ini belum diizinkan mengunggah file. Pastikan Anda masuk sebagai admin dan SQL izin penyimpanan sudah dijalankan.";
  return "File gagal diunggah. Silakan coba lagi.";
}

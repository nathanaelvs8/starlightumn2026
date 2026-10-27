"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { IkonPutar, PosterTim } from "@/components/site/PosterTim";
import clsx from "@/lib/clsx";
import { formatWaktuTutup, type StatusVoting } from "@/lib/statusVoting";
import { idInstagram, idYoutube, jenisVideo, sampulTim, youtubeShorts, type TimVote } from "@/lib/videoTim";

type Team = TimVote;
type Kabar = { tipe: "ok" | "galat"; teks: string } | null;

export function VoteBoard() {
  const [teams, setTeams] = useState<Team[]>([]);
  /** Dihitung server (src/lib/statusVoting.ts), termasuk waktu tutupnya. */
  const [status, setStatus] = useState<StatusVoting>("belum");
  const [ditutupPada, setDitutupPada] = useState<string | null>(null);
  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  /** Data voting gagal dimuat (jaringan putus / server galat). */
  const [galatMuat, setGalatMuat] = useState<{ teks: string; perluMasuk: boolean } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  /**
   * Kabar hasil voting, buat ditaruh di live region.
   *
   * Dulu satu-satunya tanda kalau suara tersimpan itu border kartunya
   * berubah warna. Di HP kartunya sering udah di luar layar pas
   * tombolnya ditekan, dan yang pakai screen reader nggak dapet apa-apa
   * sama sekali — di seluruh `src/` nggak ada satu pun aria-live.
   *
   * Yang gagal juga dulu muncul sebagai alert() bawaan browser berisi
   * teks mentah dari Postgres. Sekarang dua-duanya lewat sini.
   */
  const [kabar, setKabar] = useState<Kabar>(null);
  /** Percikan bintang di tombol tim yang barusan dipilih. `n` = kunci baru tiap vote. */
  const [percik, setPercik] = useState<{ id: string; n: number } | null>(null);
  /**
   * Tim yang lagi dibuka di detail (video + keterangan). Halaman ini
   * tetap halaman VOTE: tombol pilih ada di kartu, detail cuma buat yang
   * mau nonton dulu — dan di dalamnya juga ada tombol pilih.
   */
  const [detail, setDetail] = useState<string | null>(null);
  /** Elemen yang membuka detail — fokus dikembalikan ke sini pas ditutup. */
  const pemicu = useRef<HTMLElement | null>(null);

  /**
   * Buka detail = tambah satu langkah di riwayat browser (`?tim=<id>`).
   * Jadi tombol back HP nutup detail dulu, bukan langsung keluar dari
   * halaman Vote — di HP detailnya layar penuh, orang pasti mencet back.
   * Link `?tim=<id>` juga bisa dibagikan: dibuka langsung ke detail tim itu.
   */
  const bukaDetail = (id: string, el: HTMLElement | null) => {
    pemicu.current = el;
    setKabar(null);
    setDetail(id);
    window.history.pushState({ ...window.history.state, detailTim: id }, "", `?tim=${encodeURIComponent(id)}`);
  };
  const tutupDetail = () => {
    if (window.history.state?.detailTim) window.history.back();
    else {
      // Dibuka langsung dari link: nggak ada langkah buat di-back.
      window.history.replaceState({ ...window.history.state, detailTim: undefined }, "", window.location.pathname);
      setDetail(null);
    }
  };
  useEffect(() => {
    const onPop = () => setDetail(window.history.state?.detailTim ?? null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  /* Detail ditutup (tombol, Esc, atau back) → fokus balik ke pembukanya. */
  const detailSebelumnya = useRef<string | null>(null);
  useEffect(() => {
    if (detailSebelumnya.current && !detail) pemicu.current?.focus({ preventScroll: true });
    detailSebelumnya.current = detail;
  }, [detail]);

  /**
   * Muat data voting. Balikin `true` kalau berhasil.
   *
   * `diam`: penyegaran sesudah vote — kalau gagal, data lama dibiarin
   * tampil (nggak diganti layar galat), yang manggil yang ngabarin.
   */
  const muat = async (diam = false): Promise<boolean> => {
    try {
      const res = await fetch("/api/vote", { cache: "no-store" });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!diam)
          setGalatMuat({
            teks: r.error ?? "Data voting gagal dimuat. Silakan coba lagi.",
            perluMasuk: res.status === 401,
          });
        return false;
      }
      setTeams(r.teams ?? []);
      setStatus(["belum", "buka", "lewat", "selesai"].includes(r.status) ? r.status : "belum");
      setDitutupPada(r.ditutup_pada ?? null);
      setMyTeam(r.my_team_id ?? null);
      setGalatMuat(null);
      return true;
    } catch {
      if (!diam)
        setGalatMuat({ teks: "Koneksi terputus. Periksa jaringan Anda, lalu coba lagi.", perluMasuk: false });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muat().then((ok) => {
      const awal = new URLSearchParams(window.location.search).get("tim");
      if (ok && awal) setDetail(awal);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Halamannya kebuka pas jam tutup lewat → muat ulang sendiri, biar
     langsung bilang "sudah ditutup" (bukan nunggu orangnya mencet Pilih). */
  useEffect(() => {
    if (status !== "buka" || !ditutupPada) return;
    const sisa = Date.parse(ditutupPada) - Date.now();
    if (!(sisa > 0 && sisa < 86_400_000)) return;
    const t = window.setTimeout(() => muat(true), sisa + 1500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, ditutupPada]);

  /*
    Data ikut berubah tanpa muat ulang: langsung pas orangnya balik ke tab
    ini, dan tiap 60 detik selama voting dibuka. Sengaja jarang (admin tiap
    5 detik): pengunjungnya banyak, dan tiap ambil data = beberapa kueri.
  */
  const menyimpanKini = useRef(false);
  menyimpanKini.current = saving !== null;
  const muatTerbaru = useRef(muat);
  muatTerbaru.current = muat;
  useEffect(() => {
    const segarkan = () => {
      if (document.visibilityState === "visible" && !menyimpanKini.current) muatTerbaru.current(true);
    };
    const t = status === "buka" ? window.setInterval(segarkan, 60_000) : undefined;
    document.addEventListener("visibilitychange", segarkan);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", segarkan);
    };
  }, [status]);

  const vote = async (teamId: string) => {
    if (saving) return;
    setSaving(teamId);
    setKabar(null);

    const nama = teams.find((t) => t.id === teamId)?.name ?? "tim itu";

    /*
      Dibungkus try/catch karena `fetch` melempar — bukan mengembalikan
      respons — kalau jaringannya putus di tengah jalan. Tanpa ini,
      sinyal yang hilang pas tombol ditekan bikin tombolnya nyangkut di
      "Menyimpan…" selamanya tanpa ada penjelasan apa pun.
    */
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setKabar({
          tipe: "galat",
          teks: d.error ?? "Suara Anda gagal tersimpan. Silakan coba lagi.",
        });
        // Voting ternyata udah ditutup (jam tutup lewat) → tampilan ikut berubah.
        if (d.status && d.status !== "buka") await muat(true);
        return;
      }

      /*
        Suaranya UDAH tersimpan di titik ini. Penyegaran jumlah suara di
        bawah bisa gagal sendiri (sinyal putus pas itu) — dulu kegagalan
        itu ikut dilaporkan "Koneksi terputus", seolah suaranya hilang,
        dan orangnya vote ulang.
      */
      const ganti = myTeam !== null && myTeam !== teamId;
      setMyTeam(teamId);
      setPercik({ id: teamId, n: Date.now() });
      const segar = await muat(true);
      /* Momen yang pas buat ngasih tau: banyak yang ngira pilihannya
         permanen begitu dipencet. */
      setKabar({
        tipe: "ok",
        teks:
          (ganti ? `Pilihan Anda telah diganti ke ${nama}.` : `Suara Anda untuk ${nama} telah tercatat.`) +
          (segar
            ? " Pilihan dapat diganti atau dibatalkan sampai voting ditutup."
            : " Jumlah suara akan diperbarui saat halaman dimuat ulang."),
      });
    } catch {
      setKabar({
        tipe: "galat",
        teks: "Koneksi terputus. Periksa jaringan Anda, lalu coba lagi.",
      });
    } finally {
      setSaving(null);
    }
  };

  /** Batalkan pilihan sendiri — orangnya jadi belum memilih siapa pun. */
  const batalkan = async () => {
    if (saving || !myTeam) return;
    const teamId = myTeam;
    const nama = teams.find((t) => t.id === teamId)?.name ?? "tim itu";
    setSaving(teamId);
    setKabar(null);
    try {
      const res = await fetch("/api/vote", { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setKabar({ tipe: "galat", teks: d.error ?? "Pilihan Anda gagal dibatalkan. Silakan coba lagi." });
        if (d.status && d.status !== "buka") await muat(true);
        return;
      }
      setMyTeam(null);
      await muat(true);
      setKabar({
        tipe: "ok",
        teks: `Pilihan Anda untuk ${nama} telah dibatalkan. Anda dapat memilih lagi selama voting dibuka.`,
      });
    } catch {
      setKabar({ tipe: "galat", teks: "Koneksi terputus. Periksa jaringan Anda, lalu coba lagi." });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <p className="mt-10 text-center font-alice text-white/60">Memuat…</p>
    );
  }

  // Gagal dimuat → bilang terus terang, kasih jalan keluar.
  if (galatMuat) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center text-center">
        <TitleGlow className="text-4xl sm:text-5xl">Vote</TitleGlow>
        <p role="alert" className="mt-6 max-w-md font-alice text-white/80">
          {galatMuat.teks}
        </p>
        <div className="mt-8">
          {galatMuat.perluMasuk ? (
            <a
              href="/login?next=/vote"
              className="inline-flex min-h-11 items-center rounded-pill bg-emas px-7 font-alice text-sm font-bold uppercase tracking-[0.12em] text-night"
            >
              Masuk Kembali
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                muat();
              }}
              className="inline-flex min-h-11 items-center rounded-pill border border-white/35 bg-white/5 px-7 font-alice text-sm font-bold uppercase tracking-[0.12em] text-white [@media(hover:hover)]:hover:bg-white/15"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    );
  }

  const pilihanSaya = myTeam ? teams.find((t) => t.id === myTeam) : undefined;
  /* Pilihan sekarang selalu kelihatan — nggak perlu nyari kartu yang
     menyala di antara banyak kartu buat memastikan suaranya masuk. */
  const ringkasanPilihan = pilihanSaya && (
    <p className="mx-auto mt-4 w-fit max-w-full break-words rounded-pill border border-cyan-300/40 bg-cyan-400/10 px-4 py-1.5 text-center font-alice text-sm text-cyan-100">
      <span aria-hidden>✓ </span>Pilihan Anda: {pilihanSaya.name}
    </p>
  );

  /*
    Voting selesai → rekap, BUKAN pengumuman pemenang. Babaknya masih
    eliminasi: nggak ada peringkat, nggak ada tim yang disorot "juara" /
    "suara terbanyak" (tim yang di bawah kebaca kayak kalah duluan).
    Penetapan resminya dari panitia. Urutannya sama kayak di halaman vote.

    Jumlah suaranya ikut saklar admin — disembunyikan = cuma ucapan terima
    kasih + pilihan sendiri.
  */
  if (status === "selesai") {
    const adaJumlah = teams.length > 0 && teams.every((t) => t.vote_count !== null);
    return (
      <div className="min-h-[80svh] pb-28 pt-4">
        <TitleGlow className="text-center text-4xl sm:text-5xl">
          Voting Selesai
        </TitleGlow>
        <p className="mx-auto mt-4 max-w-md text-center font-alice text-white/70">
          Terima kasih atas partisipasi Anda. Hasil resmi diumumkan melalui kanal resmi Starlight UMN 2026.
        </p>
        {!adaJumlah && ringkasanPilihan}

        {adaJumlah && (
          <div className="mx-auto mt-10 max-w-2xl space-y-3">
            {teams.map((t) => {
              const pilihan = t.id === myTeam;
              return (
                <div
                  key={t.id}
                  className={clsx(
                    "flex items-center gap-4 rounded-xl border bg-white/5 p-3",
                    pilihan ? "border-cyan-300/60" : "border-white/15",
                  )}
                >
                  {sampulTim(t) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sampulTim(t)!}
                      alt={t.name}
                      draggable={false}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-white/10 font-alice text-xs text-white/40">
                      Tanpa foto
                    </div>
                  )}
                  <p className="min-w-0 flex-1 break-words font-alice text-white">
                    {t.name}
                    {pilihan && (
                      <span className="mt-0.5 block font-alice text-xs text-cyan-200">✓ Pilihan Anda</span>
                    )}
                  </p>
                  <span className="shrink-0 font-alice text-sm text-cyan-200/80">
                    {t.vote_count} suara
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Belum dibuka, atau jam tutupnya udah lewat → pesan, tanpa daftar tim.
  if (status !== "buka") {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center text-center">
        <TitleGlow className="text-4xl sm:text-5xl">Vote</TitleGlow>
        <p className="mt-6 max-w-md font-alice text-white/70">
          {status === "lewat"
            ? `Voting telah ditutup${ditutupPada ? ` ${formatWaktuTutup(ditutupPada)}` : ""}. Terima kasih atas partisipasi Anda. Hasil akan diumumkan melalui kanal resmi Starlight UMN 2026.`
            : "Voting belum dibuka. Nantikan informasi selanjutnya melalui kanal resmi Starlight UMN 2026."}
        </p>
        {status === "lewat" && ringkasanPilihan}
      </div>
    );
  }

  const timDetail = detail ? teams.find((t) => t.id === detail) : undefined;

  return (
    <div className="py-4">
      <TitleGlow className="text-center text-4xl sm:text-5xl">Vote</TitleGlow>
      <p className="mt-3 text-center font-alice text-white/70">
        Pilih satu tim.{" "}
        {ditutupPada ? (
          <>
            Pilihan dapat diganti atau dibatalkan sampai voting ditutup{" "}
            <span className="text-white">{formatWaktuTutup(ditutupPada)}</span>.
          </>
        ) : (
          "Pilihan dapat diganti atau dibatalkan selama periode voting masih berlangsung."
        )}
      </p>
      {ringkasanPilihan}

      {/*
        Live region.

        `role="status"` + `aria-live="polite"` bikin screen reader
        membacakan isinya begitu berubah, tanpa motong apa yang lagi
        dibaca. Elemennya SELALU ada di DOM (cuma isinya yang kosong
        pas belum ada kabar) — kalau elemennya sendiri yang muncul-
        hilang, sebagian screen reader nggak mengumumkan apa-apa.

        Warnanya ngikut yang udah dipakai halaman ini: cyan buat
        berhasil, merah lembut buat gagal. Nggak ada warna baru.
      */}
      <div
        role="status"
        aria-live="polite"
        className="mx-auto mt-4 flex min-h-[1.5rem] max-w-md justify-center px-4"
      >
        {kabar && !detail && (
          <p
            className={`text-center font-alice text-sm ${
              kabar.tipe === "ok" ? "text-cyan-200" : "text-red-200"
            }`}
          >
            {kabar.tipe === "ok" && <span aria-hidden>✦ </span>}
            {kabar.teks}
          </p>
        )}
      </div>

      {/* Dua kolom di HP: orang bisa lihat semua pilihan sekilas, nggak
          perlu scroll jauh cuma buat tau ada tim apa aja. */}
      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {teams.map((t) => (
          <KartuTim
            key={t.id}
            tim={t}
            dipilih={myTeam === t.id}
            ganti={!!myTeam && myTeam !== t.id}
            menyimpan={saving === t.id}
            sibuk={saving !== null}
            onVote={() => vote(t.id)}
            onBatal={batalkan}
            onDetail={(el) => bukaDetail(t.id, el)}
            percik={!detail && percik?.id === t.id ? percik.n : null}
          />
        ))}
      </div>

      {timDetail && (
        <DetailTim
          // Tim lain = detail baru (orientasi video, posisi scroll, dll. mulai dari nol).
          key={timDetail.id}
          tim={timDetail}
          dipilih={myTeam === timDetail.id}
          ganti={!!myTeam && myTeam !== timDetail.id}
          menyimpan={saving === timDetail.id}
          sibuk={saving !== null}
          onVote={() => vote(timDetail.id)}
          onBatal={batalkan}
          kabar={kabar}
          percik={percik?.id === timDetail.id ? percik.n : null}
          onTutup={tutupDetail}
        />
      )}

      {teams.length === 0 && (
        <p className="mt-10 text-center font-alice text-white/50">
          Belum ada tim yang bisa dipilih.
        </p>
      )}
    </div>
  );
}

/**
 * Tombol pilih. Emas = tombol utama situs (sama kayak Button "solid");
 * yang udah dipilih jadi cyan, warna "berhasil" yang dipakai halaman ini.
 *
 * `sibuk`: ada suara lain yang lagi disimpan — semua tombol pilih ikut
 * terkunci, biar nggak kelihatan bisa dipencet padahal nggak ngapa-ngapain.
 *
 * `ganti`: orangnya udah milih tim LAIN — mencet ini memindahkan suaranya,
 * dan tombolnya bilang begitu ("Ganti pilihan").
 *
 * Tim yang dipilih: tombolnya tetap bisa dipencet buat MEMBATALKAN, dan
 * baris keduanya bilang begitu — banyak yang ngira pilihannya permanen.
 * Dua langkah (pencet → "Batalkan pilihan?" → pencet lagi) biar nggak
 * kebatal gara-gara kesenggol jempol; 4 detik dibiarin → balik semula.
 */
function TombolPilih({
  nama,
  dipilih,
  ganti,
  menyimpan,
  sibuk,
  onVote,
  onBatal,
  percik,
  besar,
}: {
  /** Buat nama aksesibel di kartu ("Pilih Tim Aurora"); di detail nggak perlu. */
  nama?: string;
  dipilih: boolean;
  ganti: boolean;
  menyimpan: boolean;
  sibuk: boolean;
  onVote: () => void;
  onBatal: () => void;
  percik: number | null;
  besar?: boolean;
}) {
  const [yakin, setYakin] = useState(false);
  useEffect(() => {
    if (!yakin) return;
    const t = window.setTimeout(() => setYakin(false), 4000);
    return () => window.clearTimeout(t);
  }, [yakin]);
  useEffect(() => {
    setYakin(false);
  }, [dipilih]);

  const tekan = () => {
    if (!dipilih) return onVote();
    if (!yakin) return setYakin(true);
    setYakin(false);
    onBatal();
  };

  const [utama, keterangan] = dipilih
    ? menyimpan
      ? ["Membatalkan…", null]
      : yakin
        ? // Kartu HP sempit: versi panjangnya pecah 2 baris & bikin kartunya melar.
          [besar ? "Batalkan pilihan?" : "Batalkan?", "Tekan sekali lagi"]
        : ["✓ Pilihan Anda", "Tekan untuk membatalkan"]
    : [
        menyimpan ? "Menyimpan…" : besar ? (ganti ? "Ganti pilihan ke tim ini" : "Pilih tim ini") : ganti ? "Ganti pilihan" : "Pilih",
        null,
      ];

  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={tekan}
        onBlur={() => setYakin(false)}
        disabled={menyimpan || sibuk}
        aria-label={
          nama && !menyimpan
            ? dipilih
              ? yakin
                ? `Tekan sekali lagi untuk membatalkan pilihan ${nama}`
                : `Pilihan Anda: ${nama}. Tekan untuk membatalkan`
              : ganti
                ? `Ganti pilihan ke ${nama}`
                : `Pilih ${nama}`
            : undefined
        }
        className={clsx(
          "flex w-full flex-col items-center justify-center rounded-pill px-3 font-alice transition-[background-color,border-color,box-shadow,opacity] duration-200",
          besar ? "min-h-12" : "min-h-11",
          keterangan ? "py-1.5" : besar ? "py-3.5" : "py-2.5",
          dipilih
            ? yakin
              ? "border border-red-300/60 bg-red-400/15 text-red-100"
              : "border border-cyan-300/60 bg-cyan-400/20 text-cyan-100 disabled:opacity-60 [@media(hover:hover)]:hover:border-cyan-200 [@media(hover:hover)]:hover:bg-cyan-400/30"
            : "bg-emas text-night shadow-[0_0_20px_rgb(var(--c-emas-rgb)/0.3)] disabled:opacity-60 [@media(hover:hover)]:hover:shadow-[0_0_30px_rgb(var(--c-emas-rgb)/0.5)]",
        )}
      >
        <span className={clsx("font-bold uppercase tracking-[0.1em]", besar ? "text-sm sm:text-base" : "text-xs sm:text-[13px]")}>
          {utama}
        </span>
        {keterangan && (
          <span className={clsx("leading-tight opacity-80", besar ? "text-xs" : "text-[10px] sm:text-[11px]")}>{keterangan}</span>
        )}
      </button>
      {percik !== null && <Percikan key={percik} />}
    </div>
  );
}

/**
 * Satu tim di halaman Vote: poster tegak (nama & jumlah suara di atas
 * gradasi gelap), lalu dua tombol — Pilih dan Lihat Detail.
 *
 * Posternya sendiri juga membuka detail, tapi sengaja BUKAN tombol: buat
 * jari/mouse itu target paling besar, sementara pembaca layar & keyboard
 * cukup pakai tombol "Lihat Detail" — nggak ada dua tombol kembar.
 * Videonya nggak diputar di sini; nontonnya di detail.
 */
function KartuTim({
  tim,
  dipilih,
  ganti,
  menyimpan,
  sibuk,
  onVote,
  onBatal,
  onDetail,
  percik,
}: {
  tim: Team;
  dipilih: boolean;
  ganti: boolean;
  menyimpan: boolean;
  sibuk: boolean;
  onVote: () => void;
  onBatal: () => void;
  onDetail: (pemicu: HTMLElement) => void;
  percik: number | null;
}) {
  const tombolDetail = useRef<HTMLButtonElement>(null);
  return (
    <div
      className={clsx(
        "flex flex-col overflow-hidden rounded-2xl border bg-white/5 backdrop-blur transition-[border-color,box-shadow] duration-300",
        dipilih ? "border-cyan-300/80 shadow-[0_0_28px_rgba(103,232,249,0.35)]" : "border-white/15",
      )}
    >
      <div
        onClick={() => tombolDetail.current && onDetail(tombolDetail.current)}
        className="group relative block aspect-[3/4] w-full cursor-pointer overflow-hidden bg-night/70"
      >
        <PosterTim
          nama={tim.name}
          sampul={sampulTim(tim, "poster")}
          adaVideo={!!jenisVideo(tim.video_url)}
          jumlah={tim.vote_count ?? undefined}
        />
      </div>

      <div className="flex flex-col gap-2 p-2.5 sm:flex-row sm:p-3">
        <TombolPilih
          nama={tim.name}
          dipilih={dipilih}
          ganti={ganti}
          menyimpan={menyimpan}
          sibuk={sibuk}
          onVote={onVote}
          onBatal={onBatal}
          percik={percik}
        />
        <button
          ref={tombolDetail}
          type="button"
          onClick={(e) => onDetail(e.currentTarget)}
          aria-label={`Lihat detail ${tim.name}`}
          className="min-h-11 flex-1 rounded-pill border border-white/30 bg-white/5 px-3 py-2.5 font-alice text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors sm:text-[13px] [@media(hover:hover)]:hover:bg-white/15"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
}

const GLOW_GARIS = "drop-shadow(0 0 2px rgba(255,255,255,0.8)) drop-shadow(0 0 8px rgba(190,184,255,0.6))";

/**
 * Detail satu tim.
 *
 * Di HP: layar penuh (kayak halaman sendiri) dengan panah kembali di
 * atas — tombol back HP juga nutup ini (lihat bukaDetail di VoteBoard).
 * Nama timnya muncul di bilah atas begitu judul besar di bawah video
 * nggak kelihatan, jadi orang selalu tau lagi lihat tim siapa.
 * Di layar lebar: panel di tengah, latarnya diredupkan. Video tegak
 * (reel, Shorts, video HP) → dua kolom: video kiri, info & tombol kanan.
 *
 * Urutan isinya: video → nama & jumlah suara → tombol pilih → keterangan.
 * Videonya NGGAK langsung diputar; orang mencet putar sendiri.
 *
 * Di HP tombol pilih nempel di bawah layar selama posisi aslinya masih di
 * bawah lipatan — reel Instagram / video tegak tingginya hampir selayar,
 * tanpa ini tombolnya baru kelihatan setelah di-scroll.
 */
function DetailTim({
  tim,
  dipilih,
  ganti,
  menyimpan,
  sibuk,
  onVote,
  onBatal,
  kabar,
  percik,
  onTutup,
}: {
  tim: Team;
  dipilih: boolean;
  ganti: boolean;
  menyimpan: boolean;
  sibuk: boolean;
  onVote: () => void;
  onBatal: () => void;
  kabar: Kabar;
  percik: number | null;
  onTutup: () => void;
}) {
  const akar = useRef<HTMLDivElement>(null);
  const judul = useRef<HTMLHeadingElement>(null);
  /* Lewat ref: `onTutup` dari induknya fungsi baru tiap render — kalau
     jadi dependency efek di bawah, tiap vote fokusnya ketarik balik. */
  const onTutupRef = useRef(onTutup);
  onTutupRef.current = onTutup;

  const jenis = jenisVideo(tim.video_url);
  const adaMedia = !!jenis || !!sampulTim(tim);
  /**
   * Videonya tegak? Nentuin bentuk pemutar & tata letak desktop. Video
   * unggahan dianggap tegak sampai metadatanya bilang melebar —
   * kebanyakan yang diunggah memang reel.
   */
  const [tegak, setTegak] = useState(jenis === "youtube" ? youtubeShorts(tim.video_url) : true);
  const samping = adaMedia && tegak;
  const sumber = sumberVideo(tim);
  /** Judul besar (di bawah video) kelihatan di layar? */
  const [judulTerlihat, setJudulTerlihat] = useState(true);

  useEffect(() => {
    // Fokus ke dialognya sendiri, bukan ke tombol tutup: pembaca layar
    // langsung membacakan nama timnya, dan cincin fokus nggak nongol di
    // tombol × tiap kali detail dibuka pakai mouse / jari.
    akar.current?.focus({ preventScroll: true });
    const awalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutupRef.current();
    };
    window.addEventListener("keydown", onKey);

    /*
      Halaman di belakang dibikin `inert`: nggak bisa di-Tab, diklik, atau
      dibaca pembaca layar selama detail terbuka. `aria-modal` sendiri
      cuma "janji" — tanpa ini Tab bisa keluar ke kartu di belakang.
    */
    const dialog = akar.current;
    const diinert: Element[] = [];
    if (dialog)
      for (const el of Array.from(document.body.children)) {
        if (el === dialog || el.contains(dialog) || el.hasAttribute("inert")) continue;
        el.setAttribute("inert", "");
        diinert.push(el);
      }

    return () => {
      document.body.style.overflow = awalOverflow;
      window.removeEventListener("keydown", onKey);
      diinert.forEach((el) => el.removeAttribute("inert"));
    };
  }, []);

  useEffect(() => {
    const el = judul.current;
    if (!el || !akar.current) return;
    const io = new IntersectionObserver(([e]) => setJudulTerlihat(e.isIntersecting), {
      root: akar.current,
      // Dipotong bilah atas & tombol pilih yang nempel di bawah.
      rootMargin: "-56px 0px -88px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return createPortal(
    <div
      ref={akar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="judul-detail-tim"
      tabIndex={-1}
      className="tim-modal fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-night outline-none sm:bg-night/80 sm:backdrop-blur-sm"
      onClick={onTutup}
    >
      <div className="min-h-full sm:flex sm:items-center sm:justify-center sm:p-8">
        <article
          className={clsx(
            // `overflow-clip`, bukan `hidden`: `hidden` bikin panel ini jadi
            // wadah scroll sendiri, dan tombol pilih nggak bisa nempel lagi.
            "detail-masuk relative flex min-h-[100svh] w-full flex-col bg-night sm:min-h-0 sm:max-w-3xl sm:overflow-clip sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-[0_24px_90px_rgba(0,0,0,0.65)]",
            samping &&
              "lg:grid lg:h-[var(--tinggi-panel)] lg:max-w-5xl lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:[--tinggi-panel:min(52rem,calc(100svh-4rem))]",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bilah atas: panah kembali + nama tim di HP, silang di layar lebar. */}
          <div
            className={clsx(
              "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1 bg-night/90 px-2 backdrop-blur sm:static sm:justify-end sm:bg-transparent sm:backdrop-blur-none",
              samping && "lg:absolute lg:right-2 lg:top-2",
            )}
          >
            <button
              type="button"
              onClick={onTutup}
              aria-label="Tutup detail"
              className="grid h-11 w-11 shrink-0 place-items-center text-white/80 transition-colors [@media(hover:hover)]:hover:text-white"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 sm:hidden" style={{ filter: GLOW_GARIS }}>
                <path d="M15 4 L7 12 L15 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg viewBox="0 0 24 24" aria-hidden className="hidden h-6 w-6 sm:block" style={{ filter: GLOW_GARIS }}>
                <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            {/* Pembaca layar udah dapet namanya dari judul dialog. */}
            <p
              aria-hidden
              className={clsx(
                "min-w-0 truncate pr-3 font-display text-xl leading-normal text-white [text-shadow:0_0_14px_rgba(190,184,255,0.45)] transition-opacity duration-200 sm:hidden",
                judulTerlihat ? "opacity-0" : "opacity-100",
              )}
            >
              {tim.name}
            </p>
            <TombolBagikan tim={tim} />
          </div>

          {adaMedia && (
            <div
              className={clsx(
                samping &&
                  "lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-white/10 lg:bg-black/40 lg:p-5",
              )}
            >
              <div className={clsx(samping && "lg:my-auto")}>
                <PemutarVideo tim={tim} tegak={tegak} onTegak={setTegak} sumberDiKanan={samping} />
              </div>
            </div>
          )}

          {/* `contents` di HP: isinya tetap anak langsung <article>, jadi
              tombol pilih bisa nempel di bawah layar sepanjang halaman
              (sticky kebatas sama kotak induknya). Desktop: kolom kanan. */}
          <div
            className={clsx(
              "contents",
              samping && "lg:col-start-2 lg:row-start-1 lg:flex lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:pt-10",
            )}
          >
            <div className="px-5 pt-5 sm:px-10 sm:pt-6">
              <h2
                ref={judul}
                id="judul-detail-tim"
                className="break-words font-display text-3xl leading-tight text-white [text-shadow:0_0_18px_rgba(190,184,255,0.45)] sm:text-4xl"
              >
                {tim.name}
              </h2>
              {(tim.vote_count !== null || jenis) && (
                <p className="mt-2 font-alice text-sm text-white/60">
                  {/* null = jumlah suara lagi disembunyikan admin. */}
                  {tim.vote_count !== null && <span className="text-cyan-200/90">{tim.vote_count} suara</span>}
                  {tim.vote_count !== null && jenis && " · "}
                  {jenis && (jenis === "instagram" ? "Video Instagram" : jenis === "youtube" ? "Video YouTube" : "Video")}
                </p>
              )}
            </div>

            {/* Tombol pilih: nempel di bawah layar selama perlu (lihat atas) —
                juga di tablet & HP landscape, di mana videonya masih di atas.
                Cuma desktop dua kolom yang nggak perlu: tombolnya udah di atas
                kolom kanan. */}
            <div
              className={clsx(
                "sticky bottom-0 z-10 mt-5 flex flex-col border-t border-white/10 bg-night/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:mt-6 sm:px-10",
                samping && "lg:static lg:border-0 lg:bg-transparent lg:pb-0 lg:pt-0 lg:backdrop-blur-none",
              )}
            >
              {/* Kabar di ATAS tombol: bilahnya tumbuh ke atas, tombolnya
                  nggak geser dari bawah jempol. Nggak makan tempat kalau kosong. */}
              <div role="status" aria-live="polite" className={clsx("order-first", samping && "lg:order-last")}>
                {kabar && (
                  <p
                    className={clsx(
                      "mb-2 font-alice text-sm",
                      samping && "lg:mb-0 lg:mt-2",
                      kabar.tipe === "ok" ? "text-cyan-200" : "text-red-200",
                    )}
                  >
                    {kabar.tipe === "ok" && <span aria-hidden>✦ </span>}
                    {kabar.teks}
                  </p>
                )}
              </div>
              <div className="sm:max-w-sm">
                <TombolPilih
                  dipilih={dipilih}
                  ganti={ganti}
                  menyimpan={menyimpan}
                  sibuk={sibuk}
                  onVote={onVote}
                  onBatal={onBatal}
                  percik={percik}
                  besar
                />
              </div>
            </div>

            {/* Desktop dua kolom: tombol sumber pindah ke sini, dekat tombol
                pilih — di bawah kartu Instagram dia kedorong keluar layar laptop. */}
            {samping && sumber && (
              <div className="hidden px-10 pt-4 lg:block">
                <TombolSumber {...sumber} rata="kiri" />
              </div>
            )}

            {tim.deskripsi ? (
              <div className="mt-4 px-5 pb-12 sm:px-10 sm:pb-10">
                <div className="border-t border-white/10 pt-6">
                  <p className="font-alice text-xs uppercase tracking-[0.2em] text-emas/90">Tentang tim</p>
                  <p className="mt-3 whitespace-pre-line break-words font-alice leading-relaxed text-white/85">
                    {tim.deskripsi}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-6 sm:h-8" />
            )}
          </div>
        </article>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Bagikan tautan detail tim (`/vote?tim=<id>`) — buat tiap tim
 * mempromosikan dirinya. Tautannya tetap jalan buat yang belum login:
 * habis login dibawa balik ke detail tim ini, dan pratinjau WhatsApp-nya
 * nampilin nama & sampul tim (lihat src/app/(site)/vote/page.tsx).
 *
 * HP / tablet: lembar bagikan bawaan (WhatsApp, IG, dll.).
 * Desktop: langsung disalin ke clipboard.
 */
function TombolBagikan({ tim }: { tim: Team }) {
  const [pakaiLembar] = useState(
    () => typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches,
  );
  const [disalin, setDisalin] = useState(false);
  const jeda = useRef<number>();
  useEffect(() => () => window.clearTimeout(jeda.current), []);

  const bagikan = async () => {
    const url = `${window.location.origin}/vote?tim=${encodeURIComponent(tim.id)}`;
    if (pakaiLembar) {
      try {
        await navigator.share({
          title: `${tim.name} · Vote Starlight UMN 2026`,
          text: `Dukung ${tim.name} di voting Starlight UMN 2026.`,
          url,
        });
      } catch {
        // Dibatalkan orangnya — nggak apa-apa.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setDisalin(true);
      window.clearTimeout(jeda.current);
      jeda.current = window.setTimeout(() => setDisalin(false), 2200);
    } catch {
      window.prompt("Salin tautan tim ini:", url);
    }
  };

  const label = pakaiLembar ? "Bagikan" : "Salin tautan";
  return (
    <div className="relative ml-auto shrink-0 sm:order-first sm:ml-0">
      <button
        type="button"
        onClick={bagikan}
        aria-label={`${label} ${tim.name}`}
        className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-pill px-2 font-alice text-xs font-bold uppercase tracking-[0.1em] text-white/80 transition-colors sm:px-3 [@media(hover:hover)]:hover:text-white"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" style={{ filter: GLOW_GARIS }}>
          {disalin ? (
            <path d="M5 12.5 L10 17 L19 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path
              d="M8 10 H6 V20 H18 V10 H16 M12 3.5 V14 M8.5 7 L12 3.5 L15.5 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        <span className="hidden sm:inline">{disalin ? "Tautan disalin" : label}</span>
      </button>
      {/* HP cuma ikon: kabar "disalin"-nya muncul di bawah tombol. */}
      <span
        role="status"
        className={clsx(
          "pointer-events-none absolute right-0 top-full whitespace-nowrap rounded-pill border border-white/15 bg-night/95 px-3 py-1 font-alice text-xs text-cyan-100 transition-opacity duration-200 sm:sr-only",
          disalin ? "opacity-100" : "opacity-0",
        )}
      >
        {disalin ? "Tautan disalin" : ""}
      </span>
    </div>
  );
}

type Sumber = { href: string; label: string };

/** Tautan ke video aslinya di YouTube / Instagram. File unggahan nggak punya. */
function sumberVideo(tim: Team): Sumber | null {
  const jenis = jenisVideo(tim.video_url);
  if (jenis === "youtube") {
    const id = idYoutube(tim.video_url)!;
    return {
      href: youtubeShorts(tim.video_url) ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      label: "Buka di YouTube",
    };
  }
  if (jenis === "instagram") {
    const ig = idInstagram(tim.video_url)!;
    return {
      href: `https://www.instagram.com/${ig.tipe}/${ig.kode}/`,
      label: "Buka di Instagram",
    };
  }
  return null;
}

/**
 * Tombol ke sumber videonya. Bukan catatan kaki: kalau pemutarnya gagal
 * (post dihapus, akun jadi privat) ini satu-satunya jalan buat nonton —
 * jadi bentuknya tombol sungguhan (44px, gaya sama kayak "Lihat Detail").
 */
function TombolSumber({
  href,
  label,
  rata = "tengah",
  className,
}: Sumber & { rata?: "tengah" | "kiri"; className?: string }) {
  return (
    <div
      className={clsx(
        "flex flex-col",
        rata === "kiri" ? "items-start text-left" : "items-center px-5 pt-3 text-center lg:px-0",
        className,
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-white/30 bg-white/5 px-5 font-alice text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors sm:text-[13px] [@media(hover:hover)]:hover:bg-white/15"
      >
        {label}
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" style={{ filter: GLOW_GARIS }}>
          <path d="M9 5 H19 V15 M19 5 L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only"> (membuka tab baru)</span>
      </a>
    </div>
  );
}

/**
 * Kotak video tegak: di HP setinggi ruang di antara bilah atas & tombol
 * pilih (kayak nonton reel), di tablet dibatasi, di desktop setinggi
 * panel dikurangi padding kolomnya (tombol sumber di kolom kanan).
 */
const KOTAK_TEGAK =
  "aspect-[9/16] h-[calc(100svh-8.25rem-env(safe-area-inset-bottom))] max-w-full sm:h-[min(72svh,680px)] lg:h-[calc(var(--tinggi-panel)-2.5rem)]";

/**
 * Pemutar video di detail. Semuanya nunggu dipencet dulu:
 * - unggahan: <video> dengan sampulnya sebagai poster;
 * - YouTube: sampul + tombol putar, iframe-nya baru dimuat pas dipencet
 *   (iframe YouTube berat & naruh cookie — sama kayak VideoFrame);
 * - Instagram: embed resmi (tampilannya dari Instagram, nggak bisa diubah).
 *
 * Isi iframe pihak ketiga nggak bisa dibaca dari sini, jadi kalau
 * videonya dihapus / akunnya jadi private kita nggak bisa tau — makanya
 * selalu ada tombol "Buka di …" di bawahnya.
 */
function PemutarVideo({
  tim,
  tegak,
  onTegak,
  sumberDiKanan,
}: {
  tim: Team;
  tegak: boolean;
  onTegak: (tegak: boolean) => void;
  /** Desktop dua kolom: tombol sumber ditaruh DetailTim di kolom kanan. */
  sumberDiKanan: boolean;
}) {
  const jenis = jenisVideo(tim.video_url);
  const sampul = sampulTim(tim);
  const sumber = sumberVideo(tim);
  const kelasSumber = sumberDiKanan ? "lg:hidden" : undefined;
  const [gagal, setGagal] = useState(false);
  const [putarYt, setPutarYt] = useState(false);
  /** Reel landscape: kartunya udah punya tombol "Tonton di Instagram" sendiri. */
  const [igMelebar, setIgMelebar] = useState(false);

  if (jenis === "youtube") {
    const id = idYoutube(tim.video_url)!;
    const shorts = youtubeShorts(tim.video_url);
    return (
      <>
        <div className={clsx("flex w-full shrink-0 justify-center bg-black", pitaTegak(shorts))}>
          <div className={clsx("relative", shorts ? KOTAK_TEGAK : "aspect-video w-full")}>
            {putarYt ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
                title={`Video ${tim.name}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPutarYt(true)}
                aria-label={`Putar video ${tim.name}`}
                className="group absolute inset-0 grid place-items-center"
              >
                {sampul && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sampul} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <span aria-hidden className="absolute inset-0 bg-night/25 transition-colors [@media(hover:hover)]:group-hover:bg-night/40" />
                <IkonPutar className="relative h-16 w-16 transition-transform duration-300 [@media(hover:hover)]:group-hover:scale-110" />
              </button>
            )}
          </div>
        </div>
        {sumber && <TombolSumber {...sumber} className={kelasSumber} />}
      </>
    );
  }

  if (jenis === "instagram") {
    const ig = idInstagram(tim.video_url)!;
    return (
      <>
        <div className="px-3 pt-3 sm:px-6 sm:pt-2 lg:p-0">
          <EmbedInstagram tim={tim} ig={ig} sampul={sampul} onMelebar={() => setIgMelebar(true)} />
        </div>
        {sumber && !igMelebar && <TombolSumber {...sumber} className={kelasSumber} />}
      </>
    );
  }

  if (jenis === "file") {
    if (gagal)
      return (
        <div className="grid aspect-video w-full shrink-0 place-items-center bg-black/60 px-6 text-center lg:w-[26rem]">
          <div>
            <p className="font-alice text-white/80">Video tidak dapat diputar di perangkat ini.</p>
            <TombolSumber href={tim.video_url!} label="Buka file video" />
          </div>
        </div>
      );
    return (
      <div className={clsx("flex w-full shrink-0 justify-center bg-black", pitaTegak(tegak))}>
        <video
          src={tim.video_url!}
          poster={sampul ?? undefined}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
          onLoadedMetadata={(e) => onTegak(e.currentTarget.videoHeight >= e.currentTarget.videoWidth)}
          onError={() => setGagal(true)}
          className={clsx("block object-contain", tegak ? KOTAK_TEGAK : "aspect-video w-full")}
        />
      </div>
    );
  }

  // Tanpa video: sampulnya aja.
  return sampul ? (
    <div className="flex shrink-0 justify-center bg-black/50 lg:bg-transparent">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sampul}
        alt={tim.name}
        className="max-h-[60svh] w-full object-contain lg:max-h-[calc(var(--tinggi-panel)-2.5rem)] lg:w-auto lg:max-w-[26rem]"
      />
    </div>
  ) : null;
}

/** Pita hitam di belakang video tegak cuma di HP & tablet; di desktop kolomnya udah gelap. */
const pitaTegak = (tegak: boolean) => (tegak ? "lg:bg-transparent" : "");

/**
 * Embed resmi Instagram, setinggi isinya.
 *
 * Iframe embed Instagram ngabarin tingginya sendiri lewat postMessage
 * (`{"type":"MEASURE","details":{"height":…}}`) — kabar yang sama yang
 * dipakai embed.js resmi, tanpa harus memuat skrip Instagram ke halaman
 * kita. Jadi nggak ada scroll di dalam iframe (dulu tingginya dipatok,
 * isinya kepotong & harus di-scroll di dalam).
 *
 * Selama kabarnya belum datang, tingginya diperkirakan dari lebarnya —
 * kotak media 4:5 + kepala & kaki kartu ±209px (diukur di lebar 326–540px),
 * dihitung ulang kalau lebarnya berubah (HP diputar) — dan sampul timnya
 * tampil redup di tempatnya, biar nggak kedip putih.
 */
function EmbedInstagram({
  tim,
  ig,
  sampul,
  onMelebar,
}: {
  tim: Team;
  ig: { tipe: string; kode: string };
  sampul: string | null;
  /** Dipanggil pas ketahuan video landscape (lihat `melebar`). */
  onMelebar: () => void;
}) {
  const kotak = useRef<HTMLDivElement>(null);
  const bingkai = useRef<HTMLIFrameElement>(null);
  const [tinggi, setTinggi] = useState<number | null>(null);
  /**
   * memuat → tampil (kabar tinggi datang, atau iframe-nya kelar dimuat).
   * lambat = 10 detik nggak ada apa-apa sama sekali (jaringan menggantung,
   * Instagram diblokir) → pesan + Coba lagi + tautan ke Instagram.
   */
  const [status, setStatus] = useState<"memuat" | "tampil" | "lambat">("memuat");
  /** Naik tiap "Coba lagi" → iframe-nya dibikin ulang. */
  const [percobaan, setPercobaan] = useState(0);
  /**
   * Instagram ngasih kotak media melebar (16:9) — reel yang dianggap
   * video landscape. Video kayak gini NGGAK mau diputar Instagram di situs
   * lain ("Watch on Instagram"), dan sebagian malah tampil rusak (gambarnya
   * luber nutupin kartu). Diganti sampul tim + tombol "Tonton di Instagram".
   */
  const [melebar, setMelebar] = useState(false);
  const onMelebarRef = useRef(onMelebar);
  onMelebarRef.current = onMelebar;
  const dapatUkuran = useRef(false);
  const cadangan = useRef<number>();

  useLayoutEffect(() => {
    const el = kotak.current;
    if (!el) return;
    const kira = () => {
      if (!dapatUkuran.current && el.offsetWidth) setTinggi(Math.round(el.offsetWidth * 1.25 + 209));
    };
    kira();
    const ro = new ResizeObserver(kira);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onPesan = (e: MessageEvent) => {
      if (e.origin !== "https://www.instagram.com" || !bingkai.current || e.source !== bingkai.current.contentWindow)
        return;
      // Kadang string JSON, kadang objek.
      let data: unknown = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const pesan = data as { type?: unknown; details?: { height?: unknown } } | null;
      if (pesan?.type !== "MEASURE") return;
      const h = Number(pesan.details?.height);
      if (!Number.isFinite(h) || h < 150 || h > 4000) return;
      dapatUkuran.current = true;
      // Tinggi kotak media = tinggi kartu − kepala & kaki (±209px). Reel
      // tegak: 4:5 (1,25 × lebar); landscape: 16:9 (0,56 × lebar).
      const lebar = bingkai.current.offsetWidth;
      if (lebar && (h - 209) / lebar < 0.9) {
        setMelebar(true);
        onMelebarRef.current();
      }
      setTinggi(Math.ceil(h));
      setStatus("tampil");
    };
    window.addEventListener("message", onPesan);
    return () => {
      window.removeEventListener("message", onPesan);
      window.clearTimeout(cadangan.current);
    };
  }, []);

  // Batas waktu dihitung sejak iframe dipasang, bukan sejak `onLoad`:
  // kalau permintaannya menggantung, `onLoad` nggak pernah datang.
  useEffect(() => {
    const t = window.setTimeout(() => setStatus((s) => (s === "memuat" ? "lambat" : s)), 10000);
    return () => window.clearTimeout(t);
  }, [percobaan]);

  const cobaLagi = () => {
    window.clearTimeout(cadangan.current);
    dapatUkuran.current = false;
    setStatus("memuat");
    setPercobaan((n) => n + 1);
  };

  if (melebar)
    return (
      <a
        href={`https://www.instagram.com/${ig.tipe}/${ig.kode}/`}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx("group relative mx-auto block overflow-hidden rounded-lg bg-black/60", KOTAK_TEGAK)}
      >
        {sampul && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sampul}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 [@media(hover:hover)]:group-hover:scale-[1.03]"
          />
        )}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night via-night/75 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-5 pb-6 text-center">
          <span className="font-alice text-sm text-white/85">Video ini hanya dapat diputar di Instagram.</span>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-white/30 bg-night/60 px-5 font-alice text-xs font-bold uppercase tracking-[0.1em] text-white backdrop-blur transition-colors sm:text-[13px] [@media(hover:hover)]:group-hover:bg-white/15">
            Tonton di Instagram
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" style={{ filter: GLOW_GARIS }}>
              <path d="M9 5 H19 V15 M19 5 L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
        <span className="sr-only"> (membuka tab baru)</span>
      </a>
    );

  return (
    // Desktop: selebar yang bikin kartunya muat setinggi panel (laptop
    // 1366×768 / 1536×864 tinggi layarnya pas-pasan), dalam batas lebar
    // embed Instagram (min. 326px).
    <div
      ref={kotak}
      className="relative mx-auto w-full max-w-[400px] lg:w-[clamp(326px,calc((var(--tinggi-panel)-2.5rem-209px)*0.8),400px)]"
      style={tinggi ? { height: tinggi } : undefined}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg bg-white/5">
        {sampul && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sampul} alt="" className="h-full w-full object-cover opacity-30" />
        )}
        {/* Teksnya di atas kaca gelap: sampulnya sendiri sering penuh tulisan. */}
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4 text-center">
          {status === "lambat" ? (
            <div className="rounded-2xl border border-white/10 bg-night/85 px-5 py-5 backdrop-blur">
              <p className="font-alice text-sm text-white/90">Video Instagram belum dapat dimuat.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={cobaLagi}
                  className="min-h-11 rounded-pill border border-white/30 bg-night/60 px-5 font-alice text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors [@media(hover:hover)]:hover:bg-white/15"
                >
                  Coba lagi
                </button>
                <a
                  href={`https://www.instagram.com/${ig.tipe}/${ig.kode}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-pill border border-white/30 bg-night/60 px-5 font-alice text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors [@media(hover:hover)]:hover:bg-white/15"
                >
                  Buka di Instagram
                  <span className="sr-only"> (membuka tab baru)</span>
                </a>
              </div>
            </div>
          ) : (
            <p aria-hidden className="rounded-pill bg-night/75 px-4 py-1.5 font-alice text-xs text-white/80 backdrop-blur">
              Memuat video Instagram…
            </p>
          )}
        </div>
      </div>
      <iframe
        key={percobaan}
        ref={bingkai}
        src={`https://www.instagram.com/${ig.tipe}/${ig.kode}/embed/`}
        title={`Video ${tim.name}`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        // Tinggi iframe = tinggi isinya, jadi scrollbar cuma makan lebar
        // (kotak medianya mengecil & tingginya meleset).
        scrolling="no"
        // Kabar tinggi nggak datang tapi halamannya kelar dimuat (Instagram
        // ganti cara) → tetap ditampilkan dengan tinggi perkiraan.
        onLoad={() => {
          window.clearTimeout(cadangan.current);
          cadangan.current = window.setTimeout(() => {
            if (!dapatUkuran.current) setStatus("tampil");
          }, 1500);
        }}
        className={clsx(
          "relative block h-full w-full rounded-lg bg-white transition-opacity duration-300",
          // Belum tampil: tembus klik, biar tombol di bawahnya bisa dipencet.
          status === "tampil" ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
    </div>
  );
}

/**
 * Sembilan kerlip yang memancar ke atas dari tombol, sekali jalan, pas
 * suara berhasil tercatat — ganti dari cuma border kartu yang berubah
 * warna. Bentuknya kerlip empat sudut yang sama kayak di seluruh situs,
 * warnanya emas (Auradon) & lavender (Isle). Arahnya dibikin kipas ke
 * atas karena tombolnya ada di bawah kartu (yang ke bawah bakal kepotong).
 * Gerakannya di .percik (globals.css).
 */
const ARAH_PERCIK = Array.from({ length: 9 }, (_, i) => {
  const sudut = ((195 + i * 18.75) * Math.PI) / 180;
  const jauh = 46 + (i % 3) * 10;
  return {
    dx: Math.round(Math.cos(sudut) * jauh),
    dy: Math.round(Math.sin(sudut) * jauh),
    warna: i % 2 ? "#cdb6ff" : "#ecc47a",
    ukuran: 10 + (i % 3) * 2,
  };
});

function Percikan() {
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {ARAH_PERCIK.map((p, i) => (
        <span
          key={i}
          className="percik absolute left-0 top-0 block"
          style={{ ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px` }}
        >
          <svg
            viewBox="0 0 12 12"
            width={p.ukuran}
            height={p.ukuran}
            style={{ filter: `drop-shadow(0 0 4px ${p.warna})` }}
          >
            <path d="M6 0Q6.9 5.1 12 6Q6.9 6.9 6 12Q5.1 6.9 0 6Q5.1 5.1 6 0Z" fill={p.warna} />
          </svg>
        </span>
      ))}
    </span>
  );
}
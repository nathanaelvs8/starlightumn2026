"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EditorTimVote } from "@/components/site/EditorTimVote";
import { dariIsianWib, formatWaktuTutup, keIsianWib, statusVoting } from "@/lib/statusVoting";
import {
  BUCKET_FOTO,
  BUCKET_VIDEO,
  jenisVideo,
  pathDariUrlPublik,
  sampulTim,
  type TimVote,
} from "@/lib/videoTim";

type Team = TimVote;

/** Label kecil di daftar tim: videonya dari mana. */
const LABEL_VIDEO = { file: "Video unggahan", youtube: "YouTube", instagram: "Instagram" } as const;

type Voter = { user_id: string; name: string; email: string };

type StatusVoting = "tutup" | "buka" | "selesai";

/* Warna aktifnya sama kayak saklar lama: hijau = buka, merah = selesai. */
const STATUS: { id: StatusVoting; label: string; keterangan: string; warna: string }[] = [
  {
    id: "tutup",
    label: "Belum Dibuka",
    keterangan: "Pengunjung melihat pesan bahwa voting belum dibuka.",
    warna: "bg-white/20 text-white",
  },
  {
    id: "buka",
    label: "Dibuka",
    keterangan: "Pengunjung dapat memberikan suara.",
    warna: "bg-green-500/80 text-white",
  },
  {
    id: "selesai",
    label: "Selesai",
    keterangan: "Voting ditutup. Pengunjung melihat ucapan terima kasih dan rekap suara (jika jumlah suara ditampilkan).",
    warna: "bg-red-500/80 text-white",
  },
];

export function VoteAdmin() {
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [voters, setVoters] = useState<Record<string, Voter[]>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  /** Kolom video & keterangan sudah ada di database. */
  const [siap, setSiap] = useState(true);
  /** Status voting lagi dikirim — pilihannya dikunci sampai server jawab. */
  const [menyimpanStatus, setMenyimpanStatus] = useState(false);
  /** Jumlah suara kelihatan pengunjung — selama voting dan sesudah selesai. */
  const [tampilkanSuara, setTampilkanSuara] = useState(true);
  /** Waktu tutup tersimpan (ISO) & isian formnya (WIB, `datetime-local`). */
  const [ditutupPada, setDitutupPada] = useState<string | null>(null);
  const [isianTutup, setIsianTutup] = useState("");
  /** Kolom waktu tutup & saklar jumlah suara sudah ada di database. */
  const [setelanSiap, setSetelanSiap] = useState(true);
  const [menyimpanSetelan, setMenyimpanSetelan] = useState(false);

  /** Ganti angka ini = form tambah dikosongkan lagi (dipasang ulang). */
  const [formBaru, setFormBaru] = useState(0);

  // edit
  const [editId, setEditId] = useState<string | null>(null);

  // expand daftar pemilih
  const [buka, setBuka] = useState<string | null>(null);

  /*
    Dulu respons galat (401/500) dibaca kayak data biasa: daftar tim jadi
    kosong & status jadi "Belum Dibuka" — admin bisa ngira datanya hilang.
    Sekarang galat ditampilkan apa adanya, dengan tombol coba lagi.
  */
  const [galatMuat, setGalatMuat] = useState<string | null>(null);
  /** Jam data terakhir berhasil diambil, & pembaruan otomatis terakhir gagal atau nggak. */
  const [diperbarui, setDiperbarui] = useState<number | null>(null);
  const [gagalSegar, setGagalSegar] = useState(false);
  /** Lagi ada yang dikirim → pembaruan otomatis jangan nimpa tampilan sementaranya. */
  const sibuk = useRef(false);
  sibuk.current = menyimpanStatus || menyimpanSetelan;
  const sedangMuat = useRef(false);

  /**
   * `diam`: pembaruan otomatis di latar. Gagal = data lama dibiarin tampil
   * (cuma ada tanda kecil), dan isian waktu tutup yang mungkin lagi diketik
   * admin nggak ditimpa.
   */
  const muat = async (diam = false) => {
    if (diam && (sedangMuat.current || sibuk.current)) return;
    sedangMuat.current = true;
    const ambil = async (url: string) => {
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Data gagal dimuat.");
      return d;
    };
    try {
      const [tRes, sRes, vRes] = await Promise.all([
        ambil("/api/admin/vote-teams"),
        ambil("/api/admin/vote-settings"),
        ambil("/api/admin/vote-voters"),
      ]);
      setTeams(tRes.teams ?? []);
      setSiap(tRes.siap !== false);
      setVoters(vRes.voters ?? {});
      setSetelanSiap(sRes.siap !== false);
      if (!(diam && sibuk.current)) {
        setIsOpen(!!sRes.is_open);
        setIsFinished(!!sRes.is_finished);
        setTampilkanSuara(sRes.tampilkan_suara !== false);
        setDitutupPada(sRes.voting_ditutup_pada ?? null);
      }
      if (!diam) setIsianTutup(keIsianWib(sRes.voting_ditutup_pada));
      setGalatMuat(null);
      setGagalSegar(false);
      setDiperbarui(Date.now());
    } catch (e) {
      if (diam) setGagalSegar(true);
      else
        setGalatMuat(
          e instanceof TypeError
            ? "Koneksi terputus. Periksa jaringan Anda, lalu coba lagi."
            : e instanceof Error
              ? e.message
              : "Data gagal dimuat.",
        );
    } finally {
      sedangMuat.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
    Suara yang masuk (mis. dari HP) kelihatan tanpa muat ulang halaman:
    data diambil lagi tiap 5 detik selama tab ini kebuka, dan langsung pas
    admin balik ke tab ini. (Bukan Realtime Supabase: tabel `votes` dikunci
    per akun, jadi siarannya cuma bakal ngirim suara milik admin sendiri.)
  */
  const muatTerbaru = useRef(muat);
  muatTerbaru.current = muat;
  useEffect(() => {
    const segarkan = () => {
      if (document.visibilityState === "visible") muatTerbaru.current(true);
    };
    const t = window.setInterval(segarkan, 5_000);
    document.addEventListener("visibilitychange", segarkan);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", segarkan);
    };
  }, []);

  /**
   * Kirim satu perubahan setelan voting, lalu BALIKIN kalau gagal.
   *
   * Dua toggle di bawah dulu nyetel state lokal terus nembak PATCH
   * tanpa pernah membaca hasilnya — nggak ada cek `res.ok`, nggak ada
   * catch. Kalau permintaannya gagal (sinyal putus, sesi admin kedaluwarsa,
   * server error), tombolnya tetap bergeser ke posisi baru dan
   * kelihatan berhasil.
   *
   * Itu berbahaya justru di dua tombol ini: keduanya menentukan apa
   * yang dilihat SEMUA pengunjung. Admin bisa mengira voting sudah
   * dibuka padahal belum, dan baru sadar pas ada yang komplain.
   */
  const simpanSetelan = async (patch: Record<string, unknown>, batalkan: () => void): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/vote-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        batalkan();
        const d = await res.json().catch(() => ({}));
        alert(`${d.error ?? "Setelan gagal disimpan."} Setelan dikembalikan seperti semula.`);
        return false;
      }
      return true;
    } catch {
      batalkan();
      alert("Koneksi terputus. Setelan dikembalikan seperti semula.");
      return false;
    }
  };

  const ubahTampilkanSuara = async (baru: boolean) => {
    if (menyimpanSetelan) return;
    setTampilkanSuara(baru);
    setMenyimpanSetelan(true);
    await simpanSetelan({ tampilkan_suara: baru }, () => setTampilkanSuara(!baru));
    setMenyimpanSetelan(false);
  };

  /** `isian` kosong = hapus waktu tutup (voting ditutup manual lewat status). */
  const simpanWaktuTutup = async (isian: string) => {
    if (menyimpanSetelan) return;
    const iso = isian ? dariIsianWib(isian) : null;
    if (isian && !iso) return alert("Waktu tutup tidak valid.");
    if (
      iso &&
      Date.parse(iso) <= Date.now() &&
      isOpen &&
      !confirm("Waktu ini sudah lewat, jadi voting langsung tertutup bagi pengunjung. Lanjutkan?")
    )
      return;
    const lama = ditutupPada;
    setDitutupPada(iso);
    setMenyimpanSetelan(true);
    await simpanSetelan({ voting_ditutup_pada: iso }, () => {
      setDitutupPada(lama);
      setIsianTutup(keIsianWib(lama));
    });
    setMenyimpanSetelan(false);
  };

  /*
    Status voting = SATU pilihan dari tiga, bukan dua saklar.

    Dulu "Buka" dan "Selesai" saklar terpisah, jadi bisa nyala dua-duanya
    sekaligus — dan di database pernah kejadian (is_open & is_finished
    sama-sama true). Pengunjung lihat "Voting Selesai" padahal voting
    belum dimulai. Dengan satu pilihan, dua kolomnya selalu dikirim
    bareng dan nggak mungkin bentrok lagi.
  */
  const status: StatusVoting = isFinished ? "selesai" : isOpen ? "buka" : "tutup";
  /** Status masih "Dibuka" tapi waktu tutupnya udah lewat (src/lib/statusVoting.ts). */
  const lewatTutup =
    statusVoting({ is_open: isOpen, is_finished: isFinished, voting_ditutup_pada: ditutupPada }) === "lewat";

  /*
    Satu perubahan status dalam satu waktu. Dulu klik "Dibuka" lalu
    "Selesai" cepat-cepat ngirim dua permintaan barengan — urutan
    sampainya bisa kebalik, dan kalau yang pertama gagal, pembatalannya
    malah nimpa pilihan terbaru.
  */
  const ubahStatus = async (baru: StatusVoting) => {
    if (baru === status || menyimpanStatus) return;
    const lama = { isOpen, isFinished };
    setIsOpen(baru === "buka");
    setIsFinished(baru === "selesai");
    setMenyimpanStatus(true);
    await simpanSetelan(
      { is_open: baru === "buka", is_finished: baru === "selesai" },
      () => {
        setIsOpen(lama.isOpen);
        setIsFinished(lama.isFinished);
      },
    );
    setMenyimpanStatus(false);
  };

  const hapus = async (t: Team) => {
    if (!confirm("Hapus tim ini? Seluruh suara untuk tim ini juga akan terhapus."))
      return;
    const res = await fetch("/api/admin/vote-teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id }),
    });
    if (res.ok) {
      // File video & sampulnya ikut dibuang biar kuota penyimpanan nggak
      // kepakai file yang udah nggak dipakai siapa pun. Gagal = biarin.
      const video = jenisVideo(t.video_url) === "file" ? pathDariUrlPublik(t.video_url, BUCKET_VIDEO) : null;
      const foto = pathDariUrlPublik(t.photo_url, BUCKET_FOTO);
      // Supabase nggak melempar galat — dikembalikan di `{ error }`.
      for (const [bucket, path] of [[BUCKET_VIDEO, video], [BUCKET_FOTO, foto]] as const) {
        if (!path) continue;
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) console.warn("[vote] file tim gagal dihapus:", bucket, path, error.message);
      }
    } else alert("Tim gagal dihapus. Silakan coba lagi.");
    muat();
  };

  const hapusVote = async (userId: string, namaPemilih: string) => {
    if (!confirm(`Hapus suara dari ${namaPemilih}?`)) return;
    await fetch("/api/admin/vote-voters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    muat();
  };

  if (loading) return <p className="font-alice text-white/60">Memuat…</p>;

  if (galatMuat)
    return (
      <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/5 p-4 font-alice text-sm text-red-100">
        <p>Data voting gagal dimuat: {galatMuat}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            muat();
          }}
          className="mt-3 rounded-md border border-white/25 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
        >
          Coba lagi
        </button>
      </div>
    );

  const totalVote = teams.reduce((s, t) => s + (t.vote_count ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Status voting — satu pilihan dari tiga (lihat ubahStatus). */}
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="font-alice text-white">Status Voting</p>
        <p className="font-alice text-sm text-white/60">
          {lewatTutup
            ? "Waktu tutup sudah lewat: pengunjung melihat bahwa voting telah ditutup dan suara tidak diterima lagi. Pilih Selesai untuk menampilkan hasil."
            : STATUS.find((s) => s.id === status)?.keterangan}
        </p>
        {/*
          role="radiogroup" + role="radio" + aria-checked: screen reader
          membacakan ketiganya sebagai satu kelompok pilihan dan menyebut
          mana yang lagi aktif.
        */}
        <div
          role="radiogroup"
          aria-label="Status voting"
          className="mt-4 grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-night/60 p-1"
        >
          {STATUS.map((s) => {
            const aktif = s.id === status;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={aktif}
                onClick={() => ubahStatus(s.id)}
                disabled={menyimpanStatus}
                className={`rounded-md disabled:cursor-wait px-2 py-2.5 font-alice text-xs uppercase tracking-wide transition-colors sm:text-sm ${
                  aktif ? s.warna : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-5 border-t border-white/10 pt-5">
          {!setelanSiap && (
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/5 p-3 font-alice text-sm text-amber-100">
              Waktu tutup dan pengaturan jumlah suara belum tersedia di database. Jalankan SQL yang tercantum di{" "}
              <code>src/app/api/admin/vote-settings/route.ts</code> pada SQL Editor Supabase.
            </p>
          )}

          {/* Waktu tutup — diisi & ditampilkan dalam WIB, apa pun zona waktu laptop admin. */}
          <div>
            <label htmlFor="waktu-tutup-voting" className="block font-alice text-sm text-white/80">
              Waktu voting ditutup <span className="text-white/45">(WIB, opsional)</span>
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                id="waktu-tutup-voting"
                type="datetime-local"
                value={isianTutup}
                onChange={(e) => setIsianTutup(e.target.value)}
                disabled={!setelanSiap || menyimpanSetelan}
                aria-describedby="waktu-tutup-ket"
                className="rounded-md border border-white/20 bg-night px-3 py-2 font-alice text-sm text-white [color-scheme:dark] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => simpanWaktuTutup(isianTutup)}
                disabled={!setelanSiap || menyimpanSetelan || !isianTutup || isianTutup === keIsianWib(ditutupPada)}
                className="rounded-md bg-cyan-500/80 px-4 py-2 font-alice text-sm text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
              >
                Simpan
              </button>
              {ditutupPada && (
                <button
                  type="button"
                  onClick={() => {
                    setIsianTutup("");
                    simpanWaktuTutup("");
                  }}
                  disabled={menyimpanSetelan}
                  className="rounded-md border border-white/25 px-4 py-2 font-alice text-sm text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  Hapus
                </button>
              )}
            </div>
            <p id="waktu-tutup-ket" className="mt-2 font-alice text-xs leading-relaxed text-white/55">
              {!ditutupPada
                ? "Belum diatur: voting ditutup manual dengan memilih status Selesai."
                : lewatTutup
                  ? `Sudah lewat (${formatWaktuTutup(ditutupPada)}). Suara tidak diterima lagi.`
                  : `Pengunjung melihat bahwa voting ditutup ${formatWaktuTutup(ditutupPada)}. Lewat dari itu, suara otomatis tidak diterima.`}
            </p>
          </div>

          {/* Jumlah suara — disembunyikan = angkanya nggak dikirim ke pengunjung sama sekali. */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={tampilkanSuara}
              onChange={(e) => ubahTampilkanSuara(e.target.checked)}
              disabled={!setelanSiap || menyimpanSetelan}
              className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-400"
            />
            <span>
              <span className="block font-alice text-sm text-white">Tampilkan jumlah suara ke pengunjung</span>
              <span className="mt-0.5 block font-alice text-xs leading-relaxed text-white/55">
                {tampilkanSuara
                  ? "Pengunjung melihat jumlah suara tiap tim, termasuk setelah voting selesai."
                  : "Jumlah suara tidak ditampilkan ke pengunjung, juga setelah voting selesai. Admin tetap dapat melihatnya di bawah."}
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Form tambah tim */}
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="mb-4 font-alice text-white">Tambah Tim</p>
        <EditorTimVote
          key={formBaru}
          siap={siap}
          onSelesai={() => {
            setFormBaru((n) => n + 1);
            muat();
          }}
        />
      </div>

      {/* Daftar tim */}
      <div>
        <div className="mb-3 flex items-start justify-between gap-4">
          <p className="font-alice text-white">Daftar Tim</p>
          <div className="text-right">
            <p className="font-alice text-sm text-white/60">Total suara: {totalVote}</p>
            {/* Tanda pembaruan otomatis (lihat muat): biar admin tau angkanya hidup. */}
            {/* Sengaja tanpa aria-live: jamnya ganti tiap 5 detik, bakal dibacakan terus. */}
            <p className={`font-alice text-xs ${gagalSegar ? "text-amber-200" : "text-white/40"}`}>
              {gagalSegar
                ? "Gagal memperbarui, mencoba lagi…"
                : diperbarui &&
                  `Diperbarui otomatis · ${new Date(diperbarui).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })}`}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {teams.length === 0 ? (
            <p className="font-alice text-sm text-white/50">Belum ada tim.</p>
          ) : (
            teams.map((t) => {
              const daftarPemilih = voters[t.id] ?? [];
              const terbuka = buka === t.id;
              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-white/15 bg-white/5 p-3"
                >
                  <div className="flex items-center gap-4">
                    <Sampul tim={t} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-alice text-white">{t.name}</p>
                      <p className="font-alice text-xs text-white/50">
                        {jenisVideo(t.video_url) ? LABEL_VIDEO[jenisVideo(t.video_url)!] : "Tanpa video"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setBuka(terbuka ? null : t.id)}
                        className="font-alice text-sm text-cyan-200/80 hover:text-cyan-200"
                      >
                        {t.vote_count ?? 0} suara · {terbuka ? "tutup" : "lihat pemilih"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditId(editId === t.id ? null : t.id)}
                      aria-expanded={editId === t.id}
                      className="rounded-md border border-white/25 px-3 py-1.5 font-alice text-xs text-white/80 transition-colors hover:bg-white/10"
                    >
                      {editId === t.id ? "Tutup" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => hapus(t)}
                      className="rounded-md border border-red-400/40 px-3 py-1.5 font-alice text-xs text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      Hapus
                    </button>
                  </div>

                  {editId === t.id && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <EditorTimVote
                        awal={t}
                        siap={siap}
                        onBatal={() => setEditId(null)}
                        onSelesai={() => {
                          setEditId(null);
                          muat();
                        }}
                      />
                    </div>
                  )}

                  {/* Daftar pemilih (expand) */}
                  {terbuka && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      {daftarPemilih.length === 0 ? (
                        <p className="font-alice text-sm text-white/50">
                          Belum ada suara untuk tim ini.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {daftarPemilih.map((v) => (
                            <li
                              key={v.user_id}
                              className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-alice text-sm text-white">
                                  {v.name}
                                </p>
                                <p className="truncate font-alice text-xs text-white/50">
                                  {v.email}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => hapusVote(v.user_id, v.name)}
                                className="shrink-0 rounded-md border border-red-400/40 px-3 py-1 font-alice text-xs text-red-400 transition-colors hover:bg-red-500/10"
                              >
                                Hapus suara
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/** Gambar sampul kecil di daftar tim. */
function Sampul({ tim }: { tim: Team }) {
  const src = sampulTim(tim);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="aspect-video w-24 shrink-0 rounded-lg bg-night object-cover" />
  ) : (
    <div className="grid aspect-video w-24 shrink-0 place-items-center rounded-lg bg-white/10 font-alice text-[11px] text-white/40">
      Tanpa sampul
    </div>
  );
}

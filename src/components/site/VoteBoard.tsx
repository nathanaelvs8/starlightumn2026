"use client";

import { useEffect, useState } from "react";
import { TitleGlow } from "@/components/ui/TitleGlow";

type Team = {
  id: string;
  name: string;
  photo_url: string | null;
  vote_count: number;
};

export function VoteBoard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [kabar, setKabar] = useState<
    { tipe: "ok" | "galat"; teks: string } | null
  >(null);
  /** Percikan bintang di tombol tim yang barusan dipilih. `n` = kunci baru tiap vote. */
  const [percik, setPercik] = useState<{ id: string; n: number } | null>(null);

  const muat = async () => {
    const r = await fetch("/api/vote").then((x) => x.json());
    setTeams(r.teams ?? []);
    setIsOpen(!!r.is_open);
    setIsFinished(!!r.is_finished);
    setMyTeam(r.my_team_id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    muat();
  }, []);

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
        setSaving(null);
        return;
      }

      await muat();
      setKabar({ tipe: "ok", teks: `Suara Anda untuk ${nama} telah tercatat.` });
      setPercik({ id: teamId, n: Date.now() });
    } catch {
      setKabar({
        tipe: "galat",
        teks: "Koneksi terputus. Periksa jaringan Anda, lalu coba lagi.",
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <p className="mt-10 text-center font-alice text-white/60">Memuat…</p>
    );
  }

    // Voting sudah selesai → halaman hasil akhir
  if (isFinished) {
    const urut = [...teams].sort((a, b) => b.vote_count - a.vote_count);
    const juara = urut[0];
    return (
      <div className="min-h-[80svh] pb-28 pt-4">
        <TitleGlow className="text-center text-4xl sm:text-5xl">
          Voting Selesai
        </TitleGlow>

        <div className="mx-auto mt-10 max-w-2xl space-y-3">
          {urut.map((t, i) => {
            const menang =
              juara && t.vote_count === juara.vote_count && t.vote_count > 0;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-4 rounded-xl border bg-white/5 p-3 ${
                  menang
                    ? "border-cyan-300/80 shadow-[0_0_28px_rgba(103,232,249,0.3)]"
                    : "border-white/15"
                }`}
              >
                <span className="w-6 text-center font-alice text-white/50">
                  {i + 1}
                </span>
                {t.photo_url ? (
                  <img
                    src={t.photo_url}
                    alt={t.name}
                    draggable={false}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-lg bg-white/10 font-alice text-xs text-white/40">
                    Tanpa foto
                  </div>
                )}
                <p className="flex-1 font-alice text-white">
                  {t.name}
                  {menang && (
                    <span className="ml-2 font-alice text-xs text-cyan-200">
                      Juara
                    </span>
                  )}
                </p>
                <span className="font-alice text-sm text-cyan-200/80">
                  {t.vote_count} suara
                </span>
              </div>
            );
          })}
          {urut.length === 0 && (
            <p className="text-center font-alice text-white/50">
              Belum ada tim.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Voting ditutup → pesan tunggu (sama kayak placeholder lama)
  if (!isOpen) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center text-center">
        <TitleGlow className="text-4xl sm:text-5xl">Vote</TitleGlow>
        <p className="mt-6 max-w-md font-alice text-white/70">
          Voting belum dibuka. Nantikan informasi selanjutnya melalui kanal resmi
          Starlight UMN 2026.
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <TitleGlow className="text-center text-4xl sm:text-5xl">Vote</TitleGlow>
      <p className="mt-3 text-center font-alice text-white/70">
        Pilih satu tim. Pilihan dapat diubah selama periode voting masih
        berlangsung.
      </p>

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
        {kabar && (
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

      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => {
          const dipilih = myTeam === t.id;
          return (
            <div
              key={t.id}
              className={`flex flex-col overflow-hidden rounded-2xl border bg-white/5 backdrop-blur transition-colors ${
                dipilih
                  ? "border-cyan-300/80 shadow-[0_0_28px_rgba(103,232,249,0.35)]"
                  : "border-white/15"
              }`}
            >
              {t.photo_url ? (
                <img
                  src={t.photo_url}
                  alt={t.name}
                  draggable={false}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="grid aspect-video w-full place-items-center bg-white/10 font-alice text-sm text-white/40">
                  Tanpa foto
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-alice text-white">{t.name}</p>
                  <span className="font-alice text-sm text-cyan-200/80">
                    {t.vote_count} suara
                  </span>
                </div>

                <div className="relative mt-auto">
                  <button
                    type="button"
                    onClick={() => vote(t.id)}
                    disabled={saving === t.id || dipilih}
                    className={`w-full rounded-pill px-4 py-2 font-alice text-sm transition-colors ${
                      dipilih
                        ? "cursor-default border border-cyan-300/60 bg-cyan-400/20 text-cyan-100"
                        : "border border-white/25 bg-white/5 text-white hover:bg-white/15 disabled:opacity-50"
                    }`}
                  >
                    {dipilih
                      ? "✓ Pilihan Anda"
                      : saving === t.id
                        ? "Menyimpan…"
                        : "Pilih tim ini"}
                  </button>
                  {percik?.id === t.id && <Percikan key={percik.n} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {teams.length === 0 && (
        <p className="mt-10 text-center font-alice text-white/50">
          Belum ada tim yang bisa dipilih.
        </p>
      )}
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
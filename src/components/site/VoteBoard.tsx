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
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Gagal menyimpan vote.");
      setSaving(null);
      return;
    }
    await muat();
    setSaving(null);
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
        <p className="mt-3 text-center font-alice text-white/70">
          Terima kasih atas partisipasi Anda. Berikut hasil akhir voting.
        </p>

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
                    No foto
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
                  {t.vote_count} vote
                </span>
              </div>
            );
          })}
          {urut.length === 0 && (
            <p className="text-center font-alice text-white/50">
              Nggak ada tim.
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
                  No foto
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-alice text-white">{t.name}</p>
                  <span className="font-alice text-sm text-cyan-200/80">
                    {t.vote_count} vote
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => vote(t.id)}
                  disabled={saving === t.id || dipilih}
                  className={`mt-auto rounded-pill px-4 py-2 font-alice text-sm transition-colors ${
                    dipilih
                      ? "cursor-default border border-cyan-300/60 bg-cyan-400/20 text-cyan-100"
                      : "border border-white/25 bg-white/5 text-white hover:bg-white/15 disabled:opacity-50"
                  }`}
                >
                  {dipilih
                    ? "✓ Pilihanmu"
                    : saving === t.id
                      ? "Menyimpan…"
                      : "Pilih tim ini"}
                </button>
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
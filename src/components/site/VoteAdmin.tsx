"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Team = {
  id: string;
  name: string;
  photo_url: string | null;
  vote_count: number;
};

type Voter = { user_id: string; name: string; email: string };

export function VoteAdmin() {
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [voters, setVoters] = useState<Record<string, Voter[]>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // form tambah
  const [nama, setNama] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);

  // expand daftar pemilih
  const [buka, setBuka] = useState<string | null>(null);

  const muat = async () => {
    const [tRes, sRes, vRes] = await Promise.all([
      fetch("/api/admin/vote-teams").then((r) => r.json()),
      fetch("/api/admin/vote-settings").then((r) => r.json()),
      fetch("/api/admin/vote-voters").then((r) => r.json()),
    ]);
    setTeams(tRes.teams ?? []);
    setIsOpen(!!sRes.is_open);
    setIsFinished(!!sRes.is_finished);
    setVoters(vRes.voters ?? {});
    setLoading(false);
  };

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFoto = async (f: File): Promise<string | null> => {
    const ext = f.name.split(".").pop();
    const namaFile = `team-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("team-photos")
      .upload(namaFile, f, { upsert: false });
    if (error) {
      alert("Gagal upload foto: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("team-photos").getPublicUrl(namaFile);
    return data.publicUrl;
  };

  const toggleVoting = async () => {
    const baru = !isOpen;
    setIsOpen(baru);
    await fetch("/api/admin/vote-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_open: baru }),
    });
  };

  const toggleSelesai = async () => {
    const baru = !isFinished;
    setIsFinished(baru);
    await fetch("/api/admin/vote-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_finished: baru }),
    });
  };

  const tambah = async () => {
    if (!nama.trim()) return alert("Nama tim wajib diisi");
    setUploading(true);
    let photo_url: string | null = null;
    if (file) {
      photo_url = await uploadFoto(file);
      if (!photo_url) {
        setUploading(false);
        return;
      }
    }
    await fetch("/api/admin/vote-teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nama.trim(), photo_url }),
    });
    setNama("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
    muat();
  };

  const mulaiEdit = (t: Team) => {
    setEditId(t.id);
    setEditNama(t.name);
    setEditFile(null);
  };

  const simpanEdit = async (id: string) => {
    setUploading(true);
    const patch: Record<string, unknown> = { id, name: editNama.trim() };
    if (editFile) {
      const url = await uploadFoto(editFile);
      if (!url) {
        setUploading(false);
        return;
      }
      patch.photo_url = url;
    }
    await fetch("/api/admin/vote-teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setEditId(null);
    setUploading(false);
    muat();
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus tim ini? Semua vote ke tim ini juga ikut terhapus."))
      return;
    await fetch("/api/admin/vote-teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    muat();
  };

  const hapusVote = async (userId: string, namaPemilih: string) => {
    if (!confirm(`Hapus vote dari ${namaPemilih}?`)) return;
    await fetch("/api/admin/vote-voters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    muat();
  };

  if (loading) return <p className="font-alice text-white/60">Memuat…</p>;

  const totalVote = teams.reduce((s, t) => s + t.vote_count, 0);

  return (
    <div className="space-y-8">
      {/* Toggle buka/tutup voting */}
      <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-4">
        <div>
          <p className="font-alice text-white">Status Voting</p>
          <p className="font-alice text-sm text-white/60">
            {isOpen
              ? "Voting DIBUKA — user bisa vote sekarang."
              : "Voting DITUTUP — user lihat pesan tunggu."}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleVoting}
          className={`relative h-8 w-14 rounded-full transition-colors ${
            isOpen ? "bg-green-500/80" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
              isOpen ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

            {/* Toggle voting selesai */}
      <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-4">
        <div>
          <p className="font-alice text-white">Voting Selesai</p>
          <p className="font-alice text-sm text-white/60">
            {isFinished
              ? "Ditandai SELESAI — user lihat halaman hasil akhir."
              : "Kalau dinyalain, voting ditutup & user lihat halaman hasil."}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSelesai}
          className={`relative h-8 w-14 rounded-full transition-colors ${
            isFinished ? "bg-red-500/80" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
              isFinished ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Form tambah tim */}
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="mb-3 font-alice text-white">Tambah Tim</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama tim"
            className="flex-1 rounded-md border border-white/20 bg-[#0a1430] px-3 py-2 font-alice text-sm text-white placeholder:text-white/40"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="font-alice text-sm text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
          />
          <button
            type="button"
            onClick={tambah}
            disabled={uploading}
            className="rounded-md bg-cyan-500/80 px-4 py-2 font-alice text-sm text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
          >
            {uploading ? "Menyimpan…" : "Tambah"}
          </button>
        </div>
      </div>

      {/* Daftar tim */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-alice text-white">Daftar Tim</p>
          <p className="font-alice text-sm text-white/60">
            Total vote: {totalVote}
          </p>
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
                    {t.photo_url ? (
                      <img
                        src={t.photo_url}
                        alt={t.name}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-lg bg-white/10 font-alice text-xs text-white/40">
                        No foto
                      </div>
                    )}

                    {editId === t.id ? (
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={editNama}
                          onChange={(e) => setEditNama(e.target.value)}
                          className="flex-1 rounded-md border border-white/20 bg-[#0a1430] px-3 py-1.5 font-alice text-sm text-white"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditFile(e.target.files?.[0] ?? null)
                          }
                          className="font-alice text-xs text-white/70 file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => simpanEdit(t.id)}
                          disabled={uploading}
                          className="rounded-md bg-green-500/80 px-3 py-1.5 font-alice text-xs text-white disabled:opacity-50"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditId(null)}
                          className="rounded-md border border-white/25 px-3 py-1.5 font-alice text-xs text-white/70"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-alice text-white">{t.name}</p>
                          <button
                            type="button"
                            onClick={() => setBuka(terbuka ? null : t.id)}
                            className="font-alice text-sm text-cyan-200/80 hover:text-cyan-200"
                          >
                            {t.vote_count} vote · {terbuka ? "tutup" : "lihat pemilih"}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => mulaiEdit(t)}
                          className="rounded-md border border-white/25 px-3 py-1.5 font-alice text-xs text-white/80 transition-colors hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => hapus(t.id)}
                          className="rounded-md border border-red-400/40 px-3 py-1.5 font-alice text-xs text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </div>

                  {/* Daftar pemilih (expand) */}
                  {terbuka && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      {daftarPemilih.length === 0 ? (
                        <p className="font-alice text-sm text-white/50">
                          Belum ada yang vote tim ini.
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
                                Hapus vote
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
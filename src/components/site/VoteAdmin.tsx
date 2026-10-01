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
    keterangan: "Voting ditutup dan pengunjung melihat hasil akhir.",
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
      alert("Foto gagal diunggah: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("team-photos").getPublicUrl(namaFile);
    return data.publicUrl;
  };

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
  const simpanSetelan = async (
    patch: { is_open: boolean; is_finished: boolean },
    batalkan: () => void,
  ) => {
    try {
      const res = await fetch("/api/admin/vote-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        batalkan();
        alert("Setelan gagal disimpan. Status dikembalikan seperti semula.");
      }
    } catch {
      batalkan();
      alert("Koneksi terputus. Setelan dikembalikan seperti semula.");
    }
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

  const ubahStatus = async (baru: StatusVoting) => {
    if (baru === status) return;
    const lama = { isOpen, isFinished };
    setIsOpen(baru === "buka");
    setIsFinished(baru === "selesai");
    await simpanSetelan(
      { is_open: baru === "buka", is_finished: baru === "selesai" },
      () => {
        setIsOpen(lama.isOpen);
        setIsFinished(lama.isFinished);
      },
    );
  };

  const tambah = async () => {
    if (!nama.trim()) return alert("Nama tim wajib diisi.");
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
    if (!confirm("Hapus tim ini? Seluruh suara untuk tim ini juga akan terhapus."))
      return;
    await fetch("/api/admin/vote-teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
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

  const totalVote = teams.reduce((s, t) => s + t.vote_count, 0);

  return (
    <div className="space-y-8">
      {/* Status voting — satu pilihan dari tiga (lihat ubahStatus). */}
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="font-alice text-white">Status Voting</p>
        <p className="font-alice text-sm text-white/60">
          {STATUS.find((s) => s.id === status)?.keterangan}
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
                className={`rounded-md px-2 py-2.5 font-alice text-xs uppercase tracking-wide transition-colors sm:text-sm ${
                  aktif ? s.warna : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form tambah tim */}
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="mb-3 font-alice text-white">Tambah Tim</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama tim"
            className="flex-1 rounded-md border border-white/20 bg-night px-3 py-2 font-alice text-sm text-white placeholder:text-white/40"
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
            Total suara: {totalVote}
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
                        Tanpa foto
                      </div>
                    )}

                    {editId === t.id ? (
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={editNama}
                          onChange={(e) => setEditNama(e.target.value)}
                          className="flex-1 rounded-md border border-white/20 bg-night px-3 py-1.5 font-alice text-sm text-white"
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
                            {t.vote_count} suara · {terbuka ? "tutup" : "lihat pemilih"}
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
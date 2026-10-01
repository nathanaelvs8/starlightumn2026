"use client";

import { useEffect, useState } from "react";

export function AdminSitus() {
  const [muat, setMuat] = useState(true);
  const [siap, setSiap] = useState(true);
  const [terbuka, setTerbuka] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/situs")
      .then((r) => r.json())
      .then((d) => {
        setSiap(!!d.siap);
        setTerbuka(!!d.terbuka);
      })
      .catch(() => setSiap(false))
      .finally(() => setMuat(false));
  }, []);

  const ubah = async () => {
    const baru = !terbuka;
    const yakin = confirm(
      baru
        ? "Buka website untuk umum sekarang?"
        : "Tutup website? Pengunjung akan melihat halaman Segera Hadir.",
    );
    if (!yakin) return;

    setError(null);
    setTerbuka(baru);
    const res = await fetch("/api/admin/situs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terbuka: baru }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setTerbuka(!baru);
      setError("Setelan gagal disimpan.");
    }
  };

  if (muat) return <p className="font-alice text-white/60">Memuat…</p>;

  if (!siap)
    return (
      <div className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 font-alice text-sm text-amber-100">
        Setelan buka/tutup website belum tersedia di database. Jalankan SQL
        penambahan kolom situs_terbuka di SQL Editor Supabase.
      </div>
    );

  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-alice text-white">Website Dibuka untuk Umum</p>
          <p className="font-alice text-sm text-white/60">
            {terbuka
              ? "TERBUKA — semua orang bisa melihat website."
              : "DITUTUP — pengunjung melihat halaman Segera Hadir. Admin tetap bisa melihat semua halaman."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={terbuka}
          aria-label="Buka website untuk umum"
          onClick={ubah}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
            terbuka ? "bg-green-500/80" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
              terbuka ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 font-alice text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
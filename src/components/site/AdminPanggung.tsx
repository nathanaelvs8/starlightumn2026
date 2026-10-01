"use client";

import { useEffect, useState } from "react";
import { stages, tanggalPanggung } from "@/lib/stages";

/**
 * Panel admin: buka / segel tiap panggung.
 *
 * Panggung yang DIBUKA: logo berwarna di /stages dan halamannya bisa
 * dilihat semua orang. Yang DISEGEL: logo bergembok, nggak bisa
 * diklik, dan halamannya cuma bisa dibuka admin (buat ngecek isinya).
 * Data lewat /api/admin/panggung (kolom vote_settings.panggung_terbuka).
 */
export function AdminPanggung() {
  const [muat, setMuat] = useState(true);
  const [siap, setSiap] = useState(true);
  const [terbuka, setTerbuka] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/panggung")
      .then((r) => r.json())
      .then((d) => {
        setSiap(!!d.siap);
        setTerbuka(Array.isArray(d.terbuka) ? d.terbuka : []);
      })
      .catch(() => setSiap(false))
      .finally(() => setMuat(false));
  }, []);

  const ubah = async (slug: string, nama: string) => {
    const buka = !terbuka.includes(slug);
    const yakin = confirm(
      buka
        ? `Buka panggung ${nama} untuk umum? Logonya akan berwarna dan halamannya bisa dilihat semua pengunjung.`
        : `Segel kembali panggung ${nama}? Halamannya hanya bisa dilihat admin.`,
    );
    if (!yakin) return;

    const lama = terbuka;
    const baru = buka ? [...terbuka, slug] : terbuka.filter((s) => s !== slug);
    setError(null);
    setTerbuka(baru);

    const res = await fetch("/api/admin/panggung", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terbuka: baru }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setTerbuka(lama);
      setError("Setelan gagal disimpan. Status dikembalikan seperti semula.");
    }
  };

  if (muat) return <p className="font-alice text-white/60">Memuat…</p>;

  if (!siap)
    return (
      <div className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 font-alice text-sm text-amber-100">
        Setelan buka/segel panggung belum tersedia di database. Jalankan SQL
        yang tercantum di <code>src/app/api/admin/panggung/route.ts</code> pada
        SQL Editor Supabase.
      </div>
    );

  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <p className="font-alice text-white">Panggung</p>
      <p className="font-alice text-sm text-white/60">
        Panggung yang disegel tidak bisa dibuka pengunjung. Admin tetap bisa
        melihat semua halaman panggung.
      </p>

      <ul className="mt-4 divide-y divide-white/10">
        {stages.map((s) => {
          const buka = terbuka.includes(s.slug);
          return (
            <li key={s.slug} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-alice text-white">
                  {s.name}{" "}
                  <span className="text-sm text-white/50">· {tanggalPanggung(s)}</span>
                </p>
                <p className="font-alice text-sm text-white/60">
                  {buka ? "DIBUKA untuk umum." : "DISEGEL — hanya admin yang bisa melihat."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={buka}
                aria-label={`Buka panggung ${s.name} untuk umum`}
                onClick={() => ubah(s.slug, s.name)}
                className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                  buka ? "bg-green-500/80" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
                    buka ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-3 font-alice text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

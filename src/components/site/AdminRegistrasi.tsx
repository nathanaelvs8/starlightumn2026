"use client";

import { useEffect, useState } from "react";

/**
 * Panel admin: tombol "Registrasi Penonton" di homepage.
 * Tombolnya cuma tampil kalau saklar NYALA dan link-nya diisi.
 * Data disimpan lewat /api/admin/registrasi (tabel vote_settings).
 */
export function AdminRegistrasi() {
  const [muat, setMuat] = useState(true);
  const [siap, setSiap] = useState(true);
  const [aktif, setAktif] = useState(false);
  const [url, setUrl] = useState("");
  const [urlTersimpan, setUrlTersimpan] = useState("");
  const [pesan, setPesan] = useState<{ tipe: "ok" | "error"; teks: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/registrasi")
      .then((r) => r.json())
      .then((d) => {
        setSiap(!!d.siap);
        setAktif(!!d.aktif);
        setUrl(d.url ?? "");
        setUrlTersimpan(d.url ?? "");
      })
      .catch(() => setSiap(false))
      .finally(() => setMuat(false));
  }, []);

  const simpan = async (patch: { aktif?: boolean; url?: string }) => {
    setPesan(null);
    try {
      const res = await fetch("/api/admin/registrasi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPesan({ tipe: "error", teks: d.error ?? "Setelan gagal disimpan." });
        return false;
      }
      return true;
    } catch {
      setPesan({ tipe: "error", teks: "Koneksi terputus. Setelan tidak tersimpan." });
      return false;
    }
  };

  const ubahAktif = async () => {
    const baru = !aktif;
    setAktif(baru);
    if (!(await simpan({ aktif: baru }))) setAktif(!baru);
  };

  const simpanUrl = async () => {
    if (await simpan({ url })) {
      setUrlTersimpan(url.trim());
      setPesan({ tipe: "ok", teks: "Tautan berhasil disimpan." });
    }
  };

  if (muat) return <p className="font-alice text-white/60">Memuat…</p>;

  if (!siap)
    return (
      <div className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 font-alice text-sm text-amber-100">
        Setelan registrasi belum tersedia di database. Jalankan perintah SQL
        yang tercantum di <code>src/app/api/admin/registrasi/route.ts</code> pada
        SQL Editor Supabase.
      </div>
    );

  const tampil = aktif && !!urlTersimpan;

  return (
    <div className="space-y-4 rounded-xl border border-white/15 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-alice text-white">Tombol Registrasi Penonton</p>
          <p className="font-alice text-sm text-white/60">
            {tampil
              ? "DITAMPILKAN di homepage."
              : aktif
                ? "Aktif, tetapi tautan belum diisi — tombol belum tampil."
                : "DISEMBUNYIKAN dari homepage."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={aktif}
          aria-label="Tampilkan tombol Registrasi Penonton di homepage"
          onClick={ubahAktif}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
            aktif ? "bg-green-500/80" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
              aktif ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… (tautan formulir registrasi)"
          aria-label="Tautan registrasi penonton"
          inputMode="url"
          className="flex-1 rounded-md border border-white/20 bg-night px-3 py-2 font-alice text-sm text-white placeholder:text-white/40"
        />
        <button
          type="button"
          onClick={simpanUrl}
          disabled={url.trim() === urlTersimpan}
          className="rounded-md bg-cyan-500/80 px-4 py-2 font-alice text-sm text-white transition-colors hover:bg-cyan-500 disabled:opacity-40"
        >
          Simpan Tautan
        </button>
      </div>

      {pesan && (
        <p
          role={pesan.tipe === "error" ? "alert" : "status"}
          className={`font-alice text-sm ${pesan.tipe === "error" ? "text-red-300" : "text-cyan-200"}`}
        >
          {pesan.teks}
        </p>
      )}
    </div>
  );
}

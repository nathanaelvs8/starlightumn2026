"use client";

import { useState } from "react";
import clsx from "@/lib/clsx";

/**
 * Poster tegak satu tim: sampul, gradasi gelap, label "Tonton" (timnya
 * punya video — nontonnya di detail), nama, dan
 * jumlah suara. Dipakai kartu di halaman Vote DAN pratinjau kartu di form
 * admin — jadi yang dilihat admin pas milih sampul persis sama dengan yang
 * dilihat pengunjung.
 *
 * Ukurannya ngikut pembungkusnya (isi `absolute inset-0`); pembungkusnya
 * yang nentuin rasio (aspect-[3/4]).
 */
export function PosterTim({
  nama,
  sampul,
  adaVideo,
  jumlah,
  kecil,
}: {
  nama: string;
  sampul: string | null;
  adaVideo: boolean;
  /** Kosong = baris jumlah suara nggak ditampilkan. */
  jumlah?: number;
  /**
   * Poster kecil (pratinjau di form admin, lebar ±140px). Ukuran hurufnya
   * dikunci ukuran HP — breakpoint `sm:` ngikut lebar LAYAR, bukan lebar
   * posternya, jadi di layar lebar pratinjaunya kebagian huruf raksasa.
   */
  kecil?: boolean;
}) {
  return (
    <>
      {sampul ? <GambarPoster key={sampul} src={sampul} /> : <TanpaFoto />}

      {/* Gradasi biar nama selalu kebaca, apa pun gambarnya. */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-night via-night/70 to-transparent" />

      {adaVideo && (
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 font-alice text-[10px] uppercase tracking-[0.18em] text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] sm:text-[11px]">
          <IkonPutar className="h-3.5 w-3.5" />
          Tonton
        </span>
      )}

      <span className={clsx("absolute inset-x-0 bottom-0 block", kecil ? "p-3" : "p-3 sm:p-4")}>
        {/* Tanpa kelas `block`: line-clamp butuh display-nya sendiri, dan
            `block` bakal menimpanya — namanya jadi nggak kepotong 2 baris. */}
        <span
          className={clsx(
            "line-clamp-2 break-words font-display leading-tight text-white [text-shadow:0_0_16px_rgba(190,184,255,0.45)]",
            kecil ? "text-lg" : "text-lg sm:text-2xl",
          )}
        >
          {nama || "Nama tim"}
        </span>
        {jumlah !== undefined && (
          <span className="mt-1 block font-alice text-xs text-cyan-200/90">{jumlah} suara</span>
        )}
      </span>
    </>
  );
}

/**
 * Sampul di dalam poster. Reel / video HP (tegak) pas langsung;
 * gambar melebar (thumbnail YouTube, foto mendatar) nggak dipotong
 * habis-habisan — ditaruh utuh agak ke atas, biar bagian bawah lega buat
 * nama, sisanya diisi versi buram dirinya sendiri.
 */
function GambarPoster({ src }: { src: string }) {
  const [melebar, setMelebar] = useState(false);
  /** File sampulnya hilang / link-nya rusak → jangan tampilkan ikon gambar pecah. */
  const [rusak, setRusak] = useState(false);
  if (rusak) return <TanpaFoto />;
  return (
    <>
      {melebar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        loading="lazy"
        onLoad={(e) => setMelebar(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight * 1.05)}
        onError={() => setRusak(true)}
        className={clsx(
          "absolute inset-0 h-full w-full transition-transform duration-500 [@media(hover:hover)]:group-hover:scale-[1.04]",
          melebar ? "object-contain object-[50%_28%]" : "object-cover",
        )}
      />
    </>
  );
}

function TanpaFoto() {
  return <span className="absolute inset-0 grid place-items-center font-alice text-sm text-white/35">Tanpa foto</span>;
}

/**
 * Segitiga putar tipis bercahaya — bahan visualnya sama kayak panah &
 * tombol tutup di halaman Division (garis tipis + glow), bukan bulatan.
 */
export function IkonPutar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className={className}
      style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 12px rgba(190,184,255,0.7))" }}
    >
      <path d="M17 11 L37 24 L17 37 Z" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

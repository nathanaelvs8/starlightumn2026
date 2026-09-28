"use client";

import Link from "next/link";
import { SmallSeal } from "./MagicCircle";
import { asset } from "@/lib/assets";
import type { Stage } from "@/lib/stages";
import clsx from "@/lib/clsx";

/**
 * Satu panggung di daftar /stages: logo versi KEKUNCI di dalam cincin
 * sihirnya sendiri, bisa diklik buat masuk ke halamannya.
 *
 * === Kenapa kotaknya persegi ===
 *
 * Cincinnya lingkaran, jadi wadahnya harus persegi — kalau nggak,
 * cincinnya jadi lonjong. Logonya (yang melebar) ditaruh di tengah
 * dengan lebar 78% dari sisi kotak. Logo paling jangkung di antara
 * ketiganya cuma setinggi ±50% sisi kotak, jadi aman nggak nabrak
 * cincin.
 *
 * === Yang terjadi pas disentuh ===
 *
 * Gembok & rantainya "nyala": logonya jadi lebih terang dan dikasih
 * glow warna panggungnya, cincinnya ikut terang, terus naik dikit.
 * Bukan kebuka beneran — cuma ngasih tau kalau ini bisa diklik.
 *
 * Tiap efeknya dipasang dua kali: `group-hover` buat mouse dan
 * `group-active` buat jari. Di HP nggak ada hover sama sekali, jadi
 * tanpa yang kedua segelnya bakal diem total pas diketuk.
 */
export function StageSeal({
  stage,
  /** Lebar kotak persegi. Isi pakai satuan CSS apa pun. */
  size,
  className,
  priority,
  /**
   * Render sebagai <div> polos, bukan <a>.
   *
   * Dipakai kalau segelnya cuma jadi BAGIAN dari tautan yang lebih
   * besar — kayak baris di jalur konstelasi /stages, yang satu baris
   * (segel + nama + tagline) semuanya satu tautan. Tautan di dalam
   * tautan itu HTML nggak sah dan bikin tap target-nya rebutan.
   */
  tanpaLink,
}: {
  stage: Stage;
  size: string;
  className?: string;
  priority?: boolean;
  tanpaLink?: boolean;
}) {
  const kelas = clsx(
    "group relative grid aspect-square place-items-center outline-offset-8",
    className,
  );
  const gaya = { width: size, ["--accent" as string]: stage.accent };

  const isi = (
    <>
      {/*
        Sumur gelap di belakang logo.

        Tulisan di karya aslinya warnanya abu-abu SEDANG, dan latar
        halamannya juga sedang — jadi hurufnya nyaris hilang. Dikasih
        alas gelap begini, abu-abunya jadi lebih terang dari alasnya
        dan langsung kebaca, rantai putihnya juga makin nyala.
        Kebetulan pas juga sama konsepnya: panggung yang disegel di
        dalam bayangan.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(3,8,26,0.78) 0%, rgba(3,8,26,0.5) 46%, rgba(3,8,26,0) 72%)",
        }}
      />

      {/* Kabut warna panggung, nyala pas disentuh. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[12%] rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40 group-active:opacity-40"
        style={{ background: stage.accent }}
      />

      <SmallSeal
        accent={stage.accent}
        className="absolute inset-0 h-full w-full opacity-45 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.stages.logoLocked(stage.slug)}
        alt=""
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        className="relative w-[84%] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.04] group-active:-translate-y-1.5 group-active:scale-[1.04]"
        style={{
          /* Karya aslinya sengaja diredupin biar kerasa "mati". Di atas
             latar segelap ini jadi kelewat tenggelam, jadi dinaikin
             dikit — rantainya yang udah nyaris putih boleh saja mentok,
             emang maunya berkilau. */
          filter:
            "brightness(1.3) contrast(1.12) drop-shadow(0 6px 22px rgba(0,0,0,0.55))",
        }}
      />

      {/* Glow warna panggung ditumpuk di atas logo — pakai lapisan
          kedua, bukan filter di logonya, biar abu-abunya nggak ikut
          keganti warna. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.stages.logoLocked(stage.slug)}
        alt=""
        aria-hidden
        draggable={false}
        loading="lazy"
        className="pointer-events-none absolute w-[84%] opacity-0 mix-blend-screen transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.04] group-hover:opacity-60 group-active:-translate-y-1.5 group-active:scale-[1.04] group-active:opacity-60"
        style={{
          filter: `drop-shadow(0 0 14px ${stage.accent}) drop-shadow(0 0 30px ${stage.accent})`,
        }}
      />

      {/* Petunjuk kecil, muncul pas disentuh.

          Cuma dipasang di versi tautan-sendiri (susunan segitiga di
          layar lebar). Di jalur konstelasi HP petunjuknya udah ada di
          sebelah segel sebagai teks beneran, jadi kalau dipasang lagi
          di sini malah ketumpuk. */}
      {!tanpaLink && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[16%] font-alice text-xs uppercase tracking-[0.25em] text-white/0 transition-all duration-500 group-hover:text-white/75"
        >
          Lihat Panggung
        </span>
      )}
    </>
  );

  if (tanpaLink) {
    return (
      <div aria-hidden className={kelas} style={gaya}>
        {isi}
      </div>
    );
  }

  return (
    <Link
      href={`/stages/${stage.slug}`}
      aria-label={`Panggung ${stage.name} — belum dibuka`}
      className={kelas}
      style={gaya}
    >
      {isi}
    </Link>
  );
}

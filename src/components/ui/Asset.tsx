"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "@/lib/clsx";

/**
 * Gambar dari tim visual.
 *
 * === Kenapa ada `trim` ===
 *
 * PNG dari tim visual biasanya punya area transparan yang lebar di
 * sekeliling tulisannya. Akibatnya tulisan kelihatan kecil dan jaraknya
 * jauh — dan itu NGGAK BISA dirapetin lewat margin, karena ruang
 * kosongnya ada di dalam file.
 *
 * Komponen ini baca piksel gambarnya, cari batas isi yang beneran
 * (piksel yang nggak transparan), terus cuma nampilin bagian itu.
 * Hasilnya tulisan langsung gede dan nempel, tanpa perlu crop manual.
 *
 * Matiin dengan `trim={false}` kalau ruang kosongnya emang disengaja.
 *
 * === `size` ===
 * Lebar maksimum gambar. Ganti kalau mau gedein/kecilin.
 */

const SIZES = {
  xs: "max-w-[140px]",
  sm: "max-w-[220px]",
  md: "max-w-[300px]",
  lg: "max-w-[380px]",
  xl: "max-w-[480px]",
  "2xl": "max-w-[600px]",
  "3xl": "max-w-[760px]",
  "4xl": "max-w-[920px]",
  full: "max-w-full",
} as const;

export type AssetSize = keyof typeof SIZES;

/**
 * Skala TINGGI — dipakai buat judul.
 *
 * Kenapa judul dikunci tinggi, bukan lebar? Karena kalau dikunci lebar,
 * kata yang panjang ("MISSION") hurufnya jadi lebih kecil dari kata yang
 * pendek ("THEME") biar muat. Dikunci tinggi, semua judul hurufnya sama
 * besar berapa pun panjang katanya — dan tingginya seragam, jadi isi di
 * bawahnya otomatis sejajar.
 *
 * Nilainya clamp(min, ikut lebar layar, max) supaya tetap responsif.
 */
const HEIGHTS = {
  xs: "clamp(22px, 2.4vw, 32px)",
  sm: "clamp(28px, 3.2vw, 44px)",
  md: "clamp(36px, 4.2vw, 60px)",
  lg: "clamp(44px, 5.4vw, 78px)",
  xl: "clamp(56px, 7vw, 104px)",
} as const;

export type AssetHeight = keyof typeof HEIGHTS;

/** Batas alpha — piksel di bawah ini dianggap kosong. */
const ALPHA_THRESHOLD = 10;
/** Lebar sampel buat baca piksel. Kecil = cepat, cukup akurat. */
const SAMPLE_WIDTH = 240;

type Box = { x: number; y: number; w: number; h: number; ratio: string };

export function Asset({
  src,
  alt,
  size = "full",
  height,
  trim = true,
  className,
  imgClassName,
  priority,
}: {
  src: string;
  /** Kosongin ("") kalau gambarnya cuma hiasan. */
  alt: string;
  size?: AssetSize;
  /**
   * Kunci TINGGI, bukan lebar. Pakai ini buat semua judul biar besar
   * hurufnya seragam dan sejajar antar kolom. Kalau diisi, `size`
   * diabaikan.
   */
  height?: AssetHeight;
  /** Potong otomatis area transparan di pinggir. Default nyala. */
  trim?: boolean;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const done = useRef(false);
  const filename = src.split("/").pop();

  useEffect(() => {
    if (!trim || done.current) return;
    done.current = true;

    const img = new window.Image();
    img.src = src;

    img.onerror = () => setFailed(true);
    img.onload = () => {
      const { naturalWidth: W, naturalHeight: H } = img;
      if (!W || !H) return;

      try {
        const sw = Math.min(SAMPLE_WIDTH, W);
        const sh = Math.max(1, Math.round((H / W) * sw));

        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, sw, sh);
        const { data } = ctx.getImageData(0, 0, sw, sh);

        let minX = sw;
        let minY = sh;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            if (data[(y * sw + x) * 4 + 3] > ALPHA_THRESHOLD) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Gambar tanpa transparansi sama sekali — nggak perlu dipotong.
        if (maxX < 0 || (minX === 0 && minY === 0 && maxX === sw - 1 && maxY === sh - 1)) {
          return;
        }

        const x = minX / sw;
        const y = minY / sh;
        const w = (maxX - minX + 1) / sw;
        const h = (maxY - minY + 1) / sh;

        setBox({ x, y, w, h, ratio: `${w * W} / ${h * H}` });
      } catch {
        /* canvas nggak bisa dibaca — tampilkan gambar apa adanya */
      }
    };
  }, [src, trim]);

  const wrapper = height
    ? clsx("flex w-full justify-center", className)
    : clsx("mx-auto w-full", SIZES[size], className);

  if (failed) {
    return (
      <div
        data-missing-asset={src}
        className={clsx(
          wrapper,
          "flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-raised px-4 py-8 text-center",
        )}
      >
        <span className="font-display text-xs font-bold text-muted sm:text-sm">
          {alt || filename}
        </span>
        <span className="break-all text-[11px] text-faint">{filename}</span>
      </div>
    );
  }

  // Sudah ketemu batas isinya — tampilkan cuma bagian itu.
  if (box) {
    return (
      <div className={wrapper}>
        <div
          className={clsx("relative overflow-hidden", height ? "max-w-full" : "w-full")}
          style={
            height
              ? { aspectRatio: box.ratio, height: HEIGHTS[height], width: "auto" }
              : { aspectRatio: box.ratio }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={clsx("absolute max-w-none", imgClassName)}
            style={{
              width: `${100 / box.w}%`,
              height: "auto",
              left: `${(-box.x / box.w) * 100}%`,
              top: `${(-box.y / box.h) * 100}%`,
            }}
          />
        </div>
      </div>
    );
  }

  // Belum selesai dihitung, atau trim dimatiin.
  return (
    <div className={wrapper}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        className={clsx(height ? "w-auto max-w-full" : "h-auto w-full", imgClassName)}
        style={height ? { height: HEIGHTS[height] } : undefined}
      />
    </div>
  );
}

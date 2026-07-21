"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import clsx from "@/lib/clsx";

/**
 * Blok besar dengan satu background.
 *
 * === `ratio` ===
 *
 * Isi pakai rasio gambar background-nya, mis. "1920/1450". Tinggi band
 * dikunci ke rasio itu, jadi gambar kepakai PAS — nggak ada sisa warna
 * polos di bawah, dan band berikutnya langsung nempel.
 *
 * Kalau isinya ternyata lebih tinggi dari band, ISINYA yang dikecilin
 * otomatis (di-scale) sampai muat. Band-nya nggak pernah melar.
 *
 * Di layar kecil (< 1024px) penguncian ini dimatiin — kalau dipaksa,
 * band cuma setinggi ~280px dan isinya bakal keciiil banget. Di sana
 * band tumbuh normal dan background pakai "cover" biar tetap nggak ada
 * putih.
 *
 * === `fit` ===
 * "width" (default) — lebar gambar pas ke lebar layar, nggak dizoom.
 * "tile" — sama, tapi diulang ke bawah.
 * "cover" — dizoom sampai nutup penuh, kiri-kanan bisa kepotong.
 */

/** Batas paling kecil isi boleh diciutin. */
const MIN_SCALE = 0.6;
/** Di bawah lebar ini, rasio nggak dikunci. */
const LOCK_FROM = 1024;

export function Band({
  bg,
  ratio,
  fit = "width",
  position = "top center",
  children,
  className,
}: {
  bg?: string;
  ratio?: string;
  fit?: "width" | "tile" | "cover";
  position?: string;
  children: ReactNode;
  className?: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [locked, setLocked] = useState(false);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const on = Boolean(ratio) && window.innerWidth >= LOCK_FROM;
    setLocked(on);

    if (!on) {
      setScale(1);
      return;
    }

    const available = section.clientHeight;
    const needed = content.scrollHeight;
    if (!available || !needed) return;

    setScale(needed > available ? Math.max(MIN_SCALE, available / needed) : 1);
  }, [ratio]);

  useEffect(() => {
    measure();

    const ro = new ResizeObserver(measure);
    if (sectionRef.current) ro.observe(sectionRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", measure);

    // gambar selesai dimuat bisa mengubah tinggi isi
    const t = window.setTimeout(measure, 400);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [measure]);

  const style: CSSProperties = {};

  if (bg) {
    style.backgroundImage = `url("${bg}")`;
    style.backgroundSize = !locked || fit === "cover" ? "cover" : "100% auto";
    style.backgroundRepeat = fit === "tile" ? "repeat-y" : "no-repeat";
    style.backgroundPosition = position;
  }

  if (locked && ratio) style.aspectRatio = ratio;

  return (
    <section
      ref={sectionRef}
      /* Cek di DevTools: kalau nilainya < 1, isi band ini lagi
         dipaksa ciut biar muat. Kurangi isinya sampai balik ke 1. */
      data-band-scale={scale.toFixed(2)}
      className={clsx(
        "relative bg-band",
        locked && "flex items-center overflow-hidden",
        className,
      )}
      style={style}
    >
      <div
        ref={contentRef}
        className={clsx("w-full", locked && "shrink-0")}
        style={
          scale < 1
            ? { transform: `scale(${scale})`, transformOrigin: "center center" }
            : undefined
        }
      >
        {children}
      </div>
    </section>
  );
}

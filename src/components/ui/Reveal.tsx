"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Bikin isinya muncul pas ke-scroll sampai kelihatan.
 *
 * === Kelakuannya ===
 *
 * Scroll turun  → isi nunggu sebentar (JEDA_AWAL), baru muncul
 *                 pakai fade + gerak.
 * Scroll terus  → tetap kelihatan, nggak ilang.
 * Balik ke atas → begitu elemennya balik ke BAWAH layar, dia
 *                 ngilang lagi pakai animasi yang sama tapi mundur.
 *
 * Jadi yang bikin ngilang cuma satu kondisi: elemennya belum
 * kelewatan. Kalau udah kelewatan ke atas, dia tetap tampil.
 *
 * === Kenapa pakai IntersectionObserver ===
 *
 * Ini API bawaan browser yang ngasih tau kapan elemen masuk layar.
 * Nggak perlu ngitung posisi scroll tiap frame, jadi scroll-nya tetap
 * mulus di HP.
 *
 * === Pengaman ===
 *
 * Karena kondisi awalnya nggak kelihatan, kalau observer-nya gagal
 * jalan teksnya bisa ilang permanen. Makanya ada timer cadangan: kalau
 * 2,5 detik nggak ada kabar, isinya ditampilin aja.
 *
 * Buat yang nyalain "kurangi animasi" di pengaturan sistem, aturan di
 * globals.css otomatis matiin gerakannya — isinya langsung tampil.
 */

/* ---------------------------------------------------------------------
   SETELAN ANIMASI — geser angka di sini kalau mau disetel.
   --------------------------------------------------------------------- */

/**
 * Jeda sebelum animasi mulai, dihitung sejak elemennya masuk layar.
 * Bikin animasinya kerasa, nggak kelewat gitu aja.
 */
const JEDA_AWAL = 400;

/** Lama gerakannya. Gedein kalau mau lebih pelan. */
const DURASI = 700;

/* ------------------------------------------------------------------- */

/** Arah datangnya. */
type From = "up" | "left" | "right";

const HIDDEN: Record<From, string> = {
  up: "translateY(50px)",
  left: "translateX(-50px)",
  right: "translateX(50px)",
};

export function Reveal({
  children,
  from = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Arah datangnya isi. Default naik dari bawah. */
  from?: From;
  /** Jeda dalam milidetik. Dipakai buat bikin efek nyusul. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Kalau browsernya nggak dukung, tampilin aja.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          return;
        }
        // Cuma sembunyiin kalau elemennya masih DI BAWAH layar
        // alias belum kelewatan. Kalau udah lewat ke atas, biarin.
        if (entry.boundingClientRect.top > 0) setShown(false);
      },
      {
        // Dipicu pas ujung atasnya nyentuh sekitar 85% tinggi layar,
        // jadi kerasa pas, nggak telat.
        rootMargin: "0px 0px -15% 0px",
        threshold: 0.05,
      },
    );

    io.observe(el);

    // Timer cadangan kalau observer nggak pernah lapor.
    const failsafe = window.setTimeout(() => setShown(true), 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "none" : HIDDEN[from],
    transition: `opacity ${DURASI}ms ease, transform ${DURASI}ms ease`,
    /*
      Pas muncul: tunggu JEDA_AWAL dulu, baru gerak. `delay` dipakai
      buat bikin elemen bawah nyusul setelah yang atas.
      Pas ngilang: langsung, nggak pakai nunggu.
    */
    transitionDelay: shown ? `${JEDA_AWAL + delay}ms` : "0ms",
    willChange: "opacity, transform",
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
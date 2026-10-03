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
 * Setelah itu   → tetap tampil, SEKALI muncul ya udah.
 *
 * Dulu kalau di-scroll balik ke atas, elemen yang turun lagi ke bawah
 * layar ngilang, terus animasi ulang pas di-scroll turun lagi. Di
 * halaman pendek kayak /stages (Enchantia paling bawah) itu kejadian
 * tiap kali scroll naik-turun dikit — bikin pusing.
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
 * Dulu 400ms — pas scroll agak cepat, isinya kerasa telat nongol.
 */
const JEDA_AWAL = 100;

/** Lama gerakannya. Gedein kalau mau lebih pelan. */
const DURASI = 750;

/**
 * Kurva geraknya: cepat di awal, lalu melambat panjang sampai berhenti
 * (ease-out). Dulu `ease` biasa — gerakannya kerasa rata & mekanis.
 */
const KURVA = "cubic-bezier(0.22, 1, 0.36, 1)";

/* ------------------------------------------------------------------- */

/** Arah datangnya. Jaraknya dulu 50px — kelewat jauh, kesannya "loncat". */
type From = "up" | "left" | "right";

const HIDDEN: Record<From, string> = {
  up: "translateY(28px)",
  left: "translateX(-32px)",
  right: "translateX(32px)",
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

    /*
      Timer cadangan kalau observer-nya nggak pernah lapor sama sekali.
      Begitu observer lapor SEKALI (dia selalu lapor pas mulai ngamatin),
      timernya dibatalin. Dulu timernya dibiarin jalan: 2,5 detik setelah
      halaman kebuka SEMUA isi ditampilin, termasuk yang masih jauh di
      bawah — jadi animasi muncul di bagian bawah halaman nggak pernah
      kelihatan sama sekali.
    */
    const failsafe = window.setTimeout(() => setShown(true), 2500);

    const io = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(failsafe);
        // Masuk layar, ATAU udah kelewatan di atas (mis. halaman dibuka
        // dengan posisi scroll di tengah) → tampil, lalu berhenti ngamatin.
        if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
          setShown(true);
          io.disconnect();
        }
      },
      {
        // Dipicu pas ujung atasnya nyentuh sekitar 85% tinggi layar,
        // jadi kerasa pas, nggak telat.
        rootMargin: "0px 0px -15% 0px",
        threshold: 0.05,
      },
    );

    io.observe(el);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "none" : HIDDEN[from],
    transition: `opacity ${DURASI}ms ${KURVA}, transform ${DURASI}ms ${KURVA}`,
    /*
      Tunggu JEDA_AWAL dulu, baru gerak. `delay` dipakai buat bikin
      elemen bawah nyusul setelah yang atas.
    */
    transitionDelay: `${JEDA_AWAL + delay}ms`,
    willChange: "opacity, transform",
  };

  /* data-tampil dipakai globals.css buat nahan animasi "nyala" judul
     (.title-ignite) sampai bagian ini beneran muncul. */
  return (
    <div ref={ref} style={style} className={className} data-tampil={shown}>
      {children}
    </div>
  );
}
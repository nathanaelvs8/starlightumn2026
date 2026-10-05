"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import clsx from "@/lib/clsx";

/**
 * Pembungkus panggung yang segelnya masih kekunci.
 *
 * Dulu segel yang kekunci diam total pas diketuk — orang ngetuk, nggak
 * terjadi apa-apa, dan ngiranya situsnya rusak. Sekarang diketuk:
 *   - logonya goyang sebentar kayak gembok yang ditarik, rantainya
 *     berkilau warna panggungnya (±420ms);
 *   - `data-ditolak` nyala ±2,4 detik. Label di dalamnya bisa nanggepin
 *     lewat `group-data-[ditolak=true]/kunci:` — di segel layar lebar
 *     tanggalnya ganti jadi "Dibuka <tanggal>", di baris HP keterangan
 *     "Segera Dibuka"-nya nyala emas.
 *
 * Yang digoyang: elemen `[data-segel-logo]`; yang berkilau:
 * `[data-segel-kilau]` (dua-duanya ada di StageSeal).
 */
export function KunciPanggung({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();
  const [ditolak, setDitolak] = useState(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div
      ref={ref}
      data-ditolak={ditolak}
      className={clsx("group/kunci", className)}
      style={style}
      onClick={() => {
        const el = ref.current;
        if (el && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          el.querySelectorAll("[data-segel-logo]").forEach((logo) =>
            logo.animate(
              [
                { transform: "translateX(0) rotate(0)" },
                { transform: "translateX(-7px) rotate(-1.5deg)" },
                { transform: "translateX(6px) rotate(1.2deg)" },
                { transform: "translateX(-4px) rotate(-0.8deg)" },
                { transform: "translateX(2px) rotate(0.4deg)" },
                { transform: "translateX(0) rotate(0)" },
              ],
              { duration: 420, easing: "ease-out" },
            ),
          );
          el.querySelectorAll("[data-segel-kilau]").forEach((kilau) =>
            kilau.animate([{ opacity: 0 }, { opacity: 0.75, offset: 0.3 }, { opacity: 0 }], {
              duration: 420,
              easing: "ease-out",
            }),
          );
        }
        setDitolak(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setDitolak(false), 2400);
      }}
    >
      {children}
    </div>
  );
}

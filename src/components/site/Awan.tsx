import { asset } from "@/lib/assets";
import clsx from "@/lib/clsx";

/**
 * Satu gumpalan awan dekor yang nongol dari pinggir layar.
 *
 * Gambarnya potongan dari separator (lihat convert-awan.js), jadi
 * warnanya sama persis sama barisan awan di antara band. Kesannya:
 * ada awan yang lepas dari barisan terus melayang sendiri.
 *
 * === Nempelnya ke mana ===
 *
 * Posisi TEGAK (`atas`) dihitung dari pembungkus terdekat yang
 * `relative` — sengaja ditaruh di blok judul/teks, bukan di band,
 * biar awannya selalu duduk di celah yang sama di HP maupun laptop.
 * Kalau pakai persen tinggi band, di HP teksnya memanjang dan awannya
 * bakal nabrak paragraf.
 *
 * Posisi MENDATAR dihitung dari pinggir LAYAR, bukan pembungkusnya:
 * `50% - 50vw` itu pinggir layar selama pembungkusnya ada di tengah
 * (semua blok di homepage rata tengah). `keluar` = seberapa banyak
 * awannya kepotong keluar layar. Band-nya `overflow-hidden`, jadi yang
 * keluar nggak bikin geseran mendatar.
 *
 * === Gerak ===
 *
 * Hanyut pelan kiri-kanan, bolak-balik. Tiap awan dikasih durasi dan
 * jeda beda biar nggak gerak barengan kayak baris-berbaris. Yang
 * nyalain "kurangi gerakan" otomatis diam (aturan di globals.css).
 */
export function Awan({
  n,
  sisi,
  atas,
  lebar,
  keluar = 0.3,
  redup = 0.85,
  balik = false,
  durasi = 20,
  jeda = 0,
  className,
}: {
  /** Nomor potongan, 1-6. 1-4 lebar, 5-6 kecil. */
  n: 1 | 2 | 3 | 4 | 5 | 6;
  sisi: "kiri" | "kanan";
  /** Jarak dari atas pembungkus, CSS apa aja ("-3rem", "calc(100% + 2rem)"). */
  atas: string;
  /** Lebar awan, CSS. Pakai clamp biar di HP mengecil. */
  lebar: string;
  /** Bagian yang kepotong keluar layar, 0-1. */
  keluar?: number;
  /** Opacity. */
  redup?: number;
  /** Cermin mendatar, biar potongan yang sama nggak kelihatan kembar. */
  balik?: boolean;
  /** Lama satu kali hanyut (detik). */
  durasi?: number;
  /** Mulai di tengah jalan (detik), biar nggak serempak. */
  jeda?: number;
  className?: string;
}) {
  const tepi = `calc(50% - 50vw - ${lebar} * ${keluar})`;

  return (
    <span
      aria-hidden
      className={clsx("pointer-events-none absolute block", className)}
      style={{
        top: atas,
        width: lebar,
        opacity: redup,
        [sisi === "kiri" ? "left" : "right"]: tepi,
      }}
    >
      <span
        className="awan-hanyut block"
        style={
          {
            "--geser": sisi === "kiri" ? "22px" : "-22px",
            animationDuration: `${durasi}s`,
            animationDelay: `-${jeda}s`,
          } as React.CSSProperties
        }
      >
        <img
          src={asset.home.awan[n - 1]}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
          style={balik ? { transform: "scaleX(-1)" } : undefined}
        />
      </span>
    </span>
  );
}

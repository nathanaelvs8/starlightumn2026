"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { REDUP_BAWAAN, type Stage } from "@/lib/stages";

/**
 * Portal dari daftar /stages ke halaman panggung.
 *
 * Segel yang diklik nggak langsung pindah halaman. Dari cincinnya kebuka
 * lingkaran yang isinya udah DUNIA panggung tujuannya (latar halaman
 * panggung itu), dipinggirin cincin cahaya warna panggungnya yang muter
 * sambil melebar sampai nutup layar. Begitu penuh, halaman panggungnya
 * dibuka di baliknya, lalu portalnya memudar — dan segel di halaman itu
 * lanjut "kebuka" (.segel-buka) dari situ.
 *
 * === Kenapa dipasang di layout, bukan di segelnya ===
 *
 * Segelnya ikut hilang begitu halaman /stages diganti. Kalau portalnya
 * nempel di segel, dia lenyap tepat pas mau memudar. Komponen ini
 * dipasang sekali di src/app/(site)/layout.tsx, yang nggak ikut diganti
 * waktu pindah halaman; segelnya cuma ngirim permintaan lewat event.
 *
 * === Kenapa digerakin pakai JS, bukan animasi CSS ===
 *
 * Lingkaran portalnya (clip-path) dan cincinnya (transform) harus selalu
 * pas satu sama lain. Kalau dua-duanya animasi CSS, browser ngejalanin
 * transform di thread terpisah tapi clip-path di thread utama — pas
 * thread utamanya sibuk (gambar diproses, halaman tujuan diunduh),
 * cincinnya jalan duluan dan lingkarannya ketinggalan di belakang.
 * Digerakin dari satu jam yang sama tiap frame, dua-duanya nggak bisa
 * lepas. (Bikin lingkarannya pakai transform juga nggak bisa: dunia di
 * dalamnya bakal ikut mengecil jadi kotak kecil, bukan jendela.)
 *
 * === Durasi ===
 *
 * Melebar 600ms, memudar 440ms (jeda 60ms + 380ms). Di antaranya cuma
 * nunggu halaman tujuannya siap — halaman itu udah di-prefetch sejak
 * portalnya mulai kebuka, jadi di versi produksi biasanya langsung.
 * (Di `next dev` prefetch dimatiin Next, jadi di sana kerasa nunggu.)
 *
 * Yang minta gerakan dikurangi (prefers-reduced-motion) nggak dapet
 * portal sama sekali — tautannya jalan biasa.
 */

const EVENT_PORTAL = "starlight:portal";

type PermintaanPortal = {
  href: string;
  /** Pusat segelnya, koordinat layar. */
  x: number;
  y: number;
  /** Jari-jari cincin segelnya — portalnya mulai dari ukuran ini. */
  r0: number;
  warna: string;
  latar: string;
  redup: number;
};

type Fase = "buka" | "tunggu" | "tutup";

const DURASI_BUKA = 600;

/** Cincinnya muter seperempat putaran lebih dikit selama melebar. */
const PUTAR = -110;

/**
 * Cincin cahayanya dibikin sedikit lebih besar dari lingkaran portalnya,
 * biar glow-nya bisa nongol KELUAR tepi portal (ke halaman lama), bukan
 * cuma ke dalam. Inti putihnya ada di 1/LEBIH jari-jari kotaknya.
 */
const LEBIH = 1.06;

/** Pelan di awal (segelnya "ngumpulin tenaga"), cepat, lalu mendarat. */
function kurva(p: number) {
  return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
}

/** Overlay portalnya. Dipasang sekali di layout situs. */
export function PortalPanggung() {
  const router = useRouter();
  const pathname = usePathname();
  const [portal, setPortal] = useState<(PermintaanPortal & { R: number; lebar: number; fase: Fase }) | null>(null);
  const dunia = useRef<HTMLDivElement>(null);
  const cincin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const buka = (e: Event) => {
      const d = (e as CustomEvent<PermintaanPortal>).detail;
      /* Ujung paling jauh dari segelnya — portalnya harus sampai sana
         biar layarnya ketutup penuh. +60px biar cincinnya ikut lewat. */
      const w = window.innerWidth;
      const h = window.innerHeight;
      const R =
        Math.max(
          Math.hypot(d.x, d.y),
          Math.hypot(w - d.x, d.y),
          Math.hypot(d.x, h - d.y),
          Math.hypot(w - d.x, h - d.y),
        ) + 60;
      /* Tandain "ditangani" — tautannya baru batal pindah halaman kalau
         portal ini beneran ada (lihat bukaPortal). */
      e.preventDefault();
      router.prefetch(d.href);
      /* Lebar tanpa scrollbar — sama kayak .latar-layar (left:0 right:0)
         di halaman tujuannya, biar gambarnya kepotong persis sama. */
      setPortal({ ...d, R, lebar: document.documentElement.clientWidth, fase: "buka" });
    };
    window.addEventListener(EVENT_PORTAL, buka);
    return () => window.removeEventListener(EVENT_PORTAL, buka);
  }, [router]);

  const fase = portal?.fase;
  const tujuan = portal?.href;

  /* Portalnya melebar. Lingkaran & cincin diatur langsung di DOM tiap
     frame (bukan lewat state) — ganti state 60× sedetik cuma bikin
     React kerja buat hal yang nggak perlu. */
  useEffect(() => {
    if (!portal || portal.fase !== "buka") return;
    const { x, y, r0, R, href } = portal;
    let id = 0;
    let mulai = -1;
    const langkah = (now: number) => {
      if (mulai < 0) mulai = now;
      const p = Math.min(1, (now - mulai) / DURASI_BUKA);
      const e = kurva(p);
      const r = r0 + (R - r0) * e;
      if (dunia.current) {
        dunia.current.style.clipPath = `circle(${r}px at ${x}px ${y}px)`;
        dunia.current.style.opacity = String(Math.min(1, p / 0.15));
      }
      if (cincin.current) {
        cincin.current.style.transform = `scale(${r / R}) rotate(${PUTAR * (1 - e)}deg)`;
        cincin.current.style.opacity = String(Math.min(1, p / 0.12));
      }
      if (p < 1) {
        id = requestAnimationFrame(langkah);
      } else {
        setPortal((q) => q && { ...q, fase: "tunggu" });
        router.push(href);
      }
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [portal, router]);

  /* Halaman tujuannya udah tampil di balik portal → portalnya memudar. */
  useEffect(() => {
    if (fase === "tunggu" && pathname === tujuan) {
      setPortal((p) => p && { ...p, fase: "tutup" });
    }
  }, [fase, tujuan, pathname]);

  /* Jaga-jaga: kalau halaman tujuannya nggak kunjung kebuka (koneksi
     putus dsb.), portalnya jangan sampai nutupin layar selamanya. */
  useEffect(() => {
    if (fase !== "tunggu") return;
    const t = window.setTimeout(() => setPortal((p) => p && { ...p, fase: "tutup" }), 8000);
    return () => window.clearTimeout(t);
  }, [fase]);

  if (!portal) return null;

  const { x, y, r0, R, lebar, warna, latar, redup } = portal;
  const D = 2 * R * LEBIH;
  const peredup = `rgb(var(--c-night-rgb) / ${redup / 100})`;
  /* Keadaan awal sebelum frame pertama; setelah itu diatur efek di atas.
     Nilai ini sama di tiap render selama fase "buka", jadi React nggak
     bakal nimpa yang udah diatur efeknya. */
  const awal = portal.fase === "buka";

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[95] ${portal.fase === "tutup" ? "portal-tutup" : ""}`}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && portal.fase === "tutup") setPortal(null);
      }}
    >
      {/* Dunia panggung tujuannya — latar & peredup yang sama persis
          kayak halaman panggungnya, jadi pas portalnya memudar nggak
          kelihatan ada yang ganti. */}
      <div
        ref={dunia}
        className="absolute left-0 top-0"
        style={{
          width: lebar,
          height: "100lvh",
          background: `linear-gradient(${peredup}, ${peredup}), url("${latar}") center / cover no-repeat, rgb(var(--c-night-rgb))`,
          clipPath: `circle(${awal ? r0 : R}px at ${x}px ${y}px)`,
          opacity: awal ? 0 : 1,
        }}
      />

      {/* Cincin cahaya di tepi portal: glow warna panggung dengan inti
          putih, plus deretan garis rune yang muter. Ukurannya penuh dari
          awal dan cuma di-scale — jadi nggak perlu digambar ulang. */}
      <div
        ref={cincin}
        className="absolute rounded-full will-change-transform"
        style={{
          left: x - D / 2,
          top: y - D / 2,
          width: D,
          height: D,
          background: `radial-gradient(closest-side, transparent 80%, ${warna}26 87%, ${warna}99 92.5%, #fff 94.3%, ${warna}aa 95.3%, ${warna}33 97.5%, transparent 100%)`,
          transform: awal ? `scale(${r0 / R}) rotate(${PUTAR}deg)` : "none",
          opacity: awal ? 0 : 1,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "repeating-conic-gradient(rgba(255,255,255,0.85) 0deg 0.5deg, transparent 0.5deg 4deg)",
            WebkitMaskImage:
              "radial-gradient(closest-side, transparent 90.4%, #000 90.9%, #000 92.6%, transparent 93.1%)",
            maskImage:
              "radial-gradient(closest-side, transparent 90.4%, #000 90.9%, #000 92.6%, transparent 93.1%)",
          }}
        />
      </div>

      {/* Kilatan di segelnya pas portalnya mulai kebuka. */}
      <div
        className="portal-kilat absolute rounded-full"
        style={{
          left: x - r0,
          top: y - r0,
          width: 2 * r0,
          height: 2 * r0,
          background: `radial-gradient(closest-side, #fff, ${warna} 45%, transparent)`,
        }}
      />
    </div>
  );
}


/**
 * Minta portalnya dibuka. Balikin `true` kalau ada PortalPanggung yang
 * nanggepin; kalau nggak ada (mis. dipakai di luar layout situs), yang
 * manggil harus biarin tautannya jalan biasa.
 */
function bukaPortal(p: PermintaanPortal) {
  return !window.dispatchEvent(new CustomEvent(EVENT_PORTAL, { detail: p, cancelable: true }));
}

/**
 * Tautan ke halaman panggung yang membuka lewat portal.
 *
 * Pusat portalnya diambil dari elemen `[data-segel]` — tautannya sendiri
 * (segel di susunan segitiga) atau segel di dalamnya (baris di HP, yang
 * satu barisnya satu tautan).
 */
export function TautanPortal({
  stage,
  className,
  style,
  children,
  ...rest
}: {
  stage: Stage;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  "aria-label"?: string;
  "data-segel"?: boolean;
}) {
  const href = `/stages/${stage.slug}`;

  /* Latar panggungnya dimuat & di-decode duluan pas browsernya senggang,
     biar isi portalnya udah siap pas diklik — bukan lingkaran kosong,
     dan frame pertama portalnya nggak ketahan nunggu gambar diproses. */
  useEffect(() => {
    const muat = () => {
      const img = new Image();
      img.src = stage.bg;
      img.decode().catch(() => {});
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(muat);
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(muat, 1500);
    return () => clearTimeout(t);
  }, [stage.bg]);

  return (
    <Link
      href={href}
      className={className}
      style={style}
      {...rest}
      onClick={(e) => {
        /* Ctrl/Cmd-klik, klik tengah, dst. → biarin browsernya (tab baru). */
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const el = e.currentTarget;
        const segel = el.matches("[data-segel]") ? el : el.querySelector<HTMLElement>("[data-segel]") ?? el;
        const b = segel.getBoundingClientRect();
        const ditangani = bukaPortal({
          href,
          x: b.left + b.width / 2,
          y: b.top + b.height / 2,
          /* Cincin SmallSeal ada di ±43–48% sisi kotaknya. */
          r0: b.width * 0.43,
          warna: stage.accent,
          latar: stage.bg,
          redup: stage.redup ?? REDUP_BAWAAN,
        });
        if (ditangani) e.preventDefault();
      }}
    >
      {children}
    </Link>
  );
}

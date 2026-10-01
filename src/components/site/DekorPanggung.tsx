import type { CSSProperties, ReactNode } from "react";

/**
 * Dekor tambahan di hero halaman panggung, ngikutin "vibe" tiap panggung:
 *
 *   Lonielle   bara lilin emas yang naik + kelopak mawar yang jatuh
 *              (vibe: lorong lilin, karpet merah, lengkung mawar)
 *   Twizzle    gelembung pastel yang naik + kerlip warna-warni
 *              (vibe: balon bening, cat pelangi berbintang)
 *   Enchantia  kunang-kunang ungu-biru + kilau
 *              (vibe: cermin ajaib, portal bercahaya di hutan gelap)
 *
 * Cuma di area hero (sekitar lingkaran sihir), BUKAN di seluruh layar:
 * kalau partikelnya lewat di belakang kartu deskripsi, kaca buram
 * (backdrop-blur) kartunya harus dihitung ulang tiap frame — itu yang
 * bikin HP ngelag.
 *
 * Semua gerakannya cuma transform & opacity, dan dimatiin otomatis buat
 * yang nyalain "kurangi animasi" (aturan di globals.css). Posisi acaknya
 * pakai angka acak BERBENIH, jadi hasil render server & browser sama.
 * Di HP jumlahnya separuh (`hidden sm:block` tiap partikel kedua).
 */
export function DekorPanggung({ slug }: { slug: string }) {
  const isi =
    slug === "lonielle" ? <Lonielle /> : slug === "twizzle" ? <Twizzle /> : slug === "enchantia" ? <Enchantia /> : null;
  if (!isi) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[-4rem] h-[calc(100%+8rem)] w-screen -translate-x-1/2 overflow-hidden"
    >
      {isi}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Angka acak berbenih (mulberry32) — sama terus tiap render. */
function acak(benih: number) {
  let a = benih >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const antara = (r: () => number, min: number, max: number) => min + r() * (max - min);

/** Durasi + mulai di tengah siklus (delay negatif), biar nggak barengan. */
function waktu(r: () => number, min: number, max: number): CSSProperties {
  const d = antara(r, min, max);
  return { animationDuration: `${d.toFixed(2)}s`, animationDelay: `-${(r() * d).toFixed(2)}s` };
}

/**
 * Satu partikel = SATU elemen yang dianimasikan (lihat catatan di
 * globals.css: liukan, putaran, dan kedipnya udah di keyframes yang sama).
 */
function Partikel({
  i,
  kiri,
  atas,
  gerak,
  waktuGerak,
  children,
}: {
  i: number;
  kiri: number;
  atas: number;
  gerak: "dekor-naik" | "dekor-jatuh" | "dekor-kerlip" | "dekor-kunang";
  waktuGerak: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      className={`absolute ${gerak} ${i % 2 ? "hidden sm:block" : "block"}`}
      style={{ left: `${kiri}%`, top: `${atas}%`, ...waktuGerak }}
    >
      {children}
    </span>
  );
}

/** Kerlip empat sudut — bentuk yang sama dipakai di seluruh situs. */
function Kerlip({ ukuran, warna }: { ukuran: number; warna: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={ukuran}
      height={ukuran}
      style={{ filter: `drop-shadow(0 0 4px ${warna})` }}
    >
      <path d="M6 0Q6.9 5.1 12 6Q6.9 6.9 6 12Q5.1 6.9 0 6Q5.1 5.1 6 0Z" fill={warna} />
    </svg>
  );
}

/* ---------------------------- Lonielle ---------------------------- */

const WARNA_BARA = ["#ffd98a", "#ffbf66", "#ff9a5c"];

function Lonielle() {
  const r = acak(31);
  const bara = Array.from({ length: 18 }, (_, i) => {
    const ukuran = antara(r, 2.5, 5.5);
    const warna = WARNA_BARA[i % WARNA_BARA.length];
    return (
      <Partikel
        key={`b${i}`}
        i={i}
        kiri={antara(r, 2, 98)}
        atas={antara(r, 25, 98)}
        gerak="dekor-naik"
        waktuGerak={waktu(r, 9, 16)}
      >
        <span
          className="block rounded-full"
          style={{
            width: ukuran,
            height: ukuran,
            background: warna,
            boxShadow: `0 0 6px 2px ${warna}aa, 0 0 16px 5px rgba(255,120,60,0.3)`,
          }}
        />
      </Partikel>
    );
  });

  const kelopak = Array.from({ length: 8 }, (_, i) => {
    const ukuran = antara(r, 13, 20);
    return (
      <Partikel
        key={`k${i}`}
        i={i}
        kiri={antara(r, 3, 97)}
        atas={antara(r, -5, 45)}
        gerak="dekor-jatuh"
        waktuGerak={waktu(r, 13, 21)}
      >
        <svg viewBox="0 0 14 14" width={ukuran} height={ukuran} style={{ opacity: 0.8 }}>
          <defs>
            <linearGradient id={`kelopak-${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e5414f" />
              <stop offset="1" stopColor="#8e0f26" />
            </linearGradient>
          </defs>
          <path d="M7 0C11.5 3 13 8.5 7 14C1 8.5 2.5 3 7 0Z" fill={`url(#kelopak-${i})`} />
        </svg>
      </Partikel>
    );
  });

  return (
    <>
      {bara}
      {kelopak}
    </>
  );
}

/* ----------------------------- Twizzle ---------------------------- */

const PASTEL = ["#ffa6cb", "#9ccfff", "#ffe08a", "#a6f0cc", "#cdb6ff"];
/* Kerlipnya lebih pekat dari gelembung — kecil, jadi butuh warna penuh. */
const PELANGI = ["#ff8fc0", "#7cc7ff", "#ffd36b", "#7ff0b8", "#b996ff"];

function Twizzle() {
  const r = acak(47);
  const gelembung = Array.from({ length: 14 }, (_, i) => {
    const ukuran = antara(r, 12, 34);
    const warna = PASTEL[i % PASTEL.length];
    return (
      <Partikel
        key={`g${i}`}
        i={i}
        kiri={antara(r, 2, 98)}
        atas={antara(r, 30, 100)}
        gerak="dekor-naik"
        waktuGerak={waktu(r, 11, 19)}
      >
        {/* Balon bening: kilap putih di kiri-atas, isi pastel tipis
            yang makin pekat ke pinggir, plus pendar warnanya sendiri. */}
        <span
          className="block rounded-full"
          style={{
            width: ukuran,
            height: ukuran,
            opacity: 0.85,
            border: "1px solid rgba(255,255,255,0.55)",
            background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.95) 0 9%, transparent 11%), radial-gradient(circle at 50% 55%, ${warna}40 0%, ${warna}b3 72%, rgba(255,255,255,0.75) 100%)`,
            boxShadow: `0 0 12px ${warna}80`,
          }}
        />
      </Partikel>
    );
  });

  const kerlip = Array.from({ length: 12 }, (_, i) => (
    <Partikel
      key={`s${i}`}
      i={i}
      kiri={antara(r, 2, 98)}
      atas={antara(r, 5, 95)}
      gerak="dekor-kerlip"
      waktuGerak={waktu(r, 2.6, 4.6)}
    >
      <Kerlip ukuran={antara(r, 11, 17)} warna={PELANGI[i % PELANGI.length]} />
    </Partikel>
  ));

  return (
    <>
      {gelembung}
      {kerlip}
    </>
  );
}

/* ---------------------------- Enchantia --------------------------- */

const WARNA_KUNANG = ["#b9a2ff", "#7fd2ff", "#dca8ff"];

function Enchantia() {
  const r = acak(83);
  const kunang = Array.from({ length: 18 }, (_, i) => {
    const ukuran = antara(r, 4, 7);
    const warna = WARNA_KUNANG[i % WARNA_KUNANG.length];
    return (
      <Partikel
        key={`f${i}`}
        i={i}
        kiri={antara(r, 2, 98)}
        atas={antara(r, 8, 95)}
        gerak="dekor-kunang"
        waktuGerak={waktu(r, 6, 11)}
      >
        <span
          className="block rounded-full"
          style={{
            width: ukuran,
            height: ukuran,
            background: warna,
            boxShadow: `0 0 10px 4px ${warna}aa, 0 0 26px 9px rgba(140,110,255,0.3)`,
          }}
        />
      </Partikel>
    );
  });

  const kilau = Array.from({ length: 8 }, (_, i) => (
    <Partikel
      key={`c${i}`}
      i={i}
      kiri={antara(r, 4, 96)}
      atas={antara(r, 5, 90)}
      gerak="dekor-kerlip"
      waktuGerak={waktu(r, 3, 5)}
    >
      <Kerlip ukuran={antara(r, 7, 12)} warna={i % 2 ? "#ffffff" : "#cdb8ff"} />
    </Partikel>
  ));

  return (
    <>
      {kunang}
      {kilau}
    </>
  );
}

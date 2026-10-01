"use client";

import { useEffect, useRef } from "react";
import { RASI } from "@/lib/rasi";
import { WARNA_SIHIR } from "./MagicCircle";
import clsx from "@/lib/clsx";

/**
 * Rasi bintang di langit halaman /stages — yang "digambar" satu-satu.
 *
 * === Bedanya sama /division ===
 *
 * /division nempel gambar bintang.webp utuh, dua lapis, yang geser pelan
 * dan kedip. Di sini rasinya dari gambar yang SAMA, tapi udah diubah jadi
 * data (convert-rasi.js → src/lib/rasi.ts), jadi tiap garisnya bisa
 * digores sendiri:
 *
 *   bintang pertama muncul → garis merambat ke bintang berikutnya →
 *   bintang itu nyala pas garisnya nyampe → … → rasinya utuh, diam
 *   sebentar → pudar → beberapa detik kemudian digambar lagi.
 *
 * Tiap rasi punya jadwalnya sendiri, jadi di layar selalu ada yang lagi
 * digambar, ada yang lagi diam, ada yang lagi pudar. Bintang yang paling
 * nyala dikasih kerlip empat sudut yang sama kayak di lingkaran sihir —
 * tiga panggung itu rasi paling besar, ini rasi-rasi kecil di sekitarnya.
 *
 * === Posisinya & terangnya ===
 *
 * Disebar ke seluruh langit, termasuk di belakang lingkaran sihir — dia
 * bagian dari BACKGROUND, bukan hiasan yang minta dilihat. Makanya kecil
 * dan redup: pas paling terang pun cuma ±55% (.rasi-langit di
 * globals.css), garisnya ±30%. Lapisannya `fixed`, jadi diam pas
 * halamannya discroll (sama kayak background-nya).
 *
 * === Kenapa begini bikinnya (PENTING — hasil ngukur, bukan tebakan) ===
 *
 * 1. HTML, bukan SVG. Versi SVG (stroke-dashoffset + transform di <g>)
 *    bikin main thread sibuk ±66% dan ±440 gambar ulang per detik:
 *    animasi di dalam svg selalu digambar ulang tiap frame, bahkan pas
 *    nilainya lagi diam.
 *
 * 2. Animasi cuma jalan pas ada yang GERAK. Versi HTML dengan animasi
 *    CSS `infinite` di tiap garis & bintang (±100 animasi jalan terus)
 *    masih makan ±10% main thread — tiap animasi yang jalan dicicil
 *    sedikit di main thread tiap frame, walaupun gambarnya di GPU.
 *    Sekarang tiap rasi punya fase (data-fase), diganti pakai timer:
 *
 *      gambar  garis & bintang muncul (animasi sekali jalan, ±3 detik)
 *      utuh    DIAM — nggak ada animasi sama sekali
 *      pudar   pembungkusnya pudar (satu animasi)
 *      (kosong) nggak kelihatan, nunggu giliran
 *
 *    Jadi yang beranimasi di satu waktu rata-rata cuma satu-dua rasi.
 *
 * 3. JANGAN pakai animation-delay buat urutan gores. Hasil ukur: durasi
 *    aktif sama, pakai delay ±5,8% main thread, tanpa delay ±2,6%.
 *    Animasi yang lagi "nunggu delay" dicek main thread tiap frame.
 *    Gantinya, jedanya ditanam DI DALAM keyframes: tiap garis/bintang
 *    punya @keyframes sendiri (dibikin di <style> di bawah) yang diam di
 *    awal, baru gerak pas gilirannya. Semua mulai barengan, delay 0.
 */

/** Jeda antar garis mulai digores (detik). */
const JEDA_GARIS = 0.32;
/** Lama menggores satu garis (detik) — samain sama .rasi-gores di globals.css. */
const LAMA_GORES = 0.9;
/** Fase gambar paling lama segini (detik); rasi yang rantainya panjang dipadetin. */
const BATAS_GAMBAR = 2.6;
/** Ruang di sekeliling rasi buat glow bintang (satuan piksel gambar). */
const PAD = 10;
/** Porsi siklus: mulai pudar, lalu hilang total. Sisanya nunggu giliran. */
const MULAI_PUDAR = 0.66;
const HABIS_PUDAR = 0.82;

type Tempat = {
  /** Nomor rasi di RASI (0-9). */
  n: number;
  /** Posisi pojok kiri-atas, persen lebar & tinggi layar. */
  x: number;
  y: number;
  /** Ukuran relatif. */
  skala: number;
  /** Cermin mendatar — biar rasi yang dipakai dua kali nggak kelihatan kembar. */
  balik?: boolean;
  /** Lama satu siklus (detik). */
  durasi: number;
  /** Pas halaman kebuka, siklusnya udah jalan segini (detik) — biar nggak serempak. */
  mulai: number;
  /** Di layar mana dia tampil. */
  layar: "lebar" | "hp";
};

/*
  Sebarannya disusun kayak langit beneran: nggak rata di grid, ada yang
  rapat ada yang renggang, dan sengaja nggak ada yang di pojok kiri-atas
  (kehalang logo navbar) atau pas di belakang judul "Stages".
*/
const TEMPAT: Tempat[] = [
  // --- layar lebar (lg+): 12 rasi, sepuluhnya beda + 2 dicerminin ---
  { n: 1, x: 6, y: 20, skala: 0.8, durasi: 17, mulai: 2, layar: "lebar" },
  { n: 3, x: 21, y: 13, skala: 0.7, durasi: 15, mulai: 9, layar: "lebar" },
  { n: 7, x: 72, y: 14, skala: 0.75, durasi: 16, mulai: 12, layar: "lebar" },
  { n: 6, x: 88, y: 24, skala: 0.7, durasi: 19, mulai: 5, layar: "lebar" },
  { n: 4, x: 13, y: 42, skala: 0.7, durasi: 18, mulai: 14, layar: "lebar" },
  { n: 8, x: 34, y: 36, skala: 0.65, durasi: 15.5, mulai: 3, layar: "lebar" },
  { n: 5, x: 60, y: 44, skala: 0.7, durasi: 17.5, mulai: 10, layar: "lebar" },
  { n: 9, x: 84, y: 49, skala: 0.8, durasi: 16.5, mulai: 0.5, layar: "lebar" },
  { n: 0, x: 4, y: 68, skala: 0.75, durasi: 19, mulai: 7, layar: "lebar" },
  { n: 2, x: 27, y: 74, skala: 0.65, durasi: 18.5, mulai: 11, layar: "lebar" },
  { n: 1, x: 52, y: 80, skala: 0.6, balik: true, durasi: 16, mulai: 15, layar: "lebar" },
  { n: 3, x: 76, y: 72, skala: 0.7, balik: true, durasi: 17, mulai: 4, layar: "lebar" },

  // --- HP & tablet: 7, lebih renggang ---
  { n: 3, x: 74, y: 13, skala: 0.85, durasi: 16, mulai: 3, layar: "hp" },
  { n: 6, x: 8, y: 27, skala: 0.8, durasi: 18, mulai: 11, layar: "hp" },
  { n: 9, x: 58, y: 38, skala: 0.85, durasi: 17, mulai: 6, layar: "hp" },
  { n: 0, x: 6, y: 55, skala: 0.8, durasi: 19, mulai: 14, layar: "hp" },
  { n: 5, x: 70, y: 64, skala: 0.8, durasi: 15.5, mulai: 1, layar: "hp" },
  { n: 7, x: 30, y: 78, skala: 0.75, durasi: 16.5, mulai: 8, layar: "hp" },
  { n: 1, x: 80, y: 86, skala: 0.7, balik: true, durasi: 18, mulai: 12, layar: "hp" },
];

/**
 * Jadwal satu rasi: kapan tiap garis mulai digores dan kapan tiap
 * bintang nyala, dalam detik sejak fase "gambar" mulai. Garis nggak
 * boleh mulai sebelum bintang pangkalnya nyala; bintang nyala pas garis
 * pertama yang menuju ke dia nyampe.
 */
function jadwal(n: number) {
  const r = RASI[n];
  const nyala = new Map<number, number>();
  if (r.garis.length) nyala.set(r.garis[0][0], 0);
  const garis = r.garis.map(([a, b], k) => {
    const mulai = Math.max(nyala.get(a) ?? 0, k * JEDA_GARIS);
    const sampai = mulai + LAMA_GORES * 0.85;
    if (!nyala.has(b) || nyala.get(b)! > sampai) nyala.set(b, sampai);
    return { a, b, mulai };
  });

  // Rasi yang rantainya panjang dipadetin biar fase gambarnya pendek.
  const terakhir = Math.max(0, ...garis.map((g) => g.mulai), ...nyala.values());
  if (terakhir > BATAS_GAMBAR) {
    const f = BATAS_GAMBAR / terakhir;
    garis.forEach((g) => (g.mulai *= f));
    nyala.forEach((v, k) => nyala.set(k, v * f));
  }
  return { garis, nyala };
}

/** Lama bintang "pop" (detik). */
const LAMA_POP = 0.6;
/**
 * Lama SEMUA animasi fase gambar (detik) — garis/bintang terakhir
 * mulai paling telat di BATAS_GAMBAR, jadi ini cukup buat semuanya
 * kelar. Samain sama --rasi-gambar di globals.css.
 */
const LAMA_GAMBAR = 3.6;

/** Persen dari LAMA_GAMBAR, 2 desimal. */
const persen = (detik: number) => +((Math.min(detik, LAMA_GAMBAR) / LAMA_GAMBAR) * 100).toFixed(2);
/** Nama keyframes per jeda (dibulatin ke 10 ms biar yang sama kepakai bareng). */
const namaGores = (jeda: number) => `rasi-gores-${Math.round(jeda * 100)}`;
const namaPop = (jeda: number) => `rasi-pop-${Math.round(jeda * 100)}`;

/** @keyframes garis digores mulai detik ke-`jeda`. */
function keyframesGores(jeda: number) {
  const a = persen(jeda);
  const b = persen(jeda + LAMA_GORES);
  return `@keyframes ${namaGores(jeda)}{0%,${a}%{transform:scaleX(0);animation-timing-function:cubic-bezier(0.45,0,0.25,1)}${b}%,100%{transform:scaleX(1)}}`;
}

/** @keyframes bintang pop mulai detik ke-`jeda`. */
function keyframesPop(jeda: number) {
  const a = persen(jeda);
  const b = persen(jeda + LAMA_POP * 0.45);
  const c = persen(jeda + LAMA_POP);
  return `@keyframes ${namaPop(jeda)}{0%,${a}%{opacity:0;transform:scale(0.2);animation-timing-function:ease-out}${b}%{opacity:1;transform:scale(1.6);animation-timing-function:ease-out}${c}%,100%{opacity:1;transform:scale(1)}}`;
}

/** Semua jadwal + keyframes-nya, dihitung sekali (datanya statis). */
const JADWAL = TEMPAT.map((t) => jadwal(t.n));
const KEYFRAMES = (() => {
  const set = new Map<string, string>();
  for (const { garis, nyala } of JADWAL) {
    for (const g of garis) set.set(namaGores(g.mulai), keyframesGores(Math.round(g.mulai * 100) / 100));
    for (const v of nyala.values()) set.set(namaPop(v), keyframesPop(Math.round(v * 100) / 100));
  }
  return [...set.values()].join("\n");
})();

/** Ukuran dalam satuan piksel gambar → CSS, dikali --u (skala rasinya). */
const u = (n: number) => `calc(${n} * var(--u))`;

/** Glow bintang: gradasi biasa, bukan filter — biar tetap murah. */
const HALO = "radial-gradient(circle, rgba(244,241,255,0.55) 0%, rgba(244,241,255,0) 70%)";

/** Kerlip empat sudut di kotak 12x12 (buat bintang paling nyala). */
const KERLIP = "M6 0Q6.9 5.1 12 6Q6.9 6.9 6 12Q5.1 6.9 0 6Q5.1 5.1 6 0Z";

type Fase = "gambar" | "utuh" | "pudar" | "";

export function RasiLangit() {
  const rasiRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const els = rasiRef.current;
    const set = (i: number, f: Fase) => {
      const el = els[i];
      if (el) el.dataset.fase = f;
    };

    // Yang minta animasi dikurangin: semua rasi langsung utuh, diam.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      TEMPAT.forEach((_, i) => set(i, "utuh"));
      return;
    }

    const timer: number[] = [];
    const nanti = (detik: number, fn: () => void) => timer.push(window.setTimeout(fn, detik * 1000));

    TEMPAT.forEach((t, i) => {
      const D = t.durasi;
      const siklus = () => {
        set(i, "gambar");
        nanti(MULAI_PUDAR * D, () => set(i, "pudar"));
        nanti(HABIS_PUDAR * D, () => set(i, ""));
        nanti(D, siklus);
      };

      // Pas halaman kebuka, rasi ini udah "jalan" t.mulai detik.
      const s = t.mulai % D;
      if (s < MULAI_PUDAR * D) {
        // Kalau fase gambarnya udah lewat, langsung tampil utuh (nggak
        // usah nggambar ulang dari nol pas halaman baru kebuka).
        set(i, s > BATAS_GAMBAR + LAMA_GORES ? "utuh" : "gambar");
        nanti(MULAI_PUDAR * D - s, () => set(i, "pudar"));
        nanti(HABIS_PUDAR * D - s, () => set(i, ""));
      } else {
        // lagi di fase pudar / nunggu giliran → mulai dari nggak kelihatan
        set(i, "");
      }
      nanti(D - s, siklus);
    });

    return () => timer.forEach((id) => window.clearTimeout(id));
  }, []);

  return (
    <div aria-hidden className="rasi-langit pointer-events-none latar-layar -z-10 overflow-hidden">
      <style>{KEYFRAMES}</style>

      {TEMPAT.map((t, i) => {
        const r = RASI[t.n];
        if (!r) return null;
        const { garis, nyala } = JADWAL[i];

        return (
          <div
            key={i}
            ref={(el) => {
              rasiRef.current[i] = el;
            }}
            className={clsx("rasi absolute", t.layar === "lebar" ? "hidden lg:block" : "lg:hidden")}
            style={
              {
                left: `${t.x}%`,
                top: `${t.y}%`,
                // 1 piksel gambar = 0,7-1px layar (dikali skala), ikut
                // lebar layar. Di /division rasinya ±1,3x — di sini
                // sengaja lebih kecil.
                "--u": `calc(${t.skala} * clamp(0.7px, 0.065vw, 1px))`,
                width: u(r.w + PAD * 2),
                height: u(r.h + PAD * 2),
                transform: t.balik ? "scaleX(-1)" : undefined,
              } as React.CSSProperties
            }
          >
            {garis.map(({ a, b, mulai }, k) => {
              const [x1, y1] = r.bintang[a];
              const [x2, y2] = r.bintang[b];
              const panjang = Math.hypot(x2 - x1, y2 - y1);
              const sudut = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
              return (
                // pembungkus: diam, cuma naruh & muter garisnya
                <span
                  key={k}
                  className="absolute block"
                  style={{
                    left: u(x1 + PAD),
                    top: u(y1 + PAD),
                    width: u(panjang),
                    transform: `rotate(${sudut}deg)`,
                    transformOrigin: "0 0",
                  }}
                >
                  {/* garisnya sendiri: digores pakai scaleX dari kiri.
                      Tebal 1,3 (min 1px) — rasinya udah dikecilin, garis
                      1 satuan bakal di bawah 1px dan nyaris hilang. */}
                  <span
                    className="rasi-gores block rounded-full"
                    style={
                      {
                        height: `max(1px, ${u(1.3)})`,
                        marginTop: `calc(max(1px, ${u(1.3)}) / -2)`,
                        background: WARNA_SIHIR,
                        opacity: 0.55,
                        // dipakai CSS cuma pas data-fase="gambar"
                        "--anim": namaGores(mulai),
                      } as React.CSSProperties
                    }
                  />
                </span>
              );
            })}

            {r.bintang.map(([x, y, jenis], k) => {
              if (jenis === 2) return null; // titik sambungan, bukan bintang
              const R = jenis === 1 ? 8 : 6;
              return (
                <span
                  key={k}
                  className="rasi-bintang absolute grid place-items-center rounded-full"
                  style={
                    {
                      left: u(x + PAD - R),
                      top: u(y + PAD - R),
                      width: u(R * 2),
                      height: u(R * 2),
                      background: HALO,
                      "--anim": namaPop(nyala.get(k) ?? 0),
                    } as React.CSSProperties
                  }
                >
                  {jenis === 1 ? (
                    // bintang paling nyala: kerlip empat sudut
                    <svg viewBox="0 0 12 12" style={{ width: u(12), height: u(12) }}>
                      <path d={KERLIP} fill={WARNA_SIHIR} />
                    </svg>
                  ) : (
                    <span
                      className="block rounded-full"
                      style={{ width: `max(2px, ${u(3.8)})`, height: `max(2px, ${u(3.8)})`, background: WARNA_SIHIR }}
                    />
                  )}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

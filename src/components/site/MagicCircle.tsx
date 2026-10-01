/**
 * Lingkaran sihir — versi LANGIT, bukan api.
 *
 * Dulu oranye bara dengan pita rune (coretan mirip aksara) yang muter.
 * Kesannya jadi kayak lingkaran pemanggil setan, bukan sihirnya dunia
 * Starlight. Sekarang dia dibikin kayak astrolabe — alat baca langit:
 * garis putih tipis, glow cahaya bulan, dan hiasannya bintang kerlip
 * empat sudut yang bentuknya sama persis kayak bintang di background.
 *
 * === Susunannya, dari luar ke dalam ===
 *
 *   r196  cincin tipis                       diam
 *   r188  butiran cahaya                     muter searah jarum jam
 *   r176  garis skala (kayak astrolabe)      muter berlawanan
 *   r158  pita bintang: 12 kerlip + titik    muter searah (paling pelan)
 *   r140  empat busur bercelah               muter berlawanan
 *   r150  SEGITIGA rasi — sudutnya persis di titik seal panggung
 *   r62   cincin titik-titik + bintang kompas di tengah   diam
 *
 * === Kenapa tiap cincin jadi lapisan <div> sendiri (PENTING) ===
 *
 * Versi lama satu <svg> dengan filter glow 3 lapis di <svg>-nya, dan
 * cincin-cincinnya muter DI DALAM svg itu. Akibatnya tiap frame browser
 * harus ngegambar ulang seluruh lingkaran + ngitung ulang 3 lapis blur
 * di area ±880px. Itu yang bikin halaman /stages patah-patah.
 *
 * Sekarang tiap cincin yang muter punya <div> + <svg>-nya sendiri, dan
 * glow-nya nempel di svg yang DIAM di dalam div itu. Browser ngegambar
 * cincin + glow-nya SEKALI, jadi satu lapisan, terus yang diputer
 * lapisannya utuh di GPU — nggak ada gambar ulang sama sekali.
 * (Animasi transform di elemen DALAM svg nggak bisa begitu; browser
 * selalu ngegambar ulang seluruh svg-nya.)
 *
 * Jadi: JANGAN pindahin animasi ke <g> di dalam svg, dan JANGAN pasang
 * filter di pembungkus yang isinya gerak.
 *
 * === `TITIK_SEAL` ===
 *
 * Sudut segitiga ada di jarak 150 dari pusat, di viewBox 400 (setengah
 * lebarnya 200). Jadi 150/200 = 0,75 dari jari-jari, alias 37,5% dari
 * LEBAR kotaknya. Angka itu diekspor supaya halaman /stages naruh logo
 * panggungnya persis di ujung segitiga. Ubah satu, ubah dua-duanya.
 */

import type { ReactNode } from "react";

/** Putih dengan sedikit lavender biar nyatu sama langit ungu. */
export const WARNA_SIHIR = "#f4f1ff";

/**
 * Glow cahaya bulan: inti putih tipis + pendaran lavender lembut.
 * Dua lapis, bukan tiga — yang ketiga dulu buat "panas" bara, di sini
 * cuma bikin garisnya buram. Diekspor karena jalur konstelasi versi HP
 * di /stages harus pakai glow yang sama.
 */
export const GLOW_SIHIR =
  "drop-shadow(0 0 2px rgba(255,255,255,0.85)) " +
  "drop-shadow(0 0 9px rgba(190,184,255,0.5))";

/** Jarak titik seal dari pusat, dalam persen LEBAR kotak. */
export const TITIK_SEAL = 37.5;

/** Sama, dalam satuan viewBox (400 → 1% = 4). Diturunkan, bukan ditulis ulang. */
const R_SEGITIGA = TITIK_SEAL * 4;

/** Sudut ketiga titik: atas, kanan-bawah, kiri-bawah. */
const SUDUT = [-90, 30, 150];

/** Posisi tiap titik seal dalam persen (buat dipakai halaman /stages). */
export const POSISI_SEAL = SUDUT.map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    left: 50 + TITIK_SEAL * Math.cos(rad),
    top: 50 + TITIK_SEAL * Math.sin(rad),
  };
});

/** Titik di lingkaran jari-jari r pada sudut deg. */
function titik(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return [200 + r * Math.cos(rad), 200 + r * Math.sin(rad)];
}

/**
 * Bintang kerlip empat sudut, pusatnya (0,0), jari-jari s. Sisi-sisinya
 * melengkung ke dalam — bentuk yang sama kayak kerlip di langit hero.
 */
function kerlip(s: number) {
  const k = s * 0.16;
  return `M0 ${-s} Q${k} ${-k} ${s} 0 Q${k} ${k} 0 ${s} Q${-k} ${k} ${-s} 0 Q${-k} ${-k} 0 ${-s}Z`;
}

/**
 * Satu lapisan cincin. `putar` = arah muter (atau diam kalau kosong),
 * `durasi` = detik per satu putaran.
 */
function Lapis({
  putar,
  durasi,
  children,
}: {
  putar?: "kanan" | "kiri";
  durasi?: number;
  children: ReactNode;
}) {
  return (
    <div
      className={
        putar === "kanan"
          ? "sihir-putar absolute inset-0"
          : putar === "kiri"
            ? "sihir-putar-balik absolute inset-0"
            : "absolute inset-0"
      }
      style={durasi ? { animationDuration: `${durasi}s` } : undefined}
    >
      <svg
        viewBox="0 0 400 400"
        fill="none"
        className="block h-full w-full overflow-visible"
        style={{ color: WARNA_SIHIR, filter: GLOW_SIHIR }}
      >
        {children}
      </svg>
    </div>
  );
}

export function MagicCircle({
  /** Gambar segitiga rasi penghubung tiga seal. Matiin buat lingkaran polos. */
  segitiga = false,
  className,
}: {
  segitiga?: boolean;
  className?: string;
}) {
  const sudutSegitiga = SUDUT.map((d) => titik(R_SEGITIGA, d));
  const tengahSisi = sudutSegitiga.map(([x, y], i) => {
    const [x2, y2] = sudutSegitiga[(i + 1) % 3];
    return [(x + x2) / 2, (y + y2) / 2];
  });

  return (
    <div aria-hidden className={className}>
      {/* Napas pelan: terang-redup halus, bukan kedip api. Opacity di
          pembungkus, jadi tetap dikerjain GPU. */}
      <div className="sihir-napas absolute inset-0">
        {/* --- yang diam: cincin luar, inti, bintang kompas, segitiga --- */}
        <Lapis>
          <circle cx="200" cy="200" r="196" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.7" />

          <circle cx="200" cy="200" r="62" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="0.1 6" strokeLinecap="round" />
          <circle cx="200" cy="200" r="46" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.7" />

          {/* Bintang kompas: empat ujung panjang + empat pendek. */}
          <g transform="translate(200 200)" stroke="currentColor" strokeLinejoin="round">
            <path d={kerlip(30)} strokeOpacity="0.55" strokeWidth="0.9" />
            <path d={kerlip(17)} transform="rotate(45)" strokeOpacity="0.35" strokeWidth="0.7" />
            <circle r="2" fill="currentColor" fillOpacity="0.8" stroke="none" />
          </g>

          {segitiga && (
            <g>
              <defs>
                {/* Pudar ke pinggir biar sudutnya larut ke dalam seal. */}
                <radialGradient id="mc-fade">
                  <stop offset="55%" stopColor="currentColor" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.12" />
                </radialGradient>
              </defs>
              <polygon
                points={sudutSegitiga.map(([x, y]) => `${x},${y}`).join(" ")}
                stroke="url(#mc-fade)"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              {/* Bintang kecil di tengah tiap sisi — biar kebacanya
                  rasi bintang yang nyambungin tiga panggung. */}
              {tengahSisi.map(([x, y], i) => (
                <path key={i} d={kerlip(5)} transform={`translate(${x} ${y})`} fill="currentColor" fillOpacity="0.9" />
              ))}
            </g>
          )}
        </Lapis>

        {/* --- r188 butiran cahaya --- */}
        <Lapis putar="kanan" durasi={110}>
          {Array.from({ length: 60 }).map((_, i) => {
            const [x, y] = titik(188, i * 6);
            return <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 1.6 : 0.9} fill="currentColor" fillOpacity={i % 5 === 0 ? 0.9 : 0.55} />;
          })}
        </Lapis>

        {/* --- r176 garis skala --- */}
        <Lapis putar="kiri" durasi={150}>
          {Array.from({ length: 72 }).map((_, i) => {
            const deg = i * 5;
            const panjang = i % 6 === 0 ? 10 : 4;
            const [x1, y1] = titik(176, deg);
            const [x2, y2] = titik(176 - panjang, deg);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={i % 6 === 0 ? 0.75 : 0.35} strokeWidth="0.8" />;
          })}
        </Lapis>

        {/* --- r158 pita bintang (ganti pita rune) --- */}
        <Lapis putar="kanan" durasi={200}>
          <circle cx="200" cy="200" r="150" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.6" />
          <circle cx="200" cy="200" r="166" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.6" />
          {Array.from({ length: 12 }).map((_, i) => {
            const deg = i * 30;
            const [x, y] = titik(158, deg);
            const [tx, ty] = titik(158, deg + 15);
            return (
              <g key={i}>
                <path d={kerlip(i % 3 === 0 ? 6 : 4.2)} transform={`translate(${x} ${y})`} fill="currentColor" fillOpacity="0.9" />
                <circle cx={tx} cy={ty} r="0.9" fill="currentColor" fillOpacity="0.6" />
              </g>
            );
          })}
        </Lapis>

        {/* --- r140 empat busur bercelah --- */}
        <Lapis putar="kiri" durasi={80}>
          {[0, 90, 180, 270].map((mulai) => {
            const [x1, y1] = titik(140, mulai + 8);
            const [x2, y2] = titik(140, mulai + 82);
            return (
              <path
                key={mulai}
                d={`M${x1} ${y1} A140 140 0 0 1 ${x2} ${y2}`}
                stroke="currentColor"
                strokeOpacity="0.6"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            );
          })}
        </Lapis>
      </div>
    </div>
  );
}

/**
 * Versi kecil buat ngelingkerin satu logo panggung. Cuma dua cincin —
 * kalau serame yang gede, logonya jadi nggak kebaca. Aturan lapisannya
 * sama kayak yang gede: tiap cincin yang muter punya div sendiri.
 */
export function SmallSeal({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <Lapis putar="kanan" durasi={70}>
        {Array.from({ length: 40 }).map((_, i) => {
          const [x, y] = titik(192, i * 9);
          return <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 2 : 1.2} fill="currentColor" fillOpacity={i % 5 === 0 ? 0.9 : 0.55} />;
        })}
      </Lapis>
      <Lapis putar="kiri" durasi={95}>
        <circle cx="200" cy="200" r="172" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.8" />
        {Array.from({ length: 8 }).map((_, i) => {
          const [x, y] = titik(172, i * 45);
          return <path key={i} d={kerlip(i % 2 === 0 ? 8 : 5.5)} transform={`translate(${x} ${y})`} fill="currentColor" fillOpacity="0.85" />;
        })}
      </Lapis>
    </div>
  );
}

/**
 * Lingkaran sihir — cincin-cincin sepusat yang muter pelan, ala portal
 * Doctor Strange: oranye bara, nyala, dan kedipnya nggak rata.
 *
 * === Kenapa SVG, bukan gambar ===
 *
 * Tajam di semua ukuran, filenya nol byte, dan warnanya bisa diganti
 * per panggung lewat prop `accent` tanpa bikin file baru.
 *
 * === Susunannya, dari luar ke dalam ===
 *
 *   r196  cincin tipis diam
 *   r188  cincin putus-putus, muter searah jarum jam
 *   r176  garis-garis takik, muter berlawanan
 *   r158  pita rune, muter searah (paling pelan)
 *   r140  empat busur bercelah, muter berlawanan
 *   r150  SEGITIGA — sudutnya persis di titik seal panggung (R_SEGITIGA)
 *   r62   cincin inti + bintang
 *
 * === `TITIK_SEAL` ===
 *
 * Sudut segitiga ada di jarak 150 dari pusat, di viewBox 400 (setengah
 * lebarnya 200). Jadi 150/200 = 0,75 dari jari-jari, alias 37,5% dari
 * LEBAR kotaknya.
 *
 * Angka itu diekspor supaya halaman /stages naruh logo panggungnya
 * di titik yang sama persis kayak ujung segitiga di gambar ini. Kalau
 * salah satunya diubah, ubah dua-duanya — kalau nggak, logonya bakal
 * meleset dari ujung garis.
 */

/**
 * Warna api — oranye bara, bukan biru es.
 *
 * Warna garisnya sendiri sengaja agak muda. Yang bikin kerasa "api"
 * itu bukan warnanya, tapi GLOW-nya: dua lapis drop-shadow oranye dan
 * merah yang nyebar di sekeliling garis, persis kayak bara yang
 * manasin udara di sekitarnya. Kalau warnanya langsung dibikin merah
 * pekat, garisnya malah kelihatan kotor dan rune-nya nggak kebaca.
 */
export const WARNA_API = "#ff9a4d";

/**
 * Glow bara di sekeliling garis. Diekspor karena jalur konstelasi di
 * /stages (versi HP) harus pakai bara yang sama persis kayak segitiga
 * di sini — kalau nggak, garis penghubungnya kelihatan dari dunia lain.
 */
export const GLOW_API =
  "drop-shadow(0 0 3px rgba(255,170,90,0.95)) " +
  "drop-shadow(0 0 10px rgba(255,110,30,0.7)) " +
  "drop-shadow(0 0 26px rgba(255,60,10,0.45))";

/** Jarak titik seal dari pusat, dalam persen LEBAR kotak. */
export const TITIK_SEAL = 37.5;

/**
 * Jarak yang sama, tapi dalam satuan viewBox. viewBox-nya 400, jadi
 * 1% lebar = 4 satuan. Diturunkan dari TITIK_SEAL, bukan ditulis
 * ulang — biar segitiga di gambar dan posisi logo di halaman nggak
 * bisa beda sendiri-sendiri kalau angkanya disetel.
 */
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

/* --------------------------------------------------------------------
   Bentuk-bentuk rune. Digambar di sekitar titik (0,0), ukuran ±4.
   Bukan aksara beneran — cuma coretan geometris biar kerasa mantra.
   -------------------------------------------------------------------- */
const RUNE = [
  "M-3-4H3M0-4V4M-3 4H3",
  "M-3-4 0 4 3-4",
  "M-3-4V4H3M-3 0H2",
  "M0-4V4M-3-1H3M-3 2H3",
  "M-3-4 3 4M3-4-3 4",
  "M-3 4 0-4 3 4M-2 1H2",
  "M-3-4H3L-3 4H3",
  "M0-4 3 0 0 4-3 0Z",
];

/** Titik di lingkaran jari-jari r pada sudut deg. */
function titik(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return [200 + r * Math.cos(rad), 200 + r * Math.sin(rad)];
}

export function MagicCircle({
  accent = WARNA_API,
  /** Gambar segitiga penghubung tiga seal. Matiin buat lingkaran polos. */
  segitiga = false,
  className,
}: {
  accent?: string;
  segitiga?: boolean;
  className?: string;
}) {
  const sudutSegitiga = SUDUT.map((d) => titik(R_SEGITIGA, d));

  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden
      className={className}
      style={{ color: accent, overflow: "visible", filter: GLOW_API }}
    >
      <defs>
        {/* Pudar ke pinggir biar cincinnya nggak kelihatan dipotong. */}
        <radialGradient id="mc-fade">
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
        </radialGradient>
      </defs>

      {/*
        Kedipan bara. Ditaruh di <g> DALAM svg, bukan di <svg>-nya,
        supaya kelas opacity dari luar (opacity-95 / opacity-60) tetap
        kepakai — animasi dan opacity statis di elemen yang sama bakal
        rebutan, yang animasi selalu menang.
      */}
      <g className="seal-ember">

      {/* --- r196 cincin luar, diam --- */}
      <circle
        cx="200"
        cy="200"
        r="196"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />

      {/* --- r188 putus-putus, searah jarum jam --- */}
      <g className="seal-spin" style={{ animationDuration: "90s" }}>
        <circle
          cx="200"
          cy="200"
          r="188"
          stroke="currentColor"
          strokeOpacity="0.8"
          strokeWidth="1.2"
          strokeDasharray="14 9"
        />
      </g>

      {/* --- r176 takik, berlawanan arah --- */}
      <g className="seal-spin-rev" style={{ animationDuration: "120s" }}>
        {Array.from({ length: 48 }).map((_, i) => {
          const deg = i * 7.5;
          const panjang = i % 4 === 0 ? 12 : 6;
          const [x1, y1] = titik(176, deg);
          const [x2, y2] = titik(176 - panjang, deg);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeOpacity={i % 4 === 0 ? 0.9 : 0.5}
              strokeWidth="1"
            />
          );
        })}
      </g>

      {/* --- r158 pita rune, paling pelan --- */}
      <g className="seal-spin" style={{ animationDuration: "160s" }}>
        <circle
          cx="200"
          cy="200"
          r="150"
          stroke="currentColor"
          strokeOpacity="0.29"
          strokeWidth="0.6"
        />
        <circle
          cx="200"
          cy="200"
          r="166"
          stroke="currentColor"
          strokeOpacity="0.29"
          strokeWidth="0.6"
        />
        {Array.from({ length: 24 }).map((_, i) => {
          const deg = i * 15;
          const [x, y] = titik(158, deg);
          return (
            <path
              key={i}
              d={RUNE[i % RUNE.length]}
              transform={`translate(${x} ${y}) rotate(${deg + 90})`}
              stroke="currentColor"
              strokeOpacity="0.88"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </g>

      {/* --- r140 empat busur bercelah, berlawanan --- */}
      <g className="seal-spin-rev" style={{ animationDuration: "70s" }}>
        {[0, 90, 180, 270].map((mulai) => {
          const [x1, y1] = titik(140, mulai + 8);
          const [x2, y2] = titik(140, mulai + 82);
          return (
            <path
              key={mulai}
              d={`M${x1} ${y1} A140 140 0 0 1 ${x2} ${y2}`}
              stroke="currentColor"
              strokeOpacity="0.72"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* --- segitiga: sudutnya = titik seal panggung --- */}
      {segitiga && (
        <g>
          <polygon
            points={sudutSegitiga.map(([x, y]) => `${x},${y}`).join(" ")}
            stroke="url(#mc-fade)"
            strokeOpacity="0.8"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Titik cahaya di tiap sudut, denyutnya gantian. */}
          {sudutSegitiga.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="currentColor"
              className="seal-pulse"
              style={{ animationDelay: `${i * 0.9}s` }}
            />
          ))}
        </g>
      )}

      {/* --- inti --- */}
      <g className="seal-spin" style={{ animationDuration: "50s" }}>
        <circle
          cx="200"
          cy="200"
          r="62"
          stroke="currentColor"
          strokeOpacity="0.48"
          strokeWidth="1"
          strokeDasharray="3 7"
        />
      </g>
      <circle
        cx="200"
        cy="200"
        r="46"
        stroke="currentColor"
        strokeOpacity="0.26"
        strokeWidth="0.8"
      />
      </g>
    </svg>
  );
}

/**
 * Versi kecil buat ngelingkerin satu logo panggung. Cuma dua cincin —
 * kalau serame yang gede, logonya jadi nggak kebaca.
 */
export function SmallSeal({
  accent = WARNA_API,
  className,
}: {
  accent?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden
      className={className}
      style={{ color: accent, overflow: "visible", filter: GLOW_API }}
    >
      <g className="seal-spin" style={{ animationDuration: "60s" }}>
        <circle
          cx="200"
          cy="200"
          r="192"
          stroke="currentColor"
          strokeOpacity="0.64"
          strokeWidth="1.2"
          strokeDasharray="10 8"
        />
      </g>
      <g className="seal-spin-rev" style={{ animationDuration: "85s" }}>
        <circle
          cx="200"
          cy="200"
          r="172"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="0.8"
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const deg = i * 30;
          const [x, y] = titik(172, deg);
          return (
            <path
              key={i}
              d={RUNE[i % RUNE.length]}
              transform={`translate(${x} ${y}) rotate(${deg + 90}) scale(0.9)`}
              stroke="currentColor"
              strokeOpacity="0.8"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </g>
    </svg>
  );
}

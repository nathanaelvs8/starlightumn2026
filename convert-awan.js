/**
 * Bikin awan-awan kecil buat dekor homepage, dipotong dari separator.
 *
 * Jalanin: node convert-awan.js
 *
 * Sumbernya public/images/shared/separator.webp — pita awan ungu yang
 * dipakai di antara band. Pita itu dipotong jadi beberapa gumpalan,
 * terus pinggir tiap potongan dipudarin supaya kebaca sebagai awan
 * yang lepas sendiri, bukan potongan pita.
 *
 * Pudarnya bukan elips mulus — itu bikin awannya kelihatan kayak pil.
 * Tepinya dikasih gelombang (gabungan beberapa sinus, fasenya beda
 * tiap potongan), dan bagian awan yang tebal bertahan lebih jauh
 * sebelum pudar. Hasilnya pinggirannya nggak rata, kayak awan beneran.
 *
 * Output: public/images/home/awan-1.webp … awan-6.webp
 *   awan-1 … awan-4  gumpalan lebar (±450-560px)
 *   awan-5, awan-6   gumpalan kecil (±270-300px)
 */

const fs = require("fs");
const sharp = require("sharp");

const SRC = "public/images/shared/separator.webp";
const OUT = "public/images/home/";

/** Potongan: x = mulai dari kiri pita, w = lebar. Diambil di lembah antar gumpalan. */
const POTONGAN = [
  { name: "awan-1", x: 40, w: 600, seed: 1 },
  { name: "awan-2", x: 560, w: 540, seed: 2 },
  { name: "awan-3", x: 1000, w: 520, seed: 3 },
  { name: "awan-4", x: 1440, w: 460, seed: 4 },
  { name: "awan-5", x: 650, w: 300, seed: 5 },
  { name: "awan-6", x: 1170, w: 280, seed: 6 },
];

/** Baris yang dipakai. Di bawah 168 cuma kabut tipis yang rata — kebaca kayak alas. */
const Y0 = 4;
const Y1 = 168;

const smooth = (a, b, t) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

(async () => {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;

  for (const p of POTONGAN) {
    const h = Y1 - Y0;
    const buf = Buffer.alloc(p.w * h * 4);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < p.w; x++) {
        const si = ((y + Y0) * W + (x + p.x)) * 4;
        const di = (y * p.w + x) * 4;

        const nx = (x - p.w / 2) / (p.w / 2);
        const ny = (y - h * 0.58) / (h / 2);
        const sudut = Math.atan2(ny, nx);
        const gelombang =
          0.09 * Math.sin(sudut * 3 + p.seed * 1.7) +
          0.06 * Math.sin(sudut * 5 + p.seed * 2.3) +
          0.04 * Math.sin(sudut * 9 + p.seed);
        const jarak = Math.sqrt(nx * nx + ny * ny * 0.55);
        const tebal = data[si + 3] / 255;
        // Pudar paksa di 4 sisi. Tanpa ini, kalau gelombangnya lagi
        // "keluar", area pudarnya lewat batas gambar — awannya belum
        // habis tapi gambarnya udah selesai, jadi ujungnya kepotong lurus
        // (kelihatan kotak). Ini ngejamin pinggir gambar selalu bening.
        const tepi =
          smooth(0, 0.14, x / p.w) * smooth(0, 0.14, 1 - x / p.w) *
          smooth(0, 0.12, y / h) * smooth(0, 0.12, 1 - y / h);
        const mask = tepi * (1 - smooth(0.38 + gelombang + 0.12 * tebal, 0.98 + gelombang, jarak));

        buf[di] = data[si];
        buf[di + 1] = data[si + 1];
        buf[di + 2] = data[si + 2];
        buf[di + 3] = Math.round(data[si + 3] * mask);
      }
    }

    const webp = await sharp(buf, { raw: { width: p.w, height: h, channels: 4 } })
      .trim({ threshold: 1 })
      .webp({ quality: 86, alphaQuality: 90 })
      .toBuffer();
    fs.writeFileSync(`${OUT}${p.name}.webp`, webp);

    const meta = await sharp(webp).metadata();
    console.log(`${p.name}  ${meta.width}x${meta.height}  ${Math.round(webp.length / 1024)}KB`);
  }
})();

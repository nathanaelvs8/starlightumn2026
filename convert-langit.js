/**
 * Bikin background langit homepage yang bisa diulang ke bawah TANPA
 * garis sambungan.
 *
 * Jalanin: node convert-langit.js
 *
 * Dulu tiap band pasang gambarnya sendiri, jadi di perbatasan dua band
 * ada garis lurus — potongan gambar yang beda ketemu di satu baris.
 * Separator cuma nutupin sebagian, ekor kabutnya transparan dan garisnya
 * tetap nongol di bawahnya.
 *
 * Sekarang satu gambar dipasang di pembungkus SELURUH homepage dan
 * diulang ke bawah. Supaya ulangannya nyambung, gambar hero ditumpuk
 * sama cerminan tegaknya sendiri:
 *
 *   ┌──────────────┐
 *   │  asli        │  baris terakhir = baris terakhir asli
 *   ├──────────────┤  ← nyambung: cermin mulai dari baris yang sama
 *   │  dicerminin  │  baris terakhir = baris PERTAMA asli
 *   └──────────────┘  ← nyambung ke ulangan berikutnya (mulai dari asli)
 *
 * Output: public/images/home/langit.webp (1920x2400)
 */

const sharp = require("sharp");

const SRC = "public/images/home/band-1-hero.webp";
const OUT = "public/images/home/langit.webp";

(async () => {
  const asli = sharp(SRC);
  const { width, height } = await asli.metadata();
  const atas = await asli.clone().toBuffer();
  const bawah = await asli.clone().flip().toBuffer(); // flip() = cermin tegak

  await sharp({
    create: { width, height: height * 2, channels: 3, background: "#0a1430" },
  })
    .composite([
      { input: atas, top: 0, left: 0 },
      { input: bawah, top: height, left: 0 },
    ])
    .webp({ quality: 80 })
    .toFile(OUT);

  const meta = await sharp(OUT).metadata();
  console.log(`${OUT}  ${meta.width}x${meta.height}`);
})();

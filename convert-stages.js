/**
 * Konversi aset halaman Stages: PNG dari tim visual → WebP di public/.
 *
 * Jalanin: node convert-stages.js
 *
 * Yang dikerjain:
 *   1. Logo stage (kebuka & kekunci) — dipotong area transparannya di
 *      pinggir, baru dikecilin. Dipotong DI SINI, bukan pas halaman
 *      kebuka, biar ukurannya ketebak dan filenya ringan.
 *   2. Gold frame — diputar 90° jadi mendatar, terus diregangin 8% ke
 *      bawah supaya lubang tengahnya pas 16:9 (aslinya 1.92:1).
 *   3. Background halaman stages — dikecilin dari 4961px.
 */

const sharp = require("sharp");
const path = require("path");

const SRC = "C:/Users/Clement/Downloads/";
const OUT = "public/images/stages/";

/** Batas alpha — di bawah ini dianggap kosong. Sama kayak <Asset>. */
const ALPHA = 10;

/** Cari kotak isi yang beneran (piksel yang nggak transparan). */
async function bbox(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] > ALPHA) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Potong pinggiran transparan → kecilin → simpan WebP. */
async function logo(from, to, maxWidth = 1400) {
  const src = SRC + from;
  const box = await bbox(src);
  await sharp(src)
    .extract(box)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(OUT + to);
  console.log(`${to.padEnd(24)} ${box.width}x${box.height} → lebar ${maxWidth}`);
}

/**
 * Gold frame: diputar mendatar, lubangnya dipaksa jadi 16:9.
 *
 * Aslinya lubangnya 897x467 (1.92:1) — kalau videonya 16:9 ditaruh
 * langsung bakal ada celah di atas-bawah. Jadi framenya yang diregangin
 * 8% ke bawah. Di ukiran seramai ini 8% nggak kelihatan.
 */
async function frame() {
  const rotated = await sharp(SRC + "gold frame.png").rotate(90).png().toBuffer();
  const { data, info } = await sharp(rotated)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const alphaAt = (x, y) => data[(y * W + x) * C + 3];

  // Ukur lubangnya: rambat dari titik tengah sampai ketemu ukiran.
  const cx = (W / 2) | 0;
  const cy = (H / 2) | 0;
  let l = cx; while (l > 0 && alphaAt(l, cy) < ALPHA) l--;
  let r = cx; while (r < W - 1 && alphaAt(r, cy) < ALPHA) r++;
  let t = cy; while (t > 0 && alphaAt(cx, t) < ALPHA) t--;
  let b = cy; while (b < H - 1 && alphaAt(cx, b) < ALPHA) b++;

  const scaleY = (r - l) / (16 / 9) / (b - t);
  const newH = Math.round(H * scaleY);

  await sharp(rotated)
    .resize(W, newH, { fit: "fill" })
    .webp({ quality: 90 })
    .toFile(OUT + "frame-video.webp");
  console.log(
    `frame-video.webp         ${W}x${newH} (lubang ${r - l}x${b - t} → 16:9, regang ${((scaleY - 1) * 100).toFixed(1)}%)`,
  );
}

async function main() {
  await require("fs/promises").mkdir(OUT, { recursive: true });

  // Kebuka (berwarna) — dipakai di halaman stage-nya.
  await logo("logostage-twizzlekebuka.png", "twizzle.webp");
  await logo("logostage-loniellekebuka.png", "lonielle.webp");
  await logo("logostage-enchantiakebuka.png", "enchantia.webp");

  // Kekunci (abu-abu + rantai + gembok) — dipakai di daftar /stages.
  await logo("logostage-twizzle.png", "twizzle-locked.webp");
  await logo("logostage-lonielle.png", "lonielle-locked.webp");
  await logo("logosatge-enchantia.png", "enchantia-locked.webp"); // typo di nama file asli

  await frame();

  await sharp(SRC + "bg-stage coba coba.png")
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(OUT + "bg.webp");
  console.log("bg.webp                  4961px → 2400px");
}

main().catch((e) => {
  console.error("GAGAL:", e.message);
  process.exit(1);
});

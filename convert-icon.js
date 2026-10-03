/**
 * Ikon situs (tab browser, hasil Google, layar utama HP) dari logo
 * Starlight.
 *
 *   node convert-icon.js
 *
 * Hasil:
 *   public/favicon.ico                16, 32, 48 px — tab browser & Google
 *   public/images/logo/icon.png       512 px — Android, Google, preview link
 *   public/images/logo/apple-icon.png 180 px — iPhone "Add to Home Screen"
 *
 * Logonya dipotong pas di bintangnya (cahaya hijau di sekelilingnya
 * dibuang), soalnya di ukuran 16px tiap piksel berharga — kalau ikut,
 * bintangnya jadi titik kecil di tengah kotak.
 * Ikon iPhone dikasih latar biru malam: iOS ngisi bagian transparan
 * pakai hitam.
 *
 * Semua file ditaruh di luar jangkauan middleware (favicon.ico &
 * /images dikecualikan di src/middleware.ts), jadi tetap kebuka
 * walaupun situs lagi mode "Segera Hadir".
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SUMBER = path.join(__dirname, "public/images/logo/starlight-main.webp");
const LOGO = path.join(__dirname, "public/images/logo");

/** Potong ke bintangnya (piksel yang cukup pekat), jadiin persegi. */
async function bintang() {
  const { data, info } = await sharp(SUMBER).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 200) {
        x0 = Math.min(x0, x), x1 = Math.max(x1, x);
        y0 = Math.min(y0, y), y1 = Math.max(y1, y);
      }
  const sisi = Math.max(x1 - x0, y1 - y0) + 1;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const left = Math.round(cx - sisi / 2), top = Math.round(cy - sisi / 2);
  // Kotaknya bisa keluar gambar kalau bintangnya mepet tepi — ditambal
  // transparan dulu biar extract nggak gagal. Dua langkah terpisah:
  // dalam satu rantai sharp, extract selalu jalan SEBELUM extend.
  const tambal = sisi;
  const lebar = await sharp(SUMBER)
    .extend({ top: tambal, bottom: tambal, left: tambal, right: tambal, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp(lebar)
    .extract({ left: left + tambal, top: top + tambal, width: sisi, height: sisi })
    .png()
    .toBuffer();
}

const ukuran = (buf, s) => sharp(buf).resize(s, s, { kernel: "lanczos3" }).png().toBuffer();

/** ICO = header + daftar isi + PNG-PNG-nya ditempel berurutan. */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const isi = pngs.map(({ s, buf }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(s >= 256 ? 0 : s, 0);
    e.writeUInt8(s >= 256 ? 0 : s, 1);
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bit per piksel
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    return e;
  });
  return Buffer.concat([header, ...isi, ...pngs.map((p) => p.buf)]);
}

(async () => {
  const b = await bintang();

  const kecil = await Promise.all([16, 32, 48].map(async (s) => ({ s, buf: await ukuran(b, s) })));
  fs.writeFileSync(path.join(__dirname, "public/favicon.ico"), ico(kecil));

  await sharp(b).resize(512, 512).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(path.join(LOGO, "icon.png"));

  // iPhone: bintang 80% di tengah, latar biru malam (--c-night).
  const isi = await ukuran(b, 144);
  await sharp({ create: { width: 180, height: 180, channels: 4, background: "#0a1430" } })
    .composite([{ input: isi, left: 18, top: 18 }])
    .png()
    .toFile(path.join(LOGO, "apple-icon.png"));

  for (const f of ["public/favicon.ico", "public/images/logo/icon.png", "public/images/logo/apple-icon.png"])
    console.log(f.padEnd(36), `${(fs.statSync(path.join(__dirname, f)).size / 1024).toFixed(1)}KB`);
})();

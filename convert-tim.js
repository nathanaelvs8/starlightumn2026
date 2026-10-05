/**
 * Foto tim divisi → public/images/division/tim-<divisi>.webp
 *
 *   node convert-tim.js "<folder foto>"
 *
 * Fotonya PNG transparan (latarnya udah dihapus) ukuran 1920×1080 dengan
 * banyak ruang kosong di atas. Di sini:
 *   1. ruang kosongnya dipotong (biar orangnya yang ngisi bingkai);
 *   2. pinggiran putih sisa penghapusan latar dibersihin — piksel tepi
 *      yang setengah tembus itu campuran warna asli + putih latar lama;
 *      di website yang gelap jadi garis putih tipis di sekeliling orang.
 *      Warnanya "dikembaliin" dengan ngurangin porsi putihnya;
 *   3. dikecilin & dijadiin WebP (aslinya 1,1–2,8MB per foto).
 *
 * Nama file asli → divisi (nama file dari panitia pakai nama tugasnya).
 * Foto baru: tambahin di DAFTAR, jalanin ulang skripnya, lalu isi `tim`
 * di src/lib/divisions.ts.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SUMBER = process.argv[2];
const KELUAR = path.join(__dirname, "public/images/division");

const DAFTAR = {
  "3 (1).png": "raven", // Media Sosial
  "Acara.png": "wicked",
  "Dokum.png": "mirror",
  "Fresh Moeney.png": "treasury",
  "Keamanan.png": "knights",
  "LO.png": "fairies",
  "Perlengkapan.png": "relic",
  "Visual.png": "dizzy",
  "website.png": "enchanted",
};

/** Buang campuran putih dari piksel tepi yang setengah tembus. */
function bersihkanTepiPutih(data) {
  for (let p = 0; p < data.length; p += 4) {
    const a = data[p + 3] / 255;
    if (a <= 0.02 || a >= 0.98) continue;
    for (let c = 0; c < 3; c++) {
      // warna terlihat = asli·a + putih·(1−a)  →  asli = (terlihat − (1−a)·255) / a
      const asli = (data[p + c] - (1 - a) * 255) / a;
      data[p + c] = Math.max(0, Math.min(255, Math.round(asli)));
    }
  }
}

(async () => {
  for (const [file, divisi] of Object.entries(DAFTAR)) {
    const potong = await sharp(fs.readFileSync(path.join(SUMBER, file)))
      .trim({ threshold: 1 })
      .resize({ width: 1400, height: 900, fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    bersihkanTepiPutih(potong.data);
    const hasil = await sharp(potong.data, { raw: potong.info })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(path.join(KELUAR, `tim-${divisi}.webp`));
    console.log(divisi.padEnd(10), `${hasil.width}x${hasil.height}`, `${(hasil.size / 1024).toFixed(0)}KB`);
  }
})();

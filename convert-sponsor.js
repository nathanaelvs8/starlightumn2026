/**
 * Logo sponsor → public/images/sponsor/*.webp, versi buat LATAR GELAP.
 *
 *   node convert-sponsor.js "<folder logo>" "<folder render PDF>"
 *
 * Logonya tampil langsung di atas website yang gelap (tanpa kotak),
 * jadi tiap logo disiapin sesuai bentuk file aslinya:
 *   - latar putih / hitam polos dibuang (diisi dari pinggir, jadi warna
 *     putih/hitam DI DALAM logo nggak ikut kehapus), tepinya dihalusin
 *     biar nggak ada lingkaran putih/hitam tipis di sekeliling logo;
 *   - tulisan hitam diubah jadi putih (kalau dibiarin hitam, hilang);
 *   - logo yang dari sananya putih dibiarin putih.
 * Matcha Pop: dua file (tulisan + maskot) digabung, tulisan di atas.
 * PDF dirender dulu pakai Chrome (pdf-ke-png.mjs, di luar repo).
 *
 * Buffer dulu (fs.readFileSync), bukan path — sharp gagal baca path
 * Windows yang panjang / ada koma.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const [SUMBER, PDF] = process.argv.slice(2);
const KELUAR = path.join(__dirname, "public/images/sponsor");

const baca = (f) => fs.readFileSync(path.join(SUMBER, f));

/** Gambar → piksel RGBA mentah, dikecilin dulu biar cepat diolah. */
async function mentah(buf, maks = 1100) {
  const { data, info } = await sharp(buf)
    .resize(maks, maks, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
const keSharp = ({ data, w, h }) => sharp(data, { raw: { width: w, height: h, channels: 4 } });

/**
 * Buang latar polos yang nyambung ke pinggir gambar (flood fill), lalu
 * haluskan tepinya: piksel sisa yang warnanya masih mirip latar dibikin
 * tembus sebagian, biar nggak ada "halo".
 *   mirip(r,g,b) → 0..1, seberapa mirip warna latar.
 */
function buangLatar(img, mirip, ambang = 0.9) {
  const { data, w, h } = img;
  const seen = new Uint8Array(w * h);
  const antre = [];
  const coba = (x, y) => {
    const i = y * w + x;
    if (seen[i]) return;
    const p = i * 4;
    if (data[p + 3] === 0 || mirip(data[p], data[p + 1], data[p + 2]) >= ambang) {
      seen[i] = 1;
      antre.push(i);
    }
  };
  for (let x = 0; x < w; x++) (coba(x, 0), coba(x, h - 1));
  for (let y = 0; y < h; y++) (coba(0, y), coba(w - 1, y));
  while (antre.length) {
    const i = antre.pop();
    data[i * 4 + 3] = 0;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) coba(x - 1, y);
    if (x < w - 1) coba(x + 1, y);
    if (y > 0) coba(x, y - 1);
    if (y < h - 1) coba(x, y + 1);
  }
  // haluskan tepi: 2 piksel dari daerah yang kehapus
  for (let pass = 0; pass < 2; pass++) {
    const dekat = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (data[i * 4 + 3] === 0) continue;
        if (
          (x > 0 && data[(i - 1) * 4 + 3] === 0) ||
          (x < w - 1 && data[(i + 1) * 4 + 3] === 0) ||
          (y > 0 && data[(i - w) * 4 + 3] === 0) ||
          (y < h - 1 && data[(i + w) * 4 + 3] === 0)
        )
          dekat[i] = 1;
      }
    for (let i = 0; i < w * h; i++) {
      if (!dekat[i]) continue;
      const p = i * 4;
      const m = mirip(data[p], data[p + 1], data[p + 2]);
      data[p + 3] = Math.round(data[p + 3] * Math.min(1, Math.max(0, (1 - m) * 2.2)));
    }
  }
  return img;
}
const miripPutih = (r, g, b) => Math.min(r, g, b) / 255;
const miripHitam = (r, g, b) => 1 - Math.max(r, g, b) / 255;

/** Piksel gelap & nggak berwarna (tulisan hitam) → putih. */
function hitamJadiPutih(img) {
  const { data } = img;
  for (let p = 0; p < data.length; p += 4) {
    const [r, g, b] = [data[p], data[p + 1], data[p + 2]];
    const maks = Math.max(r, g, b), min = Math.min(r, g, b);
    if (maks - min < 40 && maks < 140) data[p] = data[p + 1] = data[p + 2] = 255;
  }
  return img;
}

/** Semua piksel jadi putih, transparansi tetap (logo satu warna). */
function jadiPutih(img) {
  for (let p = 0; p < img.data.length; p += 4) img.data[p] = img.data[p + 1] = img.data[p + 2] = 255;
  return img;
}

/** Tulisan hitam di latar putih (JPEG): gelapnya jadi transparansi, warnanya putih. */
function tintaJadiPutih(img) {
  const { data } = img;
  for (let p = 0; p < data.length; p += 4) {
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    data[p] = data[p + 1] = data[p + 2] = 255;
    data[p + 3] = Math.round(255 - lum);
  }
  return img;
}

/** Simpan: potong tepi transparan, maks 640×280 (default), WebP. */
async function simpan(nama, img, keluar = KELUAR, [lebar, tinggi] = [640, 280]) {
  fs.mkdirSync(keluar, { recursive: true });
  const png = await img.png().toBuffer();
  const rapi = await sharp(png).trim({ threshold: 1 }).toBuffer();
  const hasil = await sharp(rapi)
    .resize(lebar, tinggi, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(keluar, `${nama}.webp`));
  console.log(nama.padEnd(20), `${hasil.width}x${hasil.height}`, `${(hasil.size / 1024).toFixed(0)}KB`);
}

/** Render PDF: buang bingkai viewer Chrome (abu gelap) + garis tepi halaman. */
async function dariPdf(file) {
  const buf = await sharp(fs.readFileSync(path.join(PDF, file))).trim({ threshold: 30 }).toBuffer();
  const m = await sharp(buf).metadata();
  return sharp(buf).extract({ left: 4, top: 4, width: m.width - 8, height: m.height - 8 }).toBuffer();
}

// Alat-alat di atas dipakai juga sama convert-media-partner.js.
module.exports = { mentah, keSharp, buangLatar, miripPutih, miripHitam, hitamJadiPutih, jadiPutih, tintaJadiPutih, simpan };

// Bagian sponsor cuma jalan kalau file ini dijalanin langsung (bukan di-require).
if (require.main === module) (async () => {
  // Putih dari sananya — dibiarin putih.
  await simpan("bsm-rental", keSharp(await mentah(baca("BSM Rental Hi-Ress (White).png"))));
  await simpan("msp", keSharp(await mentah(baca("MSP white (2,161 x 2,161).png"))));
  await simpan("fnv-rent", keSharp(await mentah(baca("fnv rent.png"))));

  // Transparan, tulisan hitam → putih (daun ITO EN tetap hijau).
  await simpan("ito-en", keSharp(hitamJadiPutih(await mentah(baca("Main Logo Vertical (Black Type).png")))));
  // Hijau tua satu warna — di latar biru malam nyaris hilang, jadi putih.
  await simpan("satu-dental", keSharp(jadiPutih(await mentah(baca("Logo SATU Dental Hijau Hirizontal@4x.png")))));
  // Udah punya bentuk & latarnya sendiri.
  await simpan("sari-roti", keSharp(await mentah(baca("LOGO-SARI-ROTI-HIRES.png"))));

  // JPEG tulisan hitam di latar putih → tulisan putih.
  await simpan("eventory", keSharp(tintaJadiPutih(await mentah(baca("eventory ai.jpg")))));

  // Latar putih dibuang.
  await simpan("mandiri-genset", keSharp(buangLatar(await mentah(baca("Logo Mandiri Genset 1,254 x 1,254.PNG")), miripPutih)));
  await simpan("fithub", keSharp(buangLatar(await mentah(baca("Logo FitHub.jpeg")), miripPutih)));
  await simpan("alesha", keSharp(buangLatar(await mentah(await dariPdf("pdf-alesha.png")), miripPutih)));
  await simpan("snapose", keSharp(buangLatar(await mentah(await dariPdf("pdf-snapose.png")), miripPutih, 0.94)));

  // Latar hitam dibuang (Sparta) — tinggal logo emasnya.
  await simpan("sparta", keSharp(buangLatar(await mentah(baca("Logo Sparta Barbershop 640 x 640.jpeg")), miripHitam, 0.86)));

  // Kotak merah itu bagian dari logonya — dibiarin.
  await simpan("kripik-bujangan", sharp(await dariPdf("pdf-kripik.png")));

  // Matcha Pop: tulisan di atas, maskot di bawah. Maskotnya sengaja
  // nggak terlalu tinggi biar tulisannya tetap kebaca di ukuran kecil.
  // Hijau matcha-nya diterangin (dicampur 45% putih, warnanya tetap sama):
  // hijau tua aslinya tenggelam di latar biru malam.
  const t = await mentah(await sharp(baca("logo2.png")).trim({ threshold: 1 }).resize({ width: 640 }).png().toBuffer());
  for (let p = 0; p < t.data.length; p += 4)
    for (let c = 0; c < 3; c++) t.data[p + c] = Math.round(t.data[p + c] + (255 - t.data[p + c]) * 0.45);
  const tulisan = await keSharp(t).png().toBuffer();
  const maskot = await sharp(baca("Logo.png")).trim({ threshold: 1 }).resize({ height: 230 }).png().toBuffer();
  const [mt, mm] = [await sharp(tulisan).metadata(), await sharp(maskot).metadata()];
  const JARAK = 20;
  const gabung = sharp({
    create: { width: 640, height: mt.height + JARAK + mm.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([
    { input: tulisan, left: 0, top: 0 },
    { input: maskot, left: Math.round((640 - mm.width) / 2), top: mt.height + JARAK },
  ]);
  await simpan("matcha-pop", sharp(await gabung.png().toBuffer()));
})();

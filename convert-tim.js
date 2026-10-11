/**
 * Foto tim divisi → public/images/division/tim-<divisi>.webp
 *
 *   node convert-tim.js "<folder foto>"
 *
 * Fotonya PNG transparan (latarnya udah dihapus) ukuran 1920×1080 dengan
 * banyak ruang kosong di atas. Kalau dikirim berlatar putih polos (tanpa
 * transparansi), latarnya dibuang dulu (buangLatarPutih). Di sini:
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
  "bph.png": "auradon",
  "sponsor.png": "wonderland", // Sponsorship
  "dekor.png": "lumiere", // Dekorasi
};

/**
 * Foto yang dikirim TANPA transparansi (bph, sponsor, dekor: hasil
 * hapus latar yang ditempel di atas putih polos). Latar putihnya dibuang
 * dengan "ember cat" dari pinggir gambar: cuma putih murni yang nyambung
 * ke pinggir yang kehapus, jadi baju/sepatu putih di badan orangnya
 * aman. Piksel tepi orangnya (campuran warna asli + putih) dikasih
 * tembus pandang sesuai seberapa putihnya; warnanya dibalikin sama
 * bersihkanTepiPutih di bawah.
 */
function buangLatarPutih(data, w, h) {
  const putihMurni = (p) => data[p] >= 254 && data[p + 1] >= 254 && data[p + 2] >= 254;
  const kosong = new Uint8Array(w * h);
  const antre = [];
  const coba = (i) => {
    if (kosong[i] || !putihMurni(i * 4)) return;
    kosong[i] = 1;
    antre.push(i);
  };
  for (let x = 0; x < w; x++) (coba(x), coba((h - 1) * w + x));
  for (let y = 0; y < h; y++) (coba(y * w), coba(y * w + w - 1));
  while (antre.length) {
    const i = antre.pop();
    data[i * 4 + 3] = 0;
    const x = i % w;
    if (x > 0) coba(i - 1);
    if (x < w - 1) coba(i + 1);
    if (i >= w) coba(i - w);
    if (i < w * (h - 1)) coba(i + w);
  }
  // Celah yang ketutup (sela kaki, sela lengan) nggak nyambung ke
  // pinggir, jadi nggak kena ember cat di atas. Putih murni yang luas
  // pasti latar — baju putih nggak pernah putih murni seluas itu
  // (selalu ada bayangan lipatan).
  const LUAS_MIN = 120;
  const cek = new Uint8Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (cek[s] || kosong[s] || !putihMurni(s * 4)) continue;
    const kumpulan = [s];
    cek[s] = 1;
    for (let k = 0; k < kumpulan.length; k++) {
      const i = kumpulan[k];
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= w * h || cek[j] || kosong[j] || !putihMurni(j * 4)) continue;
        cek[j] = 1;
        kumpulan.push(j);
      }
    }
    if (kumpulan.length >= LUAS_MIN) for (const i of kumpulan) data[i * 4 + 3] = 0;
  }

  // Pita tepi orangnya. Fotonya dulu udah dihapus latarnya terus
  // ditempel di putih, jadi pinggiran orangnya (helai rambut, tepi baju)
  // itu campuran warna asli + putih — di website gelap jadi garis terang
  // di sekeliling orangnya. Pinggirannya dikikis tipis (2 piksel paling
  // luar dibikin tembus bertahap) dan piksel terang di pita itu ikut
  // ditipisin.
  const n = w * h;
  const JARAK = 5;
  const jarak = new Uint8Array(n).fill(255);
  let depan = [];
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] === 0) (jarak[i] = 0, depan.push(i));
  for (let d = 1; d <= JARAK; d++) {
    const berikut = [];
    for (const i of depan) {
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= n || jarak[j] !== 255) continue;
        jarak[j] = d;
        berikut.push(j);
      }
    }
    depan = berikut;
  }
  const KIKIS = [0, 0.35, 0.8];
  for (let i = 0; i < n; i++) {
    const d = jarak[i];
    if (d === 0 || d > JARAK) continue;
    const p = i * 4;
    const terang = Math.min(data[p], data[p + 1], data[p + 2]);
    // Jangan diperlebar lagi buat helai rambut abu-abu: warnanya sama
    // persis kayak baju abu-abu, jadi bahu baju ikut bolong-bolong.
    const pudar = Math.min(1, Math.max(0, (238 - terang) / 40));
    data[p + 3] = Math.round(data[p + 3] * (KIKIS[d] ?? 1) * pudar);
  }
  // Warna piksel pinggiran diganti warna bagian dalam terdekat (rambut →
  // hitam rambutnya, baju → warna bajunya). Tembusnya tetap, tapi sisa
  // putih bekas latarnya hilang — tanpa ini pinggiran setengah tembus
  // masih keliatan kayak garis terang di latar gelap.
  depan = [];
  for (let i = 0; i < n; i++) if (jarak[i] === 255) depan.push(i);
  const terisi = new Uint8Array(n);
  const sumber = new Int32Array(n);
  for (const i of depan) (terisi[i] = 1, sumber[i] = i);
  while (depan.length) {
    const berikut = [];
    for (const i of depan) {
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= n || terisi[j] || jarak[j] === 0) continue;
        terisi[j] = 1;
        sumber[j] = sumber[i];
        if (data[j * 4 + 3] < 250) {
          const q = sumber[j] * 4;
          data[j * 4] = data[q];
          data[j * 4 + 1] = data[q + 1];
          data[j * 4 + 2] = data[q + 2];
        }
        berikut.push(j);
      }
    }
    depan = berikut;
  }

  // Piksel yang udah tembus total warnanya dijadiin hitam, sama kayak foto
  // transparan lain. Kalau dibiarin putih, putihnya ngerembes balik ke
  // pinggiran orangnya pas fotonya dikecilin & dikompres jadi WebP — itu
  // sumber garis putih di sekeliling orangnya.
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] === 0) data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0;
}

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
    // Foto yang nggak ada di folder itu dilewatin — jadi bisa dijalanin
    // cuma buat foto yang baru dikirim.
    if (!fs.existsSync(path.join(SUMBER, file))) continue;
    let masukan = fs.readFileSync(path.join(SUMBER, file));
    const latarPutih = !(await sharp(masukan).metadata()).hasAlpha;
    if (latarPutih) {
      // Fotonya gede (6000px) — kecilin dulu biar ember catnya cepat.
      const { data, info } = await sharp(masukan)
        .resize({ width: 2400, withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      buangLatarPutih(data, info.width, info.height);
      masukan = await sharp(data, { raw: info }).png().toBuffer();
    }
    const potong = await sharp(masukan)
      .trim({ threshold: 1 })
      .resize({ width: 1400, height: 900, fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // Foto berlatar putih warna pinggirannya udah dibenerin di
    // buangLatarPutih — kalau dibersihin lagi malah jadi kegelapan.
    if (!latarPutih) bersihkanTepiPutih(potong.data);
    const hasil = await sharp(potong.data, { raw: potong.info })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(path.join(KELUAR, `tim-${divisi}.webp`));
    console.log(divisi.padEnd(10), `${hasil.width}x${hasil.height}`, `${(hasil.size / 1024).toFixed(0)}KB`);
  }
})();

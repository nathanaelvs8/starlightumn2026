/**
 * Logo media partner → public/images/media-partner/*.webp, versi buat
 * LATAR GELAP — sama kayak sponsor (alat-alatnya dipinjam dari
 * convert-sponsor.js, baca penjelasannya di sana).
 *
 *   node convert-media-partner.js "<folder logo>"
 *
 * Logo yang ada dua versi warna (BIEMS, YOT): yang dipakai versi PUTIH.
 * Tampilnya lebih kecil dari sponsor, jadi disimpan maks 448×196
 * (3,5× kotaknya di desktop) biar filenya nggak berat.
 *
 * Kalau nambah logo: tambahin di sini, lalu di MEDIA_PARTNER
 * (src/lib/sponsor.ts).
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const {
  mentah, keSharp, buangLatar, miripPutih, miripHitam, tintaJadiPutih, simpan: simpanSponsor,
} = require("./convert-sponsor");

const [SUMBER] = process.argv.slice(2);
const KELUAR = path.join(__dirname, "public/images/media-partner");

const baca = (f) => fs.readFileSync(path.join(SUMBER, f));
const simpan = (nama, img) => simpanSponsor(nama, img, KELUAR, [448, 196]);

/**
 * Tulisan putih di latar hitam (JPEG): terangnya jadi transparansi,
 * warnanya putih. Hitam JPEG nggak pernah 0 persis, jadi yang di bawah
 * 20 dianggap kosong — kalau nggak, latarnya tetap kotak samar & nggak
 * kepotong.
 */
function cahayaJadiPutih(img) {
  const { data } = img;
  for (let p = 0; p < data.length; p += 4) {
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    data[p] = data[p + 1] = data[p + 2] = 255;
    data[p + 3] = Math.round(Math.max(0, lum - 20) * (255 / 235));
  }
  return img;
}

/**
 * Hitam ↔ putih ditukar, warna lain dibiarin (versi "mode gelap" logo
 * hitam-putih yang ada warnanya). Latar putih jadi hitam → tinggal dibuang.
 */
function balikNetral(img) {
  const { data } = img;
  for (let p = 0; p < data.length; p += 4) {
    const [r, g, b] = [data[p], data[p + 1], data[p + 2]];
    if (Math.max(r, g, b) - Math.min(r, g, b) < 40)
      data[p] = 255 - r, data[p + 1] = 255 - g, data[p + 2] = 255 - b;
  }
  return img;
}

/**
 * Warna gelap (biru dongker dll.) diterangin, makin gelap makin kuat;
 * warna yang udah terang nggak berubah. Biar tulisan gelap nggak
 * tenggelam di latar biru malam, tapi warnanya masih kebaca sama.
 */
function terangkanGelap(img, batas = 110) {
  const { data } = img;
  for (let p = 0; p < data.length; p += 4) {
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    if (lum >= batas) continue;
    const t = (batas - lum) / batas;
    for (let c = 0; c < 3; c++) data[p + c] = Math.round(data[p + c] + (255 - data[p + c]) * t);
  }
  return img;
}

(async () => {
  // Udah transparan & kebaca di latar gelap — dibiarin.
  await simpan("aiesec-binus", keSharp(await mentah(baca("AIESEC In Binus .png"))));
  await simpan("arsawati", keSharp(await mentah(baca("Logo Arsawati.png"))));
  await simpan("biems", keSharp(await mentah(baca("White Logo Biems.png"))));
  await simpan("era-fm", keSharp(await mentah(baca("logo-erafm (2).png"))));
  await simpan("konsernews", keSharp(await mentah(baca("LOGO KONSERNEWS ORANGE.png"))));
  await simpan("mentoring", keSharp(await mentah(baca("Logo Mentoring 2026.png"))));
  await simpan("rumor", keSharp(await mentah(baca("Logo Rumor Media.png"))));
  await simpan("umn-medical-center", keSharp(await mentah(baca("LOGO UMN MEDICAL CENTER.png"))));
  await simpan("umn-radio", keSharp(await mentah(baca("UMN RADIO.png"))));
  await simpan("yot", keSharp(await mentah(baca("Logo YOT Putih.png"))));
  // Lingkaran hitam & kotak oranye itu bagian dari logonya — dibiarin.
  await simpan("mister-miss-umn", keSharp(await mentah(baca("LOGO MISTER MISS TRANSPARENT (2) (1).png"))));
  await simpan("unpar-radio", keSharp(await mentah(baca("Unpar radio.jpeg"))));

  // Transparan, tapi "UPH"-nya biru dongker — tenggelam kalau nggak diterangin.
  await simpan("uph-choir", keSharp(terangkanGelap(await mentah(baca("Logo UPH Choir.png")))));

  // Latar hitam dibuang.
  for (const [nama, file] of [
    ["polimedia", "Broadcast Polimedia.jpg"],
    ["concert-event", "LOGO CONCERT EVENT INDONESIA.jpg"],
    ["esportsnesia", "Logo Esportnesia.jpg"],
    ["isfest", "LOGO ISFEST .JPEG"],
    ["respira", "Logo RESPIRA_.jpg"],
    ["unas-radio", "Logo UNAS RADIO.jpg"],
  ])
    await simpan(nama, keSharp(buangLatar(await mentah(baca(file)), miripHitam, 0.86)));
  // UMN TV: latar hitam dibuang, birunya diterangin.
  await simpan("umn-tv", keSharp(terangkanGelap(buangLatar(await mentah(baca("Logo UMN TV.jpg")), miripHitam, 0.86))));

  // Tulisan putih di latar hitam. File aslinya ada garis putih 1px di
  // tepi atas & kiri — dipotong dulu, kalau nggak ikut jadi bingkai.
  const fyp = await sharp(baca("Logo FYP Media.jpg")).extract({ left: 2, top: 2, width: 1276, height: 1276 }).toBuffer();
  await simpan("fyp-media", keSharp(cahayaJadiPutih(await mentah(fyp))));

  // Latar putih dibuang. Lions nggak diterangin: bayangan abu di
  // sekelilingnya udah misahin dari latar, diterangin malah jadi pucat.
  await simpan("isc", keSharp(buangLatar(await mentah(baca("Forum ISC Indonesia.jpeg")), miripPutih)));
  await simpan("lions-umn", keSharp(buangLatar(await mentah(baca("Logo Lion basket.jpeg")), miripPutih)));
  // Duta Anti Narkoba: pakai versi yang latarnya udah dihapus manual
  // (buangLatar cuma ngapus putih yang nyambung ke pinggir, putih di
  // sela-sela ikonnya ketinggalan). "DUTA" & "UMN" biru dongker — diterangin.
  await simpan("duta-anti-narkoba", keSharp(terangkanGelap(await mentah(baca("Logo Duta Anti Narkoba_-jukebox-bg-removed-500x500.png")))));

  // JPEG tulisan hitam di latar putih → tulisan putih.
  await simpan("attack-music-friends", keSharp(tintaJadiPutih(await mentah(baca("LOGO ATTACK MUSIC FRIENDS_.jpg")))));

  // Hitam-putih + kuning + merah: hitam/putihnya ditukar (headphone &
  // garis tepi huruf jadi putih), lalu latar (sekarang hitam) dibuang.
  await simpan("radio-unpad", keSharp(buangLatar(balikNetral(await mentah(baca("Logo radio unpad.jpg"))), miripHitam, 0.86)));
})();

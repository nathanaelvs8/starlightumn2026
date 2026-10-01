/**
 * Ubah rasi bintang di public/images/division/bintang.webp jadi DATA
 * (titik bintang + garis penghubung), buat halaman /stages.
 *
 * Jalanin: node convert-rasi.js
 *
 * Kenapa nggak dipakai gambarnya langsung kayak di /division: di Stages
 * rasinya "digambar" — garisnya nyambung dari bintang ke bintang satu
 * per satu. Itu cuma bisa kalau tiap garis jadi garis SVG sendiri, bukan
 * piksel di dalam gambar.
 *
 * Caranya:
 *   1. Bintang = titik paling terang di sekitarnya (puncak alpha lokal).
 *      Titik tempat garis nyambung ke tengah garis lain juga dicatat,
 *      tapi ditandai biar nggak digambar sebagai bintang.
 *   2. Garis = dua bintang yang di antaranya ada jejak piksel nyambung.
 *      Tiap pasangan bintang dicek: sepanjang ruas lurusnya disampel,
 *      kalau hampir semua sampel "ada isinya", berarti ada garis.
 *   3. Bintang yang saling nyambung dikelompokkan jadi satu rasi.
 *
 * Output: src/lib/rasi.ts (koordinat dalam piksel gambar 1920x682).
 */

const fs = require("fs");
const sharp = require("sharp");

const SRC = "public/images/division/bintang.webp";
const OUT = "src/lib/rasi.ts";

/**
 * Bintang = puncak alpha lokal (paling terang dalam kotak 9x9).
 *   >= AMBANG_BINTANG  bintang beneran (garisnya sendiri cuma ±55-100)
 *   >= AMBANG_SAMBUNG  titik sambungan: garis yang nyambung ke TENGAH
 *                      garis lain, bukan ke bintang. Dipakai buat
 *                      nyambungin garis, tapi nggak digambar.
 * Puncak di garis polos juga bisa nyampe ±75, makanya titik sambungan
 * juga harus "tebal" (banyak piksel isi di sekitarnya).
 */
const AMBANG_BINTANG = 125;
const AMBANG_SAMBUNG = 85;
/** Bintang dengan puncak segini ke atas dianggap yang paling nyala. */
const AMBANG_TERANG = 175;
/** Alpha minimal buat dihitung "ada garis". */
const AMBANG_GARIS = 18;
/** Porsi sampel di sepanjang ruas yang harus ada isinya. */
const SYARAT_GARIS = 0.85;
/**
 * Toleransi ke samping (piksel). Titik terang bintang nggak selalu pas
 * di ujung garisnya — bisa meleset 2-3px — jadi ruas lurus antar
 * pusat bintang bisa sedikit keluar jalur di dekat ujungnya.
 */
const TOLERANSI = 2;

(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const a = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : data[(y * W + x) * 4 + 3]);

  /**
   * Ada berapa garis yang keluar dari titik ini? Disampel di lingkaran
   * kecil (r = 7px) di sekelilingnya, dihitung berapa potong busur yang
   * "ada isinya". Titik di tengah garis lurus = 2, sambungan = 3+.
   */
  const cabang = (x, y) => {
    const N = 56;
    const isi = [];
    for (let k = 0; k < N; k++) {
      const t = (k / N) * Math.PI * 2;
      isi.push(a(Math.round(x + 7 * Math.cos(t)), Math.round(y + 7 * Math.sin(t))) >= 30);
    }
    let potong = 0;
    for (let k = 0; k < N; k++) if (isi[k] && !isi[(k + N - 1) % N]) potong++;
    return potong;
  };

  // --- 1. bintang (+ titik sambungan) ---
  const calon = [];
  for (let y = 4; y < H - 4; y++) {
    for (let x = 4; x < W - 4; x++) {
      const v = a(x, y);
      if (v < AMBANG_SAMBUNG) continue;
      let puncak = true;
      for (let dy = -4; dy <= 4 && puncak; dy++) for (let dx = -4; dx <= 4; dx++) if ((dx || dy) && a(x + dx, y + dy) > v) { puncak = false; break; }
      if (!puncak) continue;
      if (v < AMBANG_BINTANG && cabang(x, y) < 3) continue; // puncak di garis polos, bukan sambungan
      calon.push({ x, y, v });
    }
  }
  // puncak kembar (bintang yang puncaknya datar) → ambil satu
  calon.sort((p, q) => q.v - p.v);
  const gabung = [];
  for (const c of calon) if (!gabung.some((g) => Math.hypot(g.x - c.x, g.y - c.y) < 7)) gabung.push(c);
  // jenis: 0 bintang, 1 bintang paling nyala, 2 titik sambungan (nggak digambar)
  for (const g of gabung) g.jenis = g.v >= AMBANG_TERANG ? 1 : g.v >= AMBANG_BINTANG ? 0 : 2;
  // "Sambungan" yang deket banget sama bintang itu palsu: glow bintangnya,
  // atau dua garis yang baru mulai misah dari bintang yang sama, kebaca
  // bercabang. Sambungan beneran di gambar ini jaraknya 40px+ — buang
  // yang di bawah 20px.
  for (let k = gabung.length - 1; k >= 0; k--) {
    const g = gabung[k];
    if (g.jenis === 2 && gabung.some((b) => b.jenis !== 2 && Math.hypot(b.x - g.x, b.y - g.y) < 20)) gabung.splice(k, 1);
  }

  // --- 2. garis ---
  const adaIsi = (x, y) => {
    const T = TOLERANSI;
    for (let dy = -T; dy <= T; dy++) for (let dx = -T; dx <= T; dx++) if (a(Math.round(x) + dx, Math.round(y) + dy) >= AMBANG_GARIS) return true;
    return false;
  };
  const garis = [];
  for (let i = 0; i < gabung.length; i++) {
    for (let j = i + 1; j < gabung.length; j++) {
      const p = gabung[i], q = gabung[j];
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < 8 || d > 260) continue;
      // sampel cuma di tengah ruas (lewatin glow bintangnya sendiri)
      let isi = 0, total = 0;
      for (let t = 6 / d; t <= 1 - 6 / d; t += 1.5 / d) {
        total++;
        if (adaIsi(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t)) isi++;
      }
      if (total > 3 && isi / total >= SYARAT_GARIS) garis.push([i, j, d]);
    }
  }

  // Buang garis "bayangan": kalau A-B, B-C ada dan A-C hampir lurus lewat
  // B, ruas A-C itu cuma gabungan dua ruas, bukan garis sendiri.
  const jarak = (i, j) => Math.hypot(gabung[j].x - gabung[i].x, gabung[j].y - gabung[i].y);
  const punya = (i, j) => garis.some(([p, q]) => (p === i && q === j) || (p === j && q === i));
  let bersih = garis.filter(([i, j, d]) => {
    for (let k = 0; k < gabung.length; k++) {
      if (k === i || k === j || !punya(i, k) || !punya(k, j)) continue;
      if (jarak(i, k) + jarak(k, j) - d < 2.5) return false;
    }
    return true;
  });

  // Garis yang terang bisa punya "puncak" palsu di tengah jalan, yang
  // lolos jadi titik sambungan. Titik sambungan yang cuma diapit dua
  // garis segaris itu bukan sambungan beneran → lebur: dua ruasnya
  // diganti satu ruas langsung. Diulang sampai nggak ada lagi.
  let berubah = true;
  while (berubah) {
    berubah = false;
    for (let k = 0; k < gabung.length; k++) {
      if (gabung[k].jenis !== 2 || gabung[k].buang) continue;
      const kena = bersih.filter(([p, q]) => p === k || q === k);
      if (kena.length > 2) continue; // sambungan beneran (3 arah atau lebih)
      if (kena.length === 2) {
        const [u, v] = kena.map(([p, q]) => (p === k ? q : p));
        if (jarak(u, k) + jarak(k, v) - jarak(u, v) > 2.5) continue; // belok → biarin
        bersih = bersih.filter((g) => !kena.includes(g));
        if (!bersih.some(([p, q]) => (p === u && q === v) || (p === v && q === u))) bersih.push([u, v, jarak(u, v)]);
      } else {
        bersih = bersih.filter((g) => !kena.includes(g)); // ujung buntu / nyasar
      }
      gabung[k].buang = true;
      berubah = true;
    }
  }

  // Dua bintang yang nempel (< 12px) dan sama-sama ditarik garis dari
  // satu bintang dengan arah hampir sama → kelihatan kayak garis dobel.
  // Yang lebih panjang dibuang; bintang satunya tetap nyambung lewat
  // garis pendek di antara keduanya (kalau ada).
  for (let k = 0; k < gabung.length; k++) {
    const kena = bersih.filter(([p, q]) => p === k || q === k);
    for (const g1 of kena) {
      for (const g2 of kena) {
        if (g1 === g2 || !bersih.includes(g1) || !bersih.includes(g2)) continue;
        const u = g1[0] === k ? g1[1] : g1[0];
        const v = g2[0] === k ? g2[1] : g2[0];
        if (jarak(u, v) >= 12) continue;
        const sudut = (i) => Math.atan2(gabung[i].y - gabung[k].y, gabung[i].x - gabung[k].x);
        let beda = Math.abs(sudut(u) - sudut(v));
        if (beda > Math.PI) beda = 2 * Math.PI - beda;
        if (beda > (10 * Math.PI) / 180) continue;
        const buang = jarak(k, u) > jarak(k, v) ? g1 : g2;
        bersih = bersih.filter((g) => g !== buang);
      }
    }
  }

  // --- 3. kelompokkan jadi rasi ---
  const induk = gabung.map((_, i) => i);
  const cari = (i) => (induk[i] === i ? i : (induk[i] = cari(induk[i])));
  for (const [i, j] of bersih) induk[cari(i)] = cari(j);
  const kelompok = new Map();
  gabung.forEach((g, i) => {
    if (g.buang) return;
    const r = cari(i);
    if (!kelompok.has(r)) kelompok.set(r, []);
    kelompok.get(r).push(i);
  });

  const rasi = [];
  for (const anggota of kelompok.values()) {
    if (anggota.length < 3) continue; // bintang nyasar tanpa garis
    // titik sambungan yang ternyata nggak nyambung ke mana-mana → buang
    if (anggota.filter((i) => gabung[i].jenis !== 2).length < 3) continue;
    const xs = anggota.map((i) => gabung[i].x), ys = anggota.map((i) => gabung[i].y);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    const lokal = new Map(anggota.map((g, k) => [g, k]));
    // urutan garis: jalan dari bintang paling kiri, merambat ke tetangga
    // (BFS) — biar pas digambar kelihatan nyambung, bukan loncat-loncat
    const garisRasi = bersih.filter(([i]) => lokal.has(i));
    const mulai = anggota.reduce((m, g) => (gabung[g].x < gabung[m].x ? g : m), anggota[0]);
    const urut = [], dikunjungi = new Set([mulai]), antri = [mulai], dipakai = new Set();
    while (antri.length) {
      const b = antri.shift();
      garisRasi.forEach((g, gi) => {
        if (dipakai.has(gi) || (g[0] !== b && g[1] !== b)) return;
        const lain = g[0] === b ? g[1] : g[0];
        dipakai.add(gi);
        urut.push([lokal.get(b), lokal.get(lain)]);
        if (!dikunjungi.has(lain)) { dikunjungi.add(lain); antri.push(lain); }
      });
    }
    rasi.push({
      x: Math.round(x0), y: Math.round(y0),
      w: Math.round(Math.max(...xs) - x0), h: Math.round(Math.max(...ys) - y0),
      bintang: anggota.map((i) => [gabung[i].x - x0, gabung[i].y - y0, gabung[i].jenis]),
      garis: urut,
    });
  }
  rasi.sort((p, q) => p.x - q.x);

  const isi = `/**
 * Rasi bintang, hasil convert-rasi.js dari public/images/division/bintang.webp.
 * JANGAN diedit tangan — ganti gambarnya, terus jalanin ulang scriptnya.
 *
 * Tiap rasi:
 *   x, y, w, h  kotaknya di gambar asli (1920x682)
 *   bintang     [x, y, jenis] relatif ke pojok kiri-atas kotak;
 *               jenis 0 = bintang, 1 = bintang paling nyala,
 *               2 = titik sambungan (garis ketemu garis) — nggak digambar
 *   garis       [indeks bintang, indeks bintang], urut dari kiri
 *               merambat ke tetangga — urutan waktu digambar
 */
export type Rasi = {
  x: number;
  y: number;
  w: number;
  h: number;
  bintang: [number, number, number][];
  garis: [number, number][];
};

export const RASI: Rasi[] = ${JSON.stringify(rasi)};
`;
  fs.writeFileSync(OUT, isi);
  console.log(`${gabung.length} bintang, ${bersih.length} garis, ${rasi.length} rasi → ${OUT}`);
  rasi.forEach((r, i) => console.log(`  #${i} @${r.x},${r.y} ${r.w}x${r.h}  ${r.bintang.length} bintang, ${r.garis.length} garis`));
})();

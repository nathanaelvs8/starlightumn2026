/**
 * ===================================================================
 * LAYOUT MINI GERDA — INI YANG KAMU SETEL SENDIRI
 * ===================================================================
 *
 * Bayangin garis arus itu SUNGAI panjang yang miring turun, dan layar
 * kamu itu KAMERA yang nyusurin sungai. Pas pindah divisi, kamera
 * geser (mendatar + turun) biar crest divisi itu selalu mampir di
 * TITIK FOKUS yang sama.
 *
 * Tiap crest posisinya relatif ke GAMBAR GARIS (arus.png):
 *   x: 0 = ujung kiri garis, 100 = ujung kanan garis
 *   y: 0 = atas gambar garis, 100 = bawah gambar garis
 *
 * Karena garis miring turun, makin gede x biasanya makin gede y juga.
 * Setel tiap crest sampai duduk PAS di garis.
 *
 * Urutan HARUS sama dengan 13 divisi.
 */

export type CrestPos = { x: number; y: number };

export const crestLayout: Record<string, CrestPos> = {
  Auradon: { x: 20, y: 45 },
  Treasury: { x: 25, y: 53 },
  Herald: { x: 29.5, y: 66 },
  Wonderland: { x: 35, y: 65 },
  Wicked: { x: 40, y: 63 },
  Dizzy: { x: 45, y: 69 },
  Lumiere: { x: 49, y: 74 },
  Mirror: { x: 53, y: 76 },
  Raven: { x: 57, y: 78 },
  Relic: { x: 62, y: 75 },
  Fairies: { x: 67, y: 74 },
  Knights: { x: 72, y: 78 },
  Enchanted: { x: 76, y: 81 },
};

/**
 * ===== SETELAN =====
 *
 * ZOOM: seberapa gede gambar garis dibanding layar.
 *   250 = garis 2.5x lebar layar (di-zoom, jadi cuma sebagian keliatan
 *   tiap saat — sesuai maumu "awalnya di-zoom banget"). Gedein buat
 *   zoom lebih dekat, kecilin buat lebih jauh (crest lebih rapat).
 */
export const ZOOM = 300; // persen

/**
 * TITIK FOKUS — di mana (persen LAYAR) crest aktif selalu mendarat.
 * Kamera diatur biar crest aktif jatuh di sini terus.
 */
export const FOKUS_X = 30; // agak kiri, panel muat di kanan
export const FOKUS_Y = 45; // tengah agak atas

/** Ukuran crest (persen lebar layar). */
export const SIZE_AKTIF = 18;
export const SIZE_NONAKTIF = 7;

/** Rasio gambar arus.png (lebar / tinggi) — dipakai biar crest & garis
 *  satu patokan di semua layar. Update kalau aset diganti lagi. */
export const ARUS_RATIO = 4926 / 1749;

/**
 * ===================================================================
 * SETELAN KHUSUS HP (layar < 1024px)
 * ===================================================================
 * Di HP layoutnya beda: arus di ATAS (setengah layar atas), list
 * anggota di BAWAH. Jadi titik fokus, zoom, dan koordinat crest-nya
 * sendiri — disetel terpisah dari desktop.
 *
 * Tinggi "panggung arus" di HP = 50% tinggi layar (lihat GerdaFlow).
 * Koordinat crest di sini relatif ke gambar garis, sama aturannya
 * kayak crestLayout desktop (x 0-100 kiri-kanan, y 0-100 atas-bawah).
 */
export const crestLayoutHP: Record<string, CrestPos> = {
  Auradon: { x: 19, y: 45 },
  Treasury: { x: 24, y: 50 },
  Herald: { x: 29, y: 64 },
  Wonderland: { x: 34, y: 67 },
  Wicked: { x: 39, y: 63 },
  Dizzy: { x: 44, y: 68 },
  Lumiere: { x: 49, y: 73 },
  Mirror: { x: 54, y: 76 },
  Raven: { x: 59, y: 78 },
  Relic: { x: 64, y: 75 },
  Fairies: { x: 69, y: 74 },
  Knights: { x: 74, y: 79 },
  Enchanted: { x: 79, y: 81 },
};

/** Zoom garis di HP — biasanya lebih gede dari desktop karena panel
 *  arus HP lebih pendek. Setel sampai garis enak dilihat. */
export const ZOOM_HP = 600;

/** Titik fokus HP: tengah (x 50), agak ke atas panel arus (y kecil). */
export const FOKUS_X_HP = 50;
export const FOKUS_Y_HP = 32;

/** Ukuran crest HP (persen lebar layar) — lebih gede karena layar sempit. */
export const SIZE_AKTIF_HP = 34;
export const SIZE_NONAKTIF_HP = 16;
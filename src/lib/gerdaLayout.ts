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
  Auradon: { x: 27, y: 25 },
  Treasury: { x: 31, y: 32 },
  Herald: { x: 35, y: 42 },
  Wonderland: { x: 39, y: 45 },
  Wicked: { x: 43, y: 48 },
  Dizzy: { x: 47, y: 52 },
  Lumiere: { x: 51, y: 57 },
  Mirror: { x: 54.5, y: 67 },
  Raven: { x: 59, y: 72 },
  Relic: { x: 63, y: 67 },
  Fairies: { x: 67, y: 69 },
  Knights: { x: 71, y: 71 },
  Enchanted: { x: 75, y: 78 },
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
export const SIZE_AKTIF = 15;
export const SIZE_NONAKTIF = 7;
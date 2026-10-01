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
 *
 * Diatur dalam DUA bagian:
 *   SLOT    titik-titik di garis, urut dari kiri. Setel x/y-nya sampai
 *           tiap titik duduk PAS di garis.
 *   URUTAN  divisi mana duduk di slot mana (slot pertama = divisi
 *           pertama di URUTAN, dst). Ganti urutan cukup di sini.
 */

export type CrestPos = { x: number; y: number };

/**
 * Urutan divisi di arus, dari kiri (yang pertama kebuka) ke kanan.
 *
 * Herald, Wonderland, Enchanted TIDAK membuka Mini Gerda — jadi
 * ditaruh paling BELAKANG, biar yang ada daftar anggotanya duluan.
 * (Auradon juga nggak buka, dan nggak ditampilin sama sekali.)
 */
export const URUTAN = [
  "Treasury",
  "Wicked",
  "Dizzy",
  "Lumiere",
  "Mirror",
  "Raven",
  "Relic",
  "Fairies",
  "Knights",
  "Herald",
  "Wonderland",
  "Enchanted",
];

/** Divisi yang nggak membuka Mini Gerda (ditampilin, tapi tanpa daftar). */
export const TANPA_MINI_GERDA = ["Herald", "Wonderland", "Enchanted"];

/** Slot di garis (desktop), urut dari kiri — jumlahnya = URUTAN. */
const SLOT: CrestPos[] = [
  { x: 25, y: 53 },
  { x: 29.5, y: 66 },
  { x: 35, y: 65 },
  { x: 40, y: 63 },
  { x: 45, y: 69 },
  { x: 49, y: 74 },
  { x: 53, y: 76 },
  { x: 57, y: 78 },
  { x: 62, y: 75 },
  { x: 67, y: 74 },
  { x: 72, y: 78 },
  { x: 76, y: 81 },
];

/** Posisi tiap divisi (desktop) = slot ke-i buat divisi ke-i di URUTAN. */
export const crestLayout: Record<string, CrestPos> = Object.fromEntries(
  URUTAN.map((nama, i) => [nama, SLOT[i]]),
);

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
 * Koordinat slot di sini relatif ke gambar garis, sama aturannya
 * kayak SLOT desktop (x 0-100 kiri-kanan, y 0-100 atas-bawah).
 * Urutan divisinya sama, dari URUTAN di atas.
 */
const SLOT_HP: CrestPos[] = [
  { x: 24, y: 50 },
  { x: 29, y: 64 },
  { x: 34, y: 67 },
  { x: 39, y: 63 },
  { x: 44, y: 68 },
  { x: 49, y: 73 },
  { x: 54, y: 76 },
  { x: 59, y: 78 },
  { x: 64, y: 75 },
  { x: 69, y: 74 },
  { x: 74, y: 79 },
  { x: 79, y: 81 },
];

export const crestLayoutHP: Record<string, CrestPos> = Object.fromEntries(
  URUTAN.map((nama, i) => [nama, SLOT_HP[i]]),
);

/** Zoom garis di HP — biasanya lebih gede dari desktop karena panel
 *  arus HP lebih pendek. Setel sampai garis enak dilihat. */
export const ZOOM_HP = 600;

/** Titik fokus HP: tengah (x 50), agak ke atas panel arus (y kecil).
 *  Dulu 32 — bintangnya jauh dari nama divisi, celah langit kosongnya
 *  kegedean. */
export const FOKUS_X_HP = 50;
export const FOKUS_Y_HP = 38;

/** Ukuran crest HP (persen lebar layar) — lebih gede karena layar sempit.
 *  Aktif dulu 34: nama divisi di dalam bintangnya kekecilan buat kebaca. */
export const SIZE_AKTIF_HP = 40;
export const SIZE_NONAKTIF_HP = 17;
import { asset } from "./assets";

/**
 * SEMUA DATA PANGGUNG STARLIGHT.
 *
 * Nambah / ganti panggung cukup di sini — halaman /stages dan
 * /stages/<slug> nyusun sendiri dari daftar ini.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ TODO — TEKS DI BAWAH MASIH SEMENTARA.                           │
 * │ `desc` & `tagline` ditulis ngikutin nada Starlight, TAPI bukan   │
 * │ teks resmi. Ganti sama naskah dari tim Acara sebelum rilis.      │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * `bg` masih numpang gambar divisi (belum ada aset khusus panggung):
 *   twizzle → auradon, lonielle → enchanted, enchantia → knights.
 */

export type Stage = {
  /** Dipakai buat URL /stages/<slug> DAN nama file gambarnya. */
  slug: string;
  /** Nama yang kebaca manusia. Logonya gambar, ini buat alt & judul. */
  name: string;
  /** Satu baris di bawah logo. */
  tagline: string;
  /** Isi kartu deskripsi. Tiap item = satu paragraf. */
  desc: string[];
  /** Background halaman panggungnya. */
  bg: string;
  /**
   * Warna aksen: glow seal, garis segitiga, dan sorot judul.
   * Diambil dari warna dominan logonya biar tiap panggung beda rasa.
   */
  accent: string;
  /**
   * ID video YouTube buat trailer. Kosongin kalau videonya belum ada —
   * bingkai emasnya tetap tampil dengan isi placeholder.
   */
  youtubeId?: string;
  /**
   * Foto-foto dokumentasi. Kosong = tampil kotak placeholder, jadi
   * layoutnya udah kelihatan sebelum fotonya dikirim.
   */
  moments: string[];
};

export const stages: Stage[] = [
  {
    slug: "twizzle",
    name: "Twizzle",
    tagline: "Panggung pertama, tempat setiap suara mulai berani terdengar.",
    desc: [
      "Twizzle membuka rangkaian Starlight dengan energi yang paling jujur — belum dipoles, belum ditata, tapi justru di situ letak kilaunya.",
      "Di panggung ini para calon Isthara melangkah keluar dari zona amannya untuk pertama kali. Tidak ada yang menuntut sempurna; yang dicari adalah keberanian untuk mulai.",
      "Seperti percikan pertama sebelum api menyala, Twizzle menandai awal dari perjalanan yang panjang.",
    ],
    bg: asset.division.bg("auradon"),
    accent: "#c9b6f5",
    moments: [],
  },
  {
    slug: "lonielle",
    name: "Lonielle",
    tagline: "Panggung kedua, tempat bakat diuji dan karakter dibentuk.",
    desc: [
      "Lonielle adalah babak ketika kilau pertama harus dibuktikan. Sorotan jadi lebih terang, dan bersamanya datang tuntutan yang lebih berat.",
      "Di sini peserta tidak lagi cuma menampilkan bakat, tapi juga ketahanan — bagaimana mereka bertahan saat panggung terasa lebih besar dari dirinya.",
      "Mawar yang melilit nama Lonielle mengingatkan: yang indah selalu punya durinya sendiri.",
    ],
    bg: asset.division.bg("enchanted"),
    accent: "#e8a58c",
    moments: [],
  },
  {
    slug: "enchantia",
    name: "Enchantia",
    tagline: "Panggung terakhir, tempat semua yang tersisa menjadi cahaya.",
    desc: [
      "Enchantia menutup rangkaian Starlight. Yang berdiri di sini adalah mereka yang sudah melewati dua panggung sebelumnya tanpa kehilangan diri sendiri.",
      "Tidak ada lagi yang disembunyikan. Setiap penampilan di Enchantia adalah puncak dari proses panjang — bukan sekadar pertunjukan, tapi pembuktian.",
      "Di panggung inilah seorang Isthara lahir.",
    ],
    bg: asset.division.bg("knights"),
    accent: "#b39ae8",
    moments: [],
  },
];

export function findStage(slug: string) {
  return stages.find((s) => s.slug === slug);
}

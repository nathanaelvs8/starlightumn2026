import { asset } from "./assets";

/**
 * SEMUA DATA PANGGUNG STARLIGHT.
 *
 * Nambah / ganti panggung cukup di sini — halaman /stages dan
 * /stages/<slug> nyusun sendiri dari daftar ini.
 *
 * `desc` = penjelasan panggung dari panitia. Di naskah aslinya dua
 * panggung ditulis "Dizzy" & "Loniella"; di sini disamain sama nama di
 * logo & judul (Twizzle, Lonielle) — "Dizzy Tremaine" tetap, itu nama
 * karakter inspirasinya.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ TODO — `tagline` MASIH SEMENTARA.                               │
 * │ Ditulis ngikutin nada Starlight, TAPI bukan teks resmi. Ganti    │
 * │ sama naskah dari tim Acara sebelum rilis.                        │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * `bg` Twizzle & Enchantia pakai langit aurora (asset.stages.bgDetail,
 * lihat convert-stages.js); Lonielle pakai background divisi Enchanted.
 * BEDA sama halaman daftar /stages, yang tetap pakai background lamanya.
 * Kalau nanti ada background khusus per panggung, ganti di masing-masing
 * `bg` di bawah.
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
   * Seberapa gelap peredup di atas background, persen (default 25).
   * Background yang terang (mis. Enchanted, kuning-oranye) butuh lebih
   * tebal — kalau nggak, lingkaran sihir putihnya tenggelam.
   */
  redup?: number;
  /**
   * Segelnya udah kebuka? Di daftar /stages panggung yang terbuka pakai
   * logo BERWARNA (tanpa rantai & gembok); sisanya logo kekunci. Nyalain
   * pas panggungnya udah/lagi berlangsung.
   */
  terbuka?: boolean;
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
  /*
   * URUTAN = URUTAN ACARA. Halaman /stages naruh panggung pertama di
   * puncak segitiga (atas-tengah), lanjut searah jarum jam; di HP
   * urutannya dari atas ke bawah.
   *   1. Lonielle   3–4 Oktober 2026
   *   2. Twizzle    8–9 Oktober 2026
   *   3. Enchantia  4 November 2026
   */
  {
    slug: "lonielle",
    name: "Lonielle",
    tagline: "Panggung pertama, tempat bakat diuji dan karakter dibentuk.",
    desc: [
      "Lonielle terinspirasi dari karakter Lonnie dalam Descendants yang melambangkan keberanian dan rasa percaya diri.",
      "Stage ini menjadi langkah awal bagi peserta untuk keluar dari rasa takut dan mulai menunjukkan kemampuan mereka di depan banyak orang. Filosofinya adalah tentang keberanian untuk mencoba dan membuktikan diri.",
    ],
    // Lonielle sengaja pakai background divisi Enchanted, bukan aurora.
    // Peredupnya 60% kayak dulu: Enchanted terang banget, di 25% lingkaran
    // sihir putihnya nyaris hilang.
    bg: asset.division.bg("enchanted"),
    redup: 60,
    terbuka: true,
    accent: "#e8a58c",
    moments: [],
  },
  {
    slug: "twizzle",
    name: "Twizzle",
    tagline: "Panggung kedua, tempat setiap suara mulai berani terdengar.",
    desc: [
      "Twizzle terinspirasi dari karakter Dizzy Tremaine dalam Descendants yang dikenal kreatif, ceria, dan penuh warna.",
      "Stage ini melambangkan proses peserta mulai menemukan identitas dan gaya mereka sendiri. Di tahap ini, peserta mulai lebih bebas mengekspresikan kreativitas dan menunjukkan keunikan mereka.",
    ],
    bg: asset.stages.bgDetail,
    accent: "#c9b6f5",
    moments: [],
  },
  {
    slug: "enchantia",
    name: "Enchantia",
    tagline: "Panggung terakhir, tempat semua yang tersisa menjadi cahaya.",
    desc: [
      "Enchantia berasal dari kata enchant yang berarti memikat atau memberi pesona magis.",
      "Stage ini menjadi puncak perjalanan peserta, dimana mereka tampil dengan penuh percaya diri dan berhasil memukau penonton melalui bakat serta pesona yang mereka miliki.",
    ],
    bg: asset.stages.bgDetail,
    accent: "#b39ae8",
    moments: [],
  },
];

export function findStage(slug: string) {
  return stages.find((s) => s.slug === slug);
}

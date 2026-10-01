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
  /**
   * Tanggal acaranya, format YYYY-MM-DD (WIB). `selesai` kosong = satu
   * hari. Dipakai buat label tanggal di /stages dan info "panggung
   * terdekat" di hero homepage — yang otomatis pindah ke panggung
   * berikutnya begitu tanggalnya lewat.
   */
  mulai: string;
  selesai?: string;
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
   * Warna aksen: lingkaran sihir di halaman panggungnya, kabut pas
   * segelnya disentuh, dan berlian di kartu deskripsi.
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
    mulai: "2026-10-03",
    selesai: "2026-10-04",
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
    // tembaga-emas, dari warna logonya (dulu #e8a58c, kepucetan buat
    // garis lingkaran sihir)
    accent: "#eba46b",
    moments: [],
  },
  {
    slug: "twizzle",
    name: "Twizzle",
    tagline: "Panggung kedua, tempat setiap suara mulai berani terdengar.",
    mulai: "2026-10-08",
    selesai: "2026-10-09",
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
    mulai: "2026-11-04",
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

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "3–4 Oktober 2026" / "4 November 2026" / "30 Oktober – 1 November 2026". */
export function tanggalPanggung(s: Pick<Stage, "mulai" | "selesai">) {
  const [y1, m1, d1] = s.mulai.split("-").map(Number);
  if (!s.selesai || s.selesai === s.mulai) return `${d1} ${BULAN[m1 - 1]} ${y1}`;
  const [y2, m2, d2] = s.selesai.split("-").map(Number);
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${BULAN[m1 - 1]} ${y1}`;
  return `${d1} ${BULAN[m1 - 1]} – ${d2} ${BULAN[m2 - 1]} ${y2}`;
}

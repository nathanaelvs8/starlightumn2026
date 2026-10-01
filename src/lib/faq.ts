/**
 * ISI FAQ — SEMENTARA, dari panitia. Ganti di sini aja; halaman /faq
 * nyusun sendiri, dikelompokin per `kategori` (urutan kelompoknya
 * ngikutin KATEGORI di bawah).
 *
 * `daftar` = poin-poin yang tampil sebagai list di bawah jawaban
 * (mis. SKKM per juara). Ikut kecari juga di kolom pencarian.
 */

export const KATEGORI = ["Starlight", "Isthara", "Mini Gerda"] as const;
export type Kategori = (typeof KATEGORI)[number];

export type FaqItem = {
  kategori: Kategori;
  q: string;
  a: string;
  daftar?: string[];
};

export const faqs: FaqItem[] = [
  {
    kategori: "Starlight",
    q: "Apa itu Starlight?",
    a: "Starlight adalah Kegiatan Mahasiswa Universitas Multimedia Nusantara yang berfokus pada pencarian bakat. Siapa pun yang memiliki bakat, seperti bernyanyi, menari, maupun bakat lainnya, dapat langsung mendaftar.",
  },

  {
    kategori: "Isthara",
    q: "Apa itu Isthara?",
    a: "Isthara adalah sebutan bagi para peserta yang mengikuti kompetisi Starlight.",
  },
  {
    kategori: "Isthara",
    q: "Apakah Isthara mendapatkan SKKM?",
    a: "Ya. Setiap Isthara akan mendapatkan 1 SKKM Bakat & Minat. Isthara yang meraih juara akan mendapatkan SKKM tambahan sebagai berikut:",
    daftar: ["Juara 1: +4 SKKM", "Juara 2: +3 SKKM", "Juara 3: +2 SKKM", "Juara Favorit: +2 SKKM"],
  },
  {
    kategori: "Isthara",
    q: "Siapa saja yang dapat menjadi Isthara?",
    a: "Pendaftaran Isthara terbuka untuk umum. Mahasiswa Universitas Multimedia Nusantara maupun pelajar dan mahasiswa dari institusi lain dapat mengikuti Starlight.",
  },

  {
    kategori: "Mini Gerda",
    q: "Berapa lama masa kerja Mini Gerda?",
    a: "Masa kerja Mini Gerda berlangsung selama 3 bulan, yaitu dari akhir September hingga pertengahan November.",
  },
  {
    kategori: "Mini Gerda",
    q: "Berapa SKKM yang didapatkan Mini Gerda?",
    a: "Mini Gerda mendapatkan 2 SKKM, yaitu 1 SKKM Organisasi & Pengembangan Kepribadian dan 1 SKKM Bakat & Minat.",
  },
];

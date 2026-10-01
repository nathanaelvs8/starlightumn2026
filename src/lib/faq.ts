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
    q: "Starlight acara apa?",
    a: "Starlight adalah Kegiatan Mahasiswa dari Universitas Multimedia Nusantara yang berfokus pada Pencarian Bakat. Teman-teman yang memiliki Bakat apapun seperti bernyanyi, dance, dan berbagai bakat lainnya bisa langsung daftar yaa!",
  },

  {
    kategori: "Isthara",
    q: "Isthara itu apa sih?",
    a: "Isthara adalah panggilan untuk teman-teman Peserta yang mengikuti Kompetisi Starlight. Jadi kalau teman-teman dengar kata-kata “Isthara”, itu adalah sebutan untuk teman-teman Peserta ya.",
  },
  {
    kategori: "Isthara",
    q: "Apakah Isthara mendapat SKKM?",
    a: "Dapat Dong, para Isthara akan mendapatkan SKKM 1+ Bakat & Minat. Khusus Isthara yang berhasil mendapat Juara, akan mendapat SKKM tambahan:",
    daftar: ["Juara 1: +4 SKKM", "Juara 2: +3 SKKM", "Juara 3: +2 SKKM", "Juara Favorit: +2 SKKM"],
  },
  {
    kategori: "Isthara",
    q: "Isthara terbuka untuk siapa saja?",
    a: "Terbuka untuk Umum ya, jadi untuk Teman-teman yang berkuliah di Universitas Multimedia Nusantara ataupun masih bersekolah / berkuliah di tempat lain bisa sekali untuk mengikuti Acara Starlight ya teman-teman.",
  },

  {
    kategori: "Mini Gerda",
    q: "Masa kerja sebagai Mini Gerda berapa lama?",
    a: "Masa kerjanya hanya 3 Bulan saja ya teman-teman, dari Akhir September sampai Pertengahan November.",
  },
  {
    kategori: "Mini Gerda",
    q: "Dapat SKKM apa saja?",
    a: "Mini Gerda mendapat 2 SKKM, 1+ SKKM Organisasi & Pengembangan Kepribadian dan 1+ SKKM Bakat & Minat.",
  },
];

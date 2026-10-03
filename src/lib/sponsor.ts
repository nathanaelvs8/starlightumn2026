/**
 * LOGO SPONSOR & MEDIA PARTNER di homepage.
 *
 * Selama dua-duanya kosong, bagian Sponsor nggak ditampilin sama sekali
 * (dulu tampil 16 kotak abu-abu "Logo sponsor" — kelihatan belum jadi).
 *
 * Cara nambah: taruh file logonya di public/images/sponsor/ (sebaiknya
 * PNG/WebP transparan), lalu tambahin satu baris, misalnya:
 *   { nama: "Nama Sponsor", src: "/images/sponsor/nama-sponsor.webp" },
 * `nama` juga dipakai sebagai alt (dibaca screen reader & mesin pencari).
 *
 * Logonya tampil BERJALAN (marquee) langsung di atas website yang gelap,
 * tanpa kotak. Jadi file di public/images/sponsor/ disiapin dari logo
 * asli pakai convert-sponsor.js: latar putih/hitam dibuang, tulisan
 * hitam dijadiin putih. Logo baru = tambahin juga di skrip itu.
 * Urutannya alfabetis (marquee dibagi dua baris: separuh atas & bawah).
 */

export type Logo = { nama: string; src: string };

export const SPONSOR: Logo[] = [
  { nama: "BSM Rental", src: "/images/sponsor/bsm-rental.webp" },
  { nama: "Eventory", src: "/images/sponsor/eventory.webp" },
  { nama: "FitHub", src: "/images/sponsor/fithub.webp" },
  { nama: "FNV Rent", src: "/images/sponsor/fnv-rent.webp" },
  { nama: "ITO EN", src: "/images/sponsor/ito-en.webp" },
  { nama: "Kripik Bujangan", src: "/images/sponsor/kripik-bujangan.webp" },
  { nama: "Mandiri Genset", src: "/images/sponsor/mandiri-genset.webp" },
  { nama: "Matcha Pop", src: "/images/sponsor/matcha-pop.webp" },
  { nama: "MSP Film Equipment", src: "/images/sponsor/msp.webp" },
  { nama: "Nasi Bento Alesha", src: "/images/sponsor/alesha.webp" },
  { nama: "Sari Roti", src: "/images/sponsor/sari-roti.webp" },
  { nama: "SATU Dental", src: "/images/sponsor/satu-dental.webp" },
  { nama: "Snapose Photobooth", src: "/images/sponsor/snapose.webp" },
  { nama: "Sparta Barbershop", src: "/images/sponsor/sparta.webp" },
];

export const MEDIA_PARTNER: Logo[] = [];

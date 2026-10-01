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
 */

export type Logo = { nama: string; src: string };

export const SPONSOR: Logo[] = [];

export const MEDIA_PARTNER: Logo[] = [];

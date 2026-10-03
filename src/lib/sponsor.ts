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
 * hitam dijadiin putih. Logo baru = tambahin juga di skrip itu (media
 * partner: convert-media-partner.js → public/images/media-partner/).
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

/**
 * File di public/images/media-partner/, disiapin pakai
 * convert-media-partner.js (cara olahnya sama kayak sponsor).
 * Logo yang dikirim dua versi warna (BIEMS, YOT) → dipakai yang putih.
 */
export const MEDIA_PARTNER: Logo[] = [
  { nama: "AIESEC in BINUS", src: "/images/media-partner/aiesec-binus.webp" },
  { nama: "Arsawati", src: "/images/media-partner/arsawati.webp" },
  { nama: "Attack Music Friends", src: "/images/media-partner/attack-music-friends.webp" },
  { nama: "BIEMS Theater", src: "/images/media-partner/biems.webp" },
  { nama: "Broadcast Polimedia", src: "/images/media-partner/polimedia.webp" },
  { nama: "Concert Event Indonesia", src: "/images/media-partner/concert-event.webp" },
  { nama: "Duta Anti Narkoba UMN", src: "/images/media-partner/duta-anti-narkoba.webp" },
  { nama: "Era FM", src: "/images/media-partner/era-fm.webp" },
  { nama: "Esportsnesia", src: "/images/media-partner/esportsnesia.webp" },
  { nama: "FYP Media", src: "/images/media-partner/fyp-media.webp" },
  { nama: "Indonesian Students Circle", src: "/images/media-partner/isc.webp" },
  { nama: "ISFEST 2026", src: "/images/media-partner/isfest.webp" },
  { nama: "KonserNews", src: "/images/media-partner/konsernews.webp" },
  { nama: "Lions UMN", src: "/images/media-partner/lions-umn.webp" },
  { nama: "Mentoring 2026", src: "/images/media-partner/mentoring.webp" },
  { nama: "Mister & Miss UMN", src: "/images/media-partner/mister-miss-umn.webp" },
  { nama: "Radio Unpad", src: "/images/media-partner/radio-unpad.webp" },
  { nama: "Respira", src: "/images/media-partner/respira.webp" },
  { nama: "Rumor Media", src: "/images/media-partner/rumor.webp" },
  { nama: "UMN Medical Center", src: "/images/media-partner/umn-medical-center.webp" },
  { nama: "UMN Radio", src: "/images/media-partner/umn-radio.webp" },
  { nama: "UMN TV", src: "/images/media-partner/umn-tv.webp" },
  { nama: "UNAS Radio", src: "/images/media-partner/unas-radio.webp" },
  { nama: "Unpar Radio Station", src: "/images/media-partner/unpar-radio.webp" },
  { nama: "UPH Choir", src: "/images/media-partner/uph-choir.webp" },
  { nama: "YOT", src: "/images/media-partner/yot.webp" },
];

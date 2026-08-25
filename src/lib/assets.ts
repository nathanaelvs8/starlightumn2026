/**
 * PETA ASET.
 *
 * Semua path gambar dikumpulin di sini biar kalau tim visual ganti nama
 * file atau kirim versi baru, cukup ubah satu tempat — komponennya
 * nggak perlu disentuh.
 *
 * Aturan penamaan: huruf kecil semua, pakai strip, tanpa spasi.
 * File dari Drive HARUS di-rename dulu sebelum ditaruh di /public,
 * karena nama file berspasi & campur huruf besar sering bikin masalah
 * pas deploy ke Vercel (Linux itu case-sensitive, laptop lu nggak).
 *
 * Lihat tabel rename di README.md.
 *
 * Kalau file belum ada, komponen <Asset> otomatis nampilin kotak
 * placeholder — nggak error, nggak gambar rusak.
 */

export const asset = {
  /* ---------- Dipakai di semua halaman ---------- */
  shared: {
    /** Ornamen pemisah di atas footer. 1920x180 atau 1920x240 */
    connector: "/images/shared/connector.png",
    /** Background footer. 1920x700 */
    footerBg: "/images/shared/footer-bg.png",
    /** Background default halaman selain Home */
    pageBg: "/images/shared/page-bg.png",
  },

  /* ---------- Logo ---------- */
  logo: {
    /** Logo di navbar. ~180x56 */
    nav: "/images/logo/starlight-main.png",
    /** Logo di footer. ~240x72 */
    footer: "/images/logo/starlight-main.png",
    /** Logo utama di hero. ~800x600 */
    main: "/images/logo/starlight-main.png",
    umn: "/images/logo/umn-no-outline.png",
    bem: "/images/logo/bem-no-outline.png",
  },

  /* ---------- Homepage ---------- */
  home: {
    /** Band 1 · Hero. 1920x1080 — BELUM ADA di folder Drive */
    bandHero: "/images/home/band-1-hero.png",
    /** Band 2 · About + Vision/Mission + Starlight 2026. 1920x1500 */
    bandAbout: "/images/home/band-2-about.jpeg",
    /** Band 3 · Concept + Theme/Tagline + Sponsor. 1920x1450 */
    bandConcept: "/images/home/band-3-concept.jpeg",

    /** Judul section — dikirim sebagai gambar, bukan teks */
    judulAboutUs: "/images/home/judul-about-us.png",
    judulVision: "/images/home/judul-vision.png",
    judulMission: "/images/home/judul-mission.png",
    judulConcept: "/images/home/judul-concept.png",
    judulTheme: "/images/home/judul-theme.png",
    judulTagline: "/images/home/judul-tagline.png",

    /** Isi / paragraf — juga gambar */
    isiAboutUs: "/images/home/isi-about-us.png",
    isiConcept: "/images/home/isi-concept.png",
    isiTheme: "/images/home/isi-theme.png",
    isiTagline: "/images/home/isi-tagline.png",

    /** Isi Vision & Mission */
    isiVision: "/images/home/vision.png",
    isiMission: "/images/home/mission.png",

    /** Identitas Starlight 2026 di band 2. ~900x700 */
    identity2026: "/images/home/identity-2026.png",
    /** Ilustrasi concept (concept.png di Drive) */
    conceptArt: "/images/home/concept.png",
  },
  /* ---------- Division ---------- */
  division: {
    /** divisi-1.png ... divisi-13.png di public/images/division/ */
    card: (n: number) => `/images/division/divisi-${n}.png`,
  },
    /* ---------- Mini Gerda ---------- */
  gerda: {
    background: "/images/mini-gerda/background.png",
    arus: "/images/mini-gerda/arus.png",
    panah: "/images/mini-gerda/panah.png",
    /** crest tiap divisi: crest-auradon.png, dst */
    crest: (divisi: string) =>
      `/images/mini-gerda/crest-${divisi.toLowerCase()}.png`,
  },
} as const;

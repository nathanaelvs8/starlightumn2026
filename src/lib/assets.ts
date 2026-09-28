export const asset = {
  shared: {
    separator: "/images/shared/separator.webp",
    separatorFooter: "/images/shared/separator-footer.webp",
    footerBg: "/images/shared/footer-bg.webp",
  },

  /*
   * Logo Starlight ada TIGA ukuran file, bukan satu.
   *
   * Gambarnya sama persis — yang beda cuma resolusinya, disesuaikan
   * sama slot tempat dia dipasang. Dulu ketiganya nunjuk ke file
   * 1920x1920 seberat 506KB, padahal di navbar dia dirender 78px:
   * 24 kali lebih besar dari yang dibutuhin, dan ikut diunduh di
   * SETIAP halaman sebelum apa pun sempat tergambar.
   *
   *   nav    320px →  34KB   slot 78-150px  (cukup sampai layar 2x)
   *   main   800px → 137KB   slot 300-360px (cukup sampai layar 2x)
   *   footer 320px →  34KB   slot maks 44px
   *
   * File 1920px-nya sengaja NGGAK dihapus — masih jadi sumber kalau
   * nanti butuh ukuran lain. Tampilannya sama persis, cuma unduhannya
   * yang jauh lebih ringan.
   */
  logo: {
    nav: "/images/logo/starlight-nav.webp",
    footer: "/images/logo/starlight-nav.webp",
    main: "/images/logo/starlight-hero.webp",
    umn: "/images/logo/umn-no-outline.webp",
    bem: "/images/logo/bem-no-outline.webp",
  },

  home: {
    bandHero: "/images/home/band-1-hero.webp",
    bandAbout: "/images/home/band-2-about.webp",
    bandConcept: "/images/home/band-3-concept.webp",

    judulAboutUs: "/images/home/judul-about-us.webp",
    judulVision: "/images/home/judul-vision.webp",
    judulMission: "/images/home/judul-mission.webp",
    judulConcept: "/images/home/judul-concept.webp",
    judulTheme: "/images/home/judul-theme.webp",
    judulTagline: "/images/home/judul-tagline.webp",

    isiAboutUs: "/images/home/isi-about-us.webp",
    isiConcept: "/images/home/isi-concept.webp",
    isiTheme: "/images/home/isi-theme.webp",
    isiTagline: "/images/home/isi-tagline.webp",

    isiVision: "/images/home/vision.webp",
    isiMission: "/images/home/mission.webp",

    identity2026: "/images/home/identity-2026.webp",
    conceptArt: "/images/home/concept.webp",
  },

  division: {
    card: (name: string) => `/images/division/card-${name.toLowerCase()}.webp`,
    bg: (name: string) => `/images/division/bg-${name.toLowerCase()}.webp`,
    bintang: "/images/division/bintang.webp",
  },

  stages: {
    /** Background halaman daftar /stages. */
    bg: "/images/stages/bg.webp",

    /** Logo berwarna — dipakai di halaman stage-nya sendiri. */
    logo: (slug: string) => `/images/stages/${slug}.webp`,

    /** Logo abu-abu + rantai + gembok — dipakai di daftar /stages. */
    logoLocked: (slug: string) => `/images/stages/${slug}-locked.webp`,

    /**
     * Bingkai emas buat video. Sudah mendatar dan lubang tengahnya
     * tepat 16:9 — lihat convert-stages.js.
     */
    frame: "/images/stages/frame-video.webp",
  },

  gerda: {
    background: "/images/mini-gerda/background.webp",
    arus: "/images/mini-gerda/arus.webp",
    panah: "/images/mini-gerda/panah.webp",
    crest: (divisi: string) =>
      `/images/mini-gerda/crest-${divisi.toLowerCase()}.webp`,
  },
} as const;
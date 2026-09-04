export const asset = {
  shared: {
    separator: "/images/shared/separator.webp",
    footerBg: "/images/shared/footer-bg.webp",
    pageBg: "/images/shared/page-bg.webp",
  },

  logo: {
    nav: "/images/logo/starlight-main.webp",
    footer: "/images/logo/starlight-main.webp",
    main: "/images/logo/starlight-main.webp",
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

  gerda: {
    background: "/images/mini-gerda/background.webp",
    arus: "/images/mini-gerda/arus.webp",
    panah: "/images/mini-gerda/panah.webp",
    crest: (divisi: string) =>
      `/images/mini-gerda/crest-${divisi.toLowerCase()}.webp`,
  },
} as const;
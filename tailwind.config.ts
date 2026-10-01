import type { Config } from "tailwindcss";

/** Warna & radius semua nunjuk ke CSS variable di src/app/tokens.css. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--c-page)",
        band: "var(--c-band)",
        surface: "var(--c-surface)",
        raised: "var(--c-raised)",
        ink: "var(--c-ink)",
        muted: "var(--c-ink-muted)",
        faint: "var(--c-ink-faint)",
        line: "var(--c-line)",
        strong: "var(--c-strong)",
        onstrong: "var(--c-on-strong)",
        footer: "var(--c-footer)",
        "footer-ink": "var(--c-footer-ink)",
        "footer-muted": "var(--c-footer-muted)",

        /*
         * Warna dunia malam. `<alpha-value>` itu tempat Tailwind
         * nyelipin angka transparansi, jadi `bg-night/55` beneran jalan
         * — beda sama `bg-[var(--c-night)]/55` yang `/55`-nya dibuang.
         */
        night: "rgb(var(--c-night-rgb) / <alpha-value>)",
        abyss: "rgb(var(--c-abyss-rgb) / <alpha-value>)",
        ember: "rgb(var(--c-ember-rgb) / <alpha-value>)",
        emas: "rgb(var(--c-emas-rgb) / <alpha-value>)",
      },
      borderRadius: {
        sm: "var(--r-sm)",
        DEFAULT: "var(--r-md)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
        pill: "var(--r-pill)",
      },
      fontFamily: {
        display: "var(--f-display)",
        body: "var(--f-body)",
      },
      maxWidth: { shell: "var(--w-shell)" },
    },
  },
  plugins: [],
};
export default config;

"use client";

import { usePathname } from "next/navigation";
import { Asset } from "@/components/ui/Asset";
import { Container } from "@/components/ui/Container";
import { asset } from "@/lib/assets";
import { copy } from "@/lib/copy";

/* ---------------------------------------------------------------------
   ISI FOOTER — ganti di sini, nggak usah ngoprek layout di bawah.
   --------------------------------------------------------------------- */

/** Alamat, tiap item = satu baris. */
const ADDRESS = [
  "Universitas Multimedia Nusantara",
  "Jl. Scientia Boulevard, Gading Serpong,",
  "Tangerang Banten 15811, Indonesia.",
];

const COPYRIGHT = "\u00a9 Starlight UMN 2026";

/** TODO: ganti nama tim website tahun ini. */
const CREDIT = "Developed and Managed by \u2014";

/* ------------------------------------------------------------------- */

/**
 * Bagian bawah SEMUA halaman: connector dulu, baru footer.
 *
 * Layoutnya satu kolom rata tengah, ngikutin footer Starlight tahun
 * lalu. Beda dari wireframe yang tiga kolom — nggak ada Quick Links dan
 * nggak ada ikon sosial media di sini.
 *
 * CATATAN PENTING soal <Asset>:
 * Jangan bungkus <Asset> pakai div yang nggak punya lebar sendiri.
 * <Asset> pakai lebar 100% dari induknya — kalau induknya juga nunggu
 * lebar dari isinya, hasilnya nol dan gambarnya ilang. Kasih lebar di
 * <Asset>-nya langsung (lewat `size` atau `className`), atau di div
 * pembungkus yang lebarnya jelas.
 */
export function Footer() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <>
            <Separator naik={30} />

      <footer
        className="relative z-10 bg-footer bg-cover bg-bottom bg-no-repeat text-footer-ink lg:bg-[length:100%_auto]"
        style={{ backgroundImage: `url("${asset.shared.footerBg}")` }}
      >
                <Container className="flex flex-col items-center py-32 text-center font-alice sm:py-16">
          {/* Logo — hover-pop dipasang di Asset-nya, bukan di pembungkus */}
          <Asset
            src={asset.logo.footer}
            alt="Starlight UMN 2026"
            size="sm"
            className="hover-pop"
          />

          {/* Tagline — teks, pakai font paragraf (Alice) */}
          <p className="prose-starlight mt-6 max-w-xl text-lg text-footer-ink sm:mt-8 sm:text-xl">
            {copy.tagline}
          </p>

          <Divider />

          {/* Part of */}
          <p className="text-[11px] uppercase tracking-[0.2em] text-footer-ink/80 sm:text-xs">
            Part of
          </p>

          <div className="hover-pop mt-3 flex items-center gap-4 rounded-md bg-white px-4 py-2.5 sm:gap-5 sm:px-5 sm:py-3">
            {/* Lebarnya ditaruh di div pembungkus yang lebarnya jelas */}
            <div className="w-11 sm:w-12">
              <Asset
                src={asset.logo.umn}
                alt="Universitas Multimedia Nusantara"
              />
            </div>
            <div className="w-11 sm:w-12">
              <Asset src={asset.logo.bem} alt="BEM UMN" />
            </div>
          </div>

          {/* Alamat */}
          <address className="mt-7 flex flex-col gap-1 text-xs not-italic leading-relaxed text-footer-ink/90 sm:text-sm">
            {ADDRESS.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>

          <Divider />

          {/* Copyright */}
          <div className="flex flex-col gap-1 text-[11px] text-footer-ink/75 sm:text-xs">
            <span>{COPYRIGHT}</span>
            <span>{CREDIT}</span>
          </div>
        </Container>
      </footer>
    </>
  );
}

function Divider() {
  return (
    <span
      aria-hidden
      className="my-6 h-px w-full max-w-[180px] bg-footer-ink/40 sm:my-8 sm:max-w-[210px]"
    />
  );
}

/**
 * Ornamen di atas footer.
 *
 * Sengaja cuma dirender kalau file gambarnya BENERAN ada. Kalau belum
 * ada, kotak setinggi 64-96px ini bakal jadi jalur putih di antara band
 * terakhir dan footer — jadi mending nggak usah muncul sama sekali,
 * biar band langsung nempel ke footer.
 */
function Separator({ naik = -60 }: { naik?: number }) {
  return (
    <div className="relative z-40 h-0">
      <img
        src={asset.shared.separator}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute left-1/2 max-w-none w-[165%] lg:w-[120%]"
        style={{
          top: `${-naik}px`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
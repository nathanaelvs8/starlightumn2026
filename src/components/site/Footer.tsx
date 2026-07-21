"use client";

import { useEffect, useState } from "react";
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
 */
export function Footer() {
  return (
    <>
      <Connector />

      <footer
        className="bg-footer text-footer-ink"
        style={{
          backgroundImage: `url("${asset.shared.footerBg}")`,
          /* sama kayak Band: lebar pas, tinggi ngikut, nggak dizoom */
          backgroundSize: "100% auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom center",
        }}
      >
        <Container className="flex flex-col items-center py-12 text-center font-alice sm:py-16">
          {/* Logo */}
          <div className="hover-pop">
            <Asset
              src={asset.logo.footer}
              alt="Starlight UMN 2026"
              size="xs"
            />
          </div>


          {/* Tagline — pakai gambar yang sama dengan section Tag Line.
              Isi alt-nya pakai bunyi tagline aslinya biar tetap kebaca
              screen reader & mesin pencari. */}
          {/* Tagline pakai gambar. Alt-nya diisi bunyi taglinenya dari
              copy.ts biar tetap kebaca screen reader & mesin pencari. */}
          <div className="mt-6 w-full sm:mt-8">
            <Asset
              src={asset.home.isiTagline}
              alt={copy.tagline}
              size="2xl"
            />
          </div>

          <Divider />

          {/* Part of */}
          <p className="text-[11px] uppercase tracking-[0.2em] text-footer-ink/80 sm:text-xs">
            Part of
          </p>

          <div className="hover-pop mt-3 flex items-center gap-4 rounded-md bg-white px-4 py-2.5 sm:gap-5 sm:px-5 sm:py-3">
            <Asset
              src={asset.logo.umn}
              alt="Universitas Multimedia Nusantara"
              className="w-11 sm:w-12"
            />
            <Asset
              src={asset.logo.bem}
              alt="BEM UMN"
              className="w-11 sm:w-12"
            />
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
function Connector() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src = asset.shared.connector;
    img.onload = () => setReady(true);
    img.onerror = () => setReady(false);
  }, []);

  if (!ready) return null;

  return (
    <div
      aria-hidden
      className="-mb-px h-16 w-full bg-contain bg-bottom bg-repeat-x sm:h-24"
      style={{ backgroundImage: `url("${asset.shared.connector}")` }}
    />
  );
}

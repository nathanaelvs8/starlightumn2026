import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITUS = "https://www.starlightumn2026.com";
const NAMA = "Starlight UMN 2026";
/* Ini yang tampil di bawah judul di hasil Google & preview link
   WhatsApp/IG. ±150 huruf — lebih panjang dipotong Google. */
const DESKRIPSI =
  "Starlight UMN 2026 — kompetisi bakat mahasiswa di bawah BEM Universitas Multimedia Nusantara. Becoming Unbound: Spark the Magic, Brave to Rise.";

export const metadata: Metadata = {
  metadataBase: new URL(SITUS),
  title: NAMA,
  description: DESKRIPSI,
  /* Ikon dibikin pakai convert-icon.js. Sengaja di public/favicon.ico &
     /images (bukan src/app/icon.png): dua-duanya dikecualikan dari
     middleware, jadi ikonnya tetap kebuka pas situs mode "Segera Hadir". */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/images/logo/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/images/logo/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: NAMA,
    title: NAMA,
    description: DESKRIPSI,
    images: [{ url: "/images/logo/icon.png", width: 512, height: 512, alt: NAMA }],
  },
};

/* Nama situs di hasil Google (baris kecil di atas judul) — tanpa ini
   Google cuma nampilin "starlightumn2026.com". */
const DATA_SITUS = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: NAMA,
  alternateName: ["Starlight UMN", "Starlight"],
  url: `${SITUS}/`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(DATA_SITUS) }}
        />
        {children}
      </body>
    </html>
  );
}

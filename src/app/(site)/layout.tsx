import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PortalPanggung } from "@/components/site/PortalPanggung";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
    `overflow-x-clip` WAJIB di sini.

    Ornamen separator (Footer.tsx & homepage) sengaja dibikin lebih lebar
    dari layar — `w-[165%]` di HP, `w-[120%]` di desktop — biar ujungnya
    nggak kelihatan. Tanpa pemotong, luberannya bikin halaman bisa
    digeser ke samping dan scrollbar horizontal nongol di SEMUA halaman
    (di layar 1920px: lebar dokumen jadi 2096px).

    Harus `clip`, JANGAN `hidden`: `hidden` bikin div ini jadi kotak
    scroll sendiri, dan navbar `sticky` di dalamnya berhenti nempel di
    atas. `clip` cuma motong, nggak bikin kotak scroll. Sumbu vertikal
    tetap `visible`, jadi separator yang nongol ke atas band nggak
    kepotong.
  */
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Portal /stages → halaman panggung. Di sini, bukan di halamannya,
          biar nggak ikut hilang pas pindah halaman. */}
      <PortalPanggung />
    </div>
  );
}
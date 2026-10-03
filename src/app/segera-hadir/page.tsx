
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

/*
  Sengaja NGGAK nyetel judul sendiri — pakai judul & deskripsi situs dari
  src/app/layout.tsx. Pas situs ditutup, halaman ini tampil di alamat "/",
  dan kalau Google lagi mampir, yang kesimpen di hasil pencarian jadi
  "Segera Hadir · ..." (pernah kejadian).
*/

export default function SegeraHadirPage() {
  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <div
        aria-hidden
        className="latar-layar -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandHero}")` }}
      />
      <div aria-hidden className="latar-layar -z-10 bg-[#0a1430]/50" />

      <img
        src={asset.logo.main}
        alt="Starlight UMN 2026"
        draggable={false}
        className="logo-pop w-[240px] sm:w-[320px]"
      />

      <TitleGlow className="mt-8 text-4xl sm:text-5xl">Segera Hadir</TitleGlow>
      <p className="mt-4 max-w-md font-alice text-white/75">
        Website resmi Starlight UMN 2026 sedang dipersiapkan. Nantikan
        informasi selanjutnya melalui kanal resmi kami.
      </p>
    </main>
  );
}
import Link from "next/link";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

export const metadata = { title: "Segera Hadir · Starlight UMN 2026" };

export default function SegeraHadirPage() {
  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandHero}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a1430]/50" />

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

      <Link
        href="/login"
        className="mt-12 font-alice text-xs text-white/40 transition-colors hover:text-white/70"
      >
        Masuk panitia
      </Link>
    </main>
  );
}
import { Container } from "@/components/ui/Container";
import { DivisionCoverflow } from "@/components/site/DivisionCoverflow";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";
import { divisions } from "@/lib/divisions";

export const metadata = {
  title: "Division · Starlight UMN 2026",
};

export default function DivisionPage({
  searchParams,
}: {
  searchParams: { divisi?: string | string[] };
}) {
  /* /division?divisi=enchanted → langsung buka kartu Enchanted (dipakai
     kredit di footer). Nama nggak dikenal / kosong = kartu pertama. */
  const cari = [searchParams.divisi].flat()[0]?.toLowerCase();
  const awal = Math.max(0, divisions.findIndex((d) => d.name.toLowerCase() === cari));

  return (
    <>
      {/* Background fixed — pakai band yang udah ada, sama kayak FAQ */}
      <div
        aria-hidden
        className="latar-layar -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandAbout}")` }}
      />
      <div aria-hidden className="latar-layar -z-10 bg-night/40" />

      <Container className="pb-28 pt-4 sm:pb-40 sm:pt-20 lg:pb-28 lg:pt-2">
        {/* Judul aja, tanpa subtitle — coverflow udah jelas sendiri */}
        <TitleGlow className="text-center text-5xl sm:text-6xl">
          Division
        </TitleGlow>

        <div className="mt-3 sm:mt-12 lg:mt-2">
          <DivisionCoverflow awal={awal} />
        </div>
      </Container>
    </>
  );
}
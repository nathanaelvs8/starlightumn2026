import { Container } from "@/components/ui/Container";
import { DivisionCoverflow } from "@/components/site/DivisionCoverflow";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

export const metadata = {
  title: "Division · Starlight UMN 2026",
};

export default function DivisionPage() {
  return (
    <>
      {/* Background fixed — pakai band yang udah ada, sama kayak FAQ */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandAbout}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a1430]/40" />

      <Container className="py-16 sm:py-20">
        {/* Judul aja, tanpa subtitle — coverflow udah jelas sendiri */}
        <TitleGlow className="text-center text-5xl sm:text-6xl">
          Division
        </TitleGlow>

        <div className="mt-12">
          <DivisionCoverflow />
        </div>
      </Container>
    </>
  );
}
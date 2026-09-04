import { Container } from "@/components/ui/Container";
import { FaqList } from "@/components/site/FaqList";
import { asset } from "@/lib/assets";

export const metadata = {
  title: "Frequently Asked Questions · Starlight UMN 2026",
};

export default function FaqPage() {
  return (
    <>
      {/* Background FIXED — nggak ikut jumlah pertanyaan, jadi nggak ada
          putih & nggak mengecil. Footer naik nutupin pas scroll bawah. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandAbout}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a1430]/40" />

      <Container className="pb-32 pt-16 sm:pb-40 sm:pt-20">
           <h1 className="faq-title text-center font-display text-4xl tracking-wide sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-center font-alice text-white/70">
          Klik pertanyaan untuk buka jawaban
        </p>

        <div className="mt-10">
          <FaqList />
        </div>
      </Container>
    </>
  );
}
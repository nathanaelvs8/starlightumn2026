import { Container } from "@/components/ui/Container";
import { GerdaFlow } from "@/components/site/GerdaFlow";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

export const metadata = { title: "Mini Gerda · Starlight UMN 2026" };

export default function MiniGerdaPage() {
  return (
    <>
      {/* Background full-screen di belakang semua */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url("${asset.gerda.background}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <Container className="pt-12 sm:pt-16">
        <TitleGlow className="text-center text-4xl sm:text-5xl">
          Mini Gerda
        </TitleGlow>
      </Container>

      {/* Panggung full-width, di luar Container biar nggak kebatas lebar */}
      <div className="mt-8">
        <GerdaFlow />
      </div>
    </>
  );
}
import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

export const metadata = { title: "Vote · Starlight UMN 2026" };

export default function VotePage() {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandAbout}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a1430]/40" />

      <Container className="flex min-h-[70svh] flex-col items-center justify-center py-20 text-center">
        <TitleGlow className="text-4xl sm:text-5xl">Vote</TitleGlow>
        <p className="mt-6 max-w-md font-alice text-white/70">
          Voting bakal dibuka pas waktunya. Nantikan!
        </p>
      </Container>
    </>
  );
}
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { VoteBoard } from "@/components/site/VoteBoard";
import { asset } from "@/lib/assets";

export const metadata = { title: "Vote · Starlight UMN 2026" };

export default async function VotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandAbout}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a1430]/40" />

      <Container className="py-16 sm:py-20">
        <VoteBoard />
      </Container>
    </>
  );
}
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { VoteAdmin } from "@/components/site/VoteAdmin";
import { asset } from "@/lib/assets";

export const metadata = { title: "Admin Voting · Starlight UMN 2026" };

export default async function AdminVotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandAbout}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a1430]/60" />

      <Container className="py-16 sm:py-20">
        <div className="flex justify-center">
          <Link
            href="/admin"
            className="font-alice text-sm text-cyan-200/80 transition-colors hover:text-cyan-200"
          >
            ← Balik ke Admin
          </Link>
        </div>

        <TitleGlow className="mt-4 text-center text-4xl sm:text-5xl">
          Voting
        </TitleGlow>
        <p className="mt-3 text-center font-alice text-white/70">
          Kelola tim & buka/tutup voting
        </p>

        <div className="mt-10">
          <VoteAdmin />
        </div>
      </Container>
    </>
  );
}
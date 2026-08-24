import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { GerdaAdmin } from "@/components/site/GerdaAdmin";
import { asset } from "@/lib/assets";

export const metadata = { title: "Admin Mini Gerda · Starlight UMN 2026" };

export default async function AdminGerdaPage() {
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
        <Link
          href="/admin"
          className="font-alice text-sm text-cyan-300 underline"
        >
          ← Balik ke Admin
        </Link>

        <TitleGlow className="mt-4 text-center text-4xl sm:text-5xl">
          Mini Gerda
        </TitleGlow>
        <p className="mt-3 text-center font-alice text-white/70">
          Kelola anggota tiap divisi
        </p>

        <div className="mt-10">
          <GerdaAdmin />
        </div>
      </Container>
    </>
  );
}
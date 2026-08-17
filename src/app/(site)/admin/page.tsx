import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { AdminUsers } from "@/components/site/AdminUsers";
import { asset } from "@/lib/assets";

export const metadata = { title: "Admin · Starlight UMN 2026" };

export default async function AdminPage() {
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
        <TitleGlow className="text-center text-4xl sm:text-5xl">
          Admin
        </TitleGlow>
        <p className="mt-3 text-center font-alice text-white/70">
          Daftar user terdaftar
        </p>

        <div className="mt-10">
          <AdminUsers />
        </div>
      </Container>
    </>
  );
}
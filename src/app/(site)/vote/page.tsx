import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { ButtonLink } from "@/components/ui/Button";
import { VoteBoard } from "@/components/site/VoteBoard";
import { asset } from "@/lib/assets";

export const metadata = { title: "Vote · Starlight UMN 2026" };

export default async function VotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <div
        aria-hidden
        className="latar-layar -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandAbout}")` }}
      />
      <div aria-hidden className="latar-layar -z-10 bg-night/40" />

      <Container className="pb-32 pt-16 sm:pb-40 sm:pt-20">
        {user ? <VoteBoard /> : <PerluMasuk />}
      </Container>
    </>
  );
}

/**
 * Buat yang belum login.
 *
 * Dulu halaman ini langsung nendang ke /login tanpa penjelasan apa pun,
 * dan setelah login orangnya dibawa ke homepage — bukan balik ke sini.
 * Sekarang dijelasin dulu kenapa harus masuk, statusnya ikut ditampilin
 * (biar nggak login cuma buat tau votingnya belum dibuka), dan tombol
 * Masuk-nya bawa `?next=/vote` supaya habis login langsung balik ke sini.
 */
async function PerluMasuk() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vote_settings")
    .select("is_open, is_finished")
    .eq("id", 1)
    .single();

  const keterangan = data?.is_finished
    ? "Voting telah selesai. Silakan masuk untuk melihat hasil akhir."
    : data?.is_open
      ? "Voting sedang dibuka. Silakan masuk ke akun Anda untuk memberikan suara."
      : "Voting belum dibuka. Nantikan informasi selanjutnya melalui kanal resmi Starlight UMN 2026.";

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center text-center">
      <TitleGlow className="text-4xl sm:text-5xl">
        {data?.is_finished ? "Voting Selesai" : "Vote"}
      </TitleGlow>
      <p className="mt-6 max-w-md font-alice text-white/80">{keterangan}</p>
      <p className="mt-3 max-w-md font-alice text-sm text-white/60">
        Voting hanya dapat dilakukan oleh pengguna yang telah memiliki akun.
        Satu akun dapat memberikan satu suara.
      </p>
      <div className="mt-8">
        <ButtonLink href="/login?next=/vote">Masuk / Daftar</ButtonLink>
      </div>
    </div>
  );
}

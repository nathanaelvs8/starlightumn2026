import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { ButtonLink } from "@/components/ui/Button";
import { VoteBoard } from "@/components/site/VoteBoard";
import { asset } from "@/lib/assets";
import { formatWaktuTutup, statusVoting } from "@/lib/statusVoting";
import { sampulTim } from "@/lib/videoTim";

type Props = { searchParams: { tim?: string | string[] } };

const JUDUL = "Vote · Starlight UMN 2026";

/** `?tim=<id>` dari tautan "Bagikan" di detail tim — cuma yang bentuknya wajar. */
function idTim(searchParams: Props["searchParams"]): string | null {
  const t = searchParams.tim;
  return typeof t === "string" && /^[\w-]{1,64}$/.test(t) ? t : null;
}

/** Tim di tautan itu (nama & gambar). Tabel tim memang publik. */
async function ambilTim(id: string | null) {
  if (!id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("vote_teams").select("*").eq("id", id).maybeSingle();
  return data;
}

/**
 * Tautan tim yang dibagikan ke WhatsApp / IG → pratinjaunya nampilin
 * nama & sampul tim itu, bukan cuma logo situs.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const tim = await ambilTim(idTim(searchParams));
  if (!tim) return { title: JUDUL };
  const judul = `Vote ${tim.name} · Starlight UMN 2026`;
  const deskripsi = `Dukung ${tim.name} di voting Starlight UMN 2026.`;
  const gambar = sampulTim(tim);
  return {
    title: judul,
    description: deskripsi,
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: "Starlight UMN 2026",
      url: `/vote?tim=${encodeURIComponent(tim.id)}`,
      title: judul,
      description: deskripsi,
      ...(gambar && { images: [{ url: gambar, alt: tim.name }] }),
    },
  };
}

export default async function VotePage({ searchParams }: Props) {
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
        {user ? <VoteBoard /> : <PerluMasuk idTim={idTim(searchParams)} />}
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
 * Masuk-nya bawa `?next=/vote` supaya habis login langsung balik ke sini
 * — termasuk ke detail tim kalau datangnya dari tautan tim yang dibagikan.
 */
async function PerluMasuk({ idTim }: { idTim: string | null }) {
  const supabase = await createClient();
  const [{ data }, tim] = await Promise.all([
    // `*`: kolom waktu tutup baru ada setelah SQL setelan voting dijalankan.
    supabase.from("vote_settings").select("*").eq("id", 1).single(),
    ambilTim(idTim),
  ]);
  const status = statusVoting(data);

  const keterangan =
    status === "selesai"
      ? "Voting telah selesai. Terima kasih atas partisipasi Anda. Hasil resmi diumumkan melalui kanal resmi Starlight UMN 2026."
      : status === "lewat"
        ? `Voting telah ditutup${data?.voting_ditutup_pada ? ` ${formatWaktuTutup(data.voting_ditutup_pada)}` : ""}. Hasil akan diumumkan melalui kanal resmi Starlight UMN 2026.`
        : status === "buka"
          ? tim
            ? `Voting sedang dibuka. Silakan masuk ke akun Anda untuk melihat dan memilih ${tim.name}.`
            : "Voting sedang dibuka. Silakan masuk ke akun Anda untuk memberikan suara."
          : "Voting belum dibuka. Nantikan informasi selanjutnya melalui kanal resmi Starlight UMN 2026.";

  const tujuan = tim ? `/vote?tim=${encodeURIComponent(tim.id)}` : "/vote";

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center text-center">
      <TitleGlow className="text-4xl sm:text-5xl">
        {status === "selesai" ? "Voting Selesai" : "Vote"}
      </TitleGlow>
      <p className="mt-6 max-w-md font-alice text-white/80">{keterangan}</p>
      <p className="mt-3 max-w-md font-alice text-sm text-white/60">
        Voting hanya dapat dilakukan oleh pengguna yang telah memiliki akun.
        Satu akun dapat memberikan satu suara.
      </p>
      <div className="mt-8">
        <ButtonLink href={`/login?next=${encodeURIComponent(tujuan)}`}>Masuk / Daftar</ButtonLink>
      </div>
    </div>
  );
}

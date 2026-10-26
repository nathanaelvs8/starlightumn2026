import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Setelan voting (status, waktu tutup, jumlah suara kelihatan/nggak).
 * Aturan statusnya ada di src/lib/statusVoting.ts.
 *
 * Waktu tutup & saklar jumlah suara, plus privasi tabel `votes`, butuh SQL
 * ini — jalankan SEKALI lewat SQL Editor Supabase (aman diulang):
 *
 *   -- 1. Setelan baru
 *   alter table public.vote_settings
 *     add column if not exists tampilkan_suara boolean not null default true,
 *     add column if not exists voting_ditutup_pada timestamptz;
 *
 *   -- 2. "Voting lagi terbuka?" versi database (dipakai aturan di bawah)
 *   create or replace function public.voting_terbuka() returns boolean
 *   language sql stable security definer set search_path = public as $$
 *     select coalesce((
 *       select is_open and not is_finished
 *         and (voting_ditutup_pada is null or now() < voting_ditutup_pada)
 *       from public.vote_settings where id = 1), false)
 *   $$;
 *
 *   -- 3. Privasi suara: tiap akun cuma bisa baca / isi / ganti suaranya
 *   --    SENDIRI, dan cuma selama voting terbuka. Dulu tabel ini bisa
 *   --    dibaca siapa aja, bahkan tanpa login.
 *   alter table public.votes enable row level security;
 *
 *   drop policy if exists "Suara: baca milik sendiri" on public.votes;
 *   create policy "Suara: baca milik sendiri" on public.votes
 *     for select to authenticated using (user_id = auth.uid());
 *   drop policy if exists "Suara: isi milik sendiri" on public.votes;
 *   create policy "Suara: isi milik sendiri" on public.votes
 *     for insert to authenticated with check (user_id = auth.uid());
 *   drop policy if exists "Suara: ganti milik sendiri" on public.votes;
 *   create policy "Suara: ganti milik sendiri" on public.votes
 *     for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
 *
 *   -- Pembatas ("restrictive"): berlaku DI ATAS izin lama apa pun yang
 *   -- mungkin masih ada di tabel ini, jadi nggak perlu tau nama-namanya.
 *   drop policy if exists "Suara: pembatas baca" on public.votes;
 *   create policy "Suara: pembatas baca" on public.votes as restrictive
 *     for select to public using (user_id = auth.uid());
 *   drop policy if exists "Suara: pembatas isi" on public.votes;
 *   create policy "Suara: pembatas isi" on public.votes as restrictive
 *     for insert to public with check (user_id = auth.uid() and public.voting_terbuka());
 *   drop policy if exists "Suara: pembatas ganti" on public.votes;
 *   create policy "Suara: pembatas ganti" on public.votes as restrictive
 *     for update to public using (user_id = auth.uid())
 *     with check (user_id = auth.uid() and public.voting_terbuka());
 *   drop policy if exists "Suara: pembatas hapus" on public.votes;
 *   create policy "Suara: pembatas hapus" on public.votes as restrictive
 *     for delete to public using (user_id = auth.uid() and public.voting_terbuka());
 *
 * Jumlah suara & daftar pemilih di admin tetap jalan: dihitung server
 * pakai kunci service role (src/lib/suara.ts), yang nggak kena aturan ini.
 */

/** Kolom setelan baru belum ada → admin diminta menjalankan SQL di atas. */
const PESAN_SQL =
  "Setelan ini belum tersedia di database. Jalankan SQL yang tercantum di src/app/api/admin/vote-settings/route.ts pada SQL Editor Supabase.";

export async function GET() {
  const supabase = await createClient();
  // `*`: kolom setelan baru belum tentu ada sebelum SQL dijalankan.
  const { data } = await supabase.from("vote_settings").select("*").eq("id", 1).single();
  return NextResponse.json({
    is_open: !!data?.is_open,
    is_finished: !!data?.is_finished,
    tampilkan_suara: data?.tampilkan_suara !== false,
    voting_ditutup_pada: data?.voting_ditutup_pada ?? null,
    // SQL setelan baru udah dijalankan?
    siap: !!data && "tampilkan_suara" in data && "voting_ditutup_pada" in data,
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Anda belum masuk. Silakan masuk terlebih dahulu." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Akses ditolak. Fitur ini khusus admin." }, { status: 403 });

  const body = await req.json();
  const patch: Record<string, boolean | string | null> = {};
  if (typeof body.is_open === "boolean") patch.is_open = body.is_open;
  if (typeof body.is_finished === "boolean")
    patch.is_finished = body.is_finished;
  if (typeof body.tampilkan_suara === "boolean") patch.tampilkan_suara = body.tampilkan_suara;
  if (body.voting_ditutup_pada !== undefined) {
    if (body.voting_ditutup_pada === null) patch.voting_ditutup_pada = null;
    else if (typeof body.voting_ditutup_pada === "string" && Number.isFinite(Date.parse(body.voting_ditutup_pada)))
      patch.voting_ditutup_pada = new Date(body.voting_ditutup_pada).toISOString();
    else return NextResponse.json({ error: "Waktu tutup voting tidak valid." }, { status: 400 });
  }

  /*
    "Dibuka" dan "Selesai" nggak boleh nyala barengan — dulu pernah
    kejadian, dan pengunjung lihat "Voting Selesai" padahal voting belum
    dimulai. Nyalain salah satu otomatis matiin yang lain.
  */
  if (patch.is_open && patch.is_finished)
    return NextResponse.json(
      { error: "Voting tidak dapat dibuka dan selesai sekaligus." },
      { status: 400 },
    );
  if (patch.is_finished) patch.is_open = false;
  if (patch.is_open) patch.is_finished = false;

  const { error } = await supabase
    .from("vote_settings")
    .update(patch)
    .eq("id", 1);
  if (error) {
    const kolomBaru = /tampilkan_suara|voting_ditutup_pada/.test(error.message);
    return NextResponse.json({ error: kolomBaru ? PESAN_SQL : error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

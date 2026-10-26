import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function pastikanAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Anda belum masuk. Silakan masuk terlebih dahulu.", status: 401 as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return { error: "Akses ditolak. Fitur ini khusus admin.", status: 403 as const };

  return { ok: true as const };
}

/**
 * Ambil SEMUA baris, sedikit-sedikit. Supabase cuma ngirim maks. 1.000
 * baris per permintaan — tanpa ini, pemilih ke-1.001 dst. nggak muncul.
 */
async function ambilSemua<T>(
  ambil: (dari: number, sampai: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const UKURAN = 1000;
  const hasil: T[] = [];
  for (let dari = 0; ; dari += UKURAN) {
    const { data, error } = await ambil(dari, dari + UKURAN - 1);
    if (error) throw new Error(error.message);
    hasil.push(...(data ?? []));
    if (!data || data.length < UKURAN) return hasil;
  }
}

export async function GET() {
  const cek = await pastikanAdmin();
  if ("error" in cek)
    return NextResponse.json({ error: cek.error }, { status: cek.status });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let votes: { user_id: string; team_id: string; created_at: string }[];
  let profiles: { id: string; full_name: string | null }[];
  try {
    [votes, profiles] = await Promise.all([
      ambilSemua<{ user_id: string; team_id: string; created_at: string }>((a, b) =>
        admin.from("votes").select("user_id, team_id, created_at").order("created_at", { ascending: true }).range(a, b),
      ),
      ambilSemua<{ id: string; full_name: string | null }>((a, b) =>
        admin.from("profiles").select("id, full_name").order("id").range(a, b),
      ),
    ]);
  } catch (e) {
    console.error("[vote-voters]", e);
    return NextResponse.json({ error: "Daftar pemilih gagal dimuat." }, { status: 500 });
  }
  const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));

  /* listUsers() tanpa opsi cuma ngasih 50 akun pertama — sisanya dulu
     tampil "—" di kolom email. Diambil per halaman sampai habis. */
  const emailById = new Map<string, string | undefined>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    data.users.forEach((u) => emailById.set(u.id, u.email));
    if (data.users.length < 1000) break;
  }

  // kelompokin pemilih per team_id
  const voters: Record<string, { user_id: string; name: string; email: string }[]> = {};
  for (const v of votes) {
    (voters[v.team_id] ??= []).push({
      user_id: v.user_id,
      name: nameById.get(v.user_id) ?? "—",
      email: emailById.get(v.user_id) ?? "—",
    });
  }

  return NextResponse.json({ voters });
}

export async function DELETE(req: Request) {
  const cek = await pastikanAdmin();
  if ("error" in cek)
    return NextResponse.json({ error: cek.error }, { status: cek.status });

  const { user_id } = await req.json();
  if (!user_id)
    return NextResponse.json({ error: "ID pengguna wajib diisi." }, { status: 400 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await admin.from("votes").delete().eq("user_id", user_id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
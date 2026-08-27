import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function pastikanAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, supabase: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin")
    return { ok: false, status: 403, supabase: null };
  return { ok: true, status: 200, supabase };
}

// AMBIL semua tim + jumlah vote-nya
export async function GET() {
  const supabase = await createClient();
  const { data: teams, error } = await supabase
    .from("vote_teams")
    .select("*")
    .order("created_at");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // hitung vote per tim
  const { data: votes } = await supabase.from("votes").select("team_id");
  const jumlah: Record<string, number> = {};
  (votes ?? []).forEach((v) => {
    jumlah[v.team_id] = (jumlah[v.team_id] ?? 0) + 1;
  });

  const hasil = (teams ?? []).map((t) => ({
    ...t,
    vote_count: jumlah[t.id] ?? 0,
  }));
  return NextResponse.json({ teams: hasil });
}

// TAMBAH tim
export async function POST(request: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Bukan admin" }, { status: guard.status });

  const { name, photo_url } = await request.json();
  if (!name)
    return NextResponse.json({ error: "Nama tim wajib" }, { status: 400 });

  const { error } = await guard.supabase
    .from("vote_teams")
    .insert({ name, photo_url: photo_url ?? null });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// UBAH tim
export async function PATCH(request: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Bukan admin" }, { status: guard.status });

  const { id, name, photo_url } = await request.json();
  if (!id) return NextResponse.json({ error: "ID kurang" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;
  if (photo_url !== undefined) patch.photo_url = photo_url;

  const { error } = await guard.supabase
    .from("vote_teams")
    .update(patch)
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// HAPUS tim
export async function DELETE(request: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Bukan admin" }, { status: guard.status });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID kurang" }, { status: 400 });

  const { error } = await guard.supabase
    .from("vote_teams")
    .delete()
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Cek: yang manggil ini admin nggak?
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

// AMBIL semua anggota
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mini_gerda_members")
    .select("*")
    .order("division")
    .order("created_at");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

// TAMBAH anggota
export async function POST(request: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Bukan admin" }, { status: guard.status });

  const body = await request.json();
  const { division, full_name, nim } = body;
  if (!division || !full_name || !nim)
    return NextResponse.json({ error: "Data kurang lengkap" }, { status: 400 });

  const { error } = await guard.supabase
    .from("mini_gerda_members")
    .insert({ division, full_name, nim });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// UBAH anggota
export async function PATCH(request: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Bukan admin" }, { status: guard.status });

  const body = await request.json();
  const { id, division, full_name, nim } = body;
  if (!id)
    return NextResponse.json({ error: "ID kurang" }, { status: 400 });

  const { error } = await guard.supabase
    .from("mini_gerda_members")
    .update({ division, full_name, nim })
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// HAPUS anggota
export async function DELETE(request: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Bukan admin" }, { status: guard.status });

  const { id } = await request.json();
  if (!id)
    return NextResponse.json({ error: "ID kurang" }, { status: 400 });

  const { error } = await guard.supabase
    .from("mini_gerda_members")
    .delete()
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function pastikanAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Belum login", status: 401 as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return { error: "Bukan admin", status: 403 as const };

  return { ok: true as const };
}

export async function GET() {
  const cek = await pastikanAdmin();
  if ("error" in cek)
    return NextResponse.json({ error: cek.error }, { status: cek.status });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: votes, error } = await admin
    .from("votes")
    .select("user_id, team_id, created_at")
    .order("created_at", { ascending: true });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name");
  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const { data: authList } = await admin.auth.admin.listUsers();
  const emailById = new Map(
    (authList?.users ?? []).map((u) => [u.id, u.email]),
  );

  // kelompokin pemilih per team_id
  const voters: Record<string, { user_id: string; name: string; email: string }[]> = {};
  for (const v of votes ?? []) {
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
    return NextResponse.json({ error: "user_id wajib" }, { status: 400 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await admin.from("votes").delete().eq("user_id", user_id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
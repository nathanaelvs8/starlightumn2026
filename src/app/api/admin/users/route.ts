import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  // 1. Pastikan yang minta ini admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Bukan admin" }, { status: 403 });
  }

  // 2. Baru ambil semua user pakai service role (cuma di server)
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // gabungin email dari auth
  const { data: authList } = await admin.auth.admin.listUsers();
  const emailById = new Map(
    (authList?.users ?? []).map((u) => [u.id, u.email]),
  );

  const users = (profiles ?? []).map((p) => ({
    ...p,
    email: emailById.get(p.id) ?? "—",
  }));

  return NextResponse.json({ users });
}
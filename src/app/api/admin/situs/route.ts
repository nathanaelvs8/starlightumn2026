import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vote_settings")
    .select("situs_terbuka")
    .eq("id", 1)
    .single();
  return NextResponse.json({ siap: !error, terbuka: !!data?.situs_terbuka });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Anda belum masuk." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const body = await req.json();
  if (typeof body.terbuka !== "boolean")
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const { error } = await supabase
    .from("vote_settings")
    .update({ situs_terbuka: body.terbuka })
    .eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
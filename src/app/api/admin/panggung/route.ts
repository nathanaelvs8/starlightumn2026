import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stages } from "@/lib/stages";

/**
 * Buka / segel panggung — saklar di /admin.
 *
 * Disimpan di `vote_settings.panggung_terbuka` (baris id = 1): daftar slug
 * panggung yang udah dibuka. Kolomnya harus ditambahin dulu SEKALI lewat
 * SQL Editor Supabase (default-nya Lonielle udah kebuka, sama kayak
 * sekarang):
 *
 *   alter table vote_settings
 *     add column if not exists panggung_terbuka text[] not null default '{lonielle}';
 *
 * Selama kolomnya belum ada, GET balikin `siap: false` dan situsnya
 * pakai `terbuka` bawaan di src/lib/stages.ts.
 */

const SLUG_SAH = new Set(stages.map((s) => s.slug));

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vote_settings")
    .select("panggung_terbuka")
    .eq("id", 1)
    .single();
  return NextResponse.json({
    siap: !error && Array.isArray(data?.panggung_terbuka),
    terbuka: Array.isArray(data?.panggung_terbuka) ? data.panggung_terbuka : [],
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Anda belum masuk. Silakan masuk terlebih dahulu." },
      { status: 401 },
    );

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json(
      { error: "Akses ditolak. Fitur ini khusus admin." },
      { status: 403 },
    );

  const body = await req.json().catch(() => ({}));
  const terbuka: unknown = body.terbuka;
  if (
    !Array.isArray(terbuka) ||
    !terbuka.every((s) => typeof s === "string" && SLUG_SAH.has(s))
  )
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const { error } = await supabase
    .from("vote_settings")
    .update({ panggung_terbuka: Array.from(new Set(terbuka)) })
    .eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

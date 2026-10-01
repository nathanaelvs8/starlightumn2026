import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Setelan tombol "Registrasi Penonton" di homepage.
 *
 * Disimpan di tabel `vote_settings` (baris id = 1) — kolom
 * `registrasi_aktif` & `registrasi_url`. Numpang di tabel itu biar aturan
 * aksesnya (semua boleh baca, admin boleh ubah) langsung kepakai.
 *
 * Kolomnya harus ditambahin dulu SEKALI lewat SQL Editor Supabase:
 *
 *   alter table vote_settings
 *     add column if not exists registrasi_aktif boolean not null default false,
 *     add column if not exists registrasi_url text;
 *
 * Selama kolomnya belum ada, GET balikin `siap: false` dan tombolnya
 * nggak pernah muncul di homepage.
 */

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vote_settings")
    .select("registrasi_aktif, registrasi_url")
    .eq("id", 1)
    .single();
  return NextResponse.json({
    siap: !error,
    aktif: !!data?.registrasi_aktif,
    url: data?.registrasi_url ?? "",
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Anda belum masuk. Silakan masuk terlebih dahulu." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Akses ditolak. Fitur ini khusus admin." }, { status: 403 });

  const body = await req.json();
  const patch: { registrasi_aktif?: boolean; registrasi_url?: string | null } = {};
  if (typeof body.aktif === "boolean") patch.registrasi_aktif = body.aktif;
  if (typeof body.url === "string") {
    const url = body.url.trim();
    if (url && !/^https?:\/\/\S+$/i.test(url))
      return NextResponse.json(
        { error: "Tautan harus diawali dengan http:// atau https://." },
        { status: 400 },
      );
    patch.registrasi_url = url || null;
  }

  const { error } = await supabase.from("vote_settings").update(patch).eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vote_settings")
    .select("is_open, is_finished")
    .eq("id", 1)
    .single();
  return NextResponse.json({
    is_open: !!data?.is_open,
    is_finished: !!data?.is_finished,
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
  const patch: Record<string, boolean> = {};
  if (typeof body.is_open === "boolean") patch.is_open = body.is_open;
  if (typeof body.is_finished === "boolean")
    patch.is_finished = body.is_finished;

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
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
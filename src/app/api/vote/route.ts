import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const [teamsRes, votesRes, settingsRes] = await Promise.all([
    supabase.from("vote_teams").select("id, name, photo_url").order("created_at"),
    supabase.from("votes").select("team_id, user_id"),
    supabase.from("vote_settings").select("is_open, is_finished").eq("id", 1).single(),
  ]);

  const votes = votesRes.data ?? [];
  const teams = (teamsRes.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    photo_url: t.photo_url,
    vote_count: votes.filter((v) => v.team_id === t.id).length,
  }));

  const myVote = votes.find((v) => v.user_id === user.id)?.team_id ?? null;

  return NextResponse.json({
    teams,
    is_open: !!settingsRes.data?.is_open,
    is_finished: !!settingsRes.data?.is_finished,
    my_team_id: myVote,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  // pastikan voting masih buka
  const { data: settings } = await supabase
    .from("vote_settings")
    .select("is_open, is_finished")
    .eq("id", 1)
    .single();
  if (settings?.is_finished || !settings?.is_open) {
    return NextResponse.json(
      { error: "Voting sudah ditutup." },
      { status: 403 },
    );
  }

  const { team_id } = await req.json();
  if (!team_id) {
    return NextResponse.json({ error: "team_id wajib" }, { status: 400 });
  }

  // upsert: satu baris per user (user_id primary key), jadi ganti pilihan
  // = timpa baris yang sama
  const { error } = await supabase
    .from("votes")
    .upsert({ user_id: user.id, team_id }, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
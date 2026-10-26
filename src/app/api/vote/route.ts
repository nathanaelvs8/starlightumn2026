import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hitungSuara } from "@/lib/suara";
import { statusVoting, suaraTerlihat } from "@/lib/statusVoting";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Anda belum masuk. Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const [teamsRes, settingsRes, pilihanRes] = await Promise.all([
    // `*`, bukan daftar kolom: video_url & deskripsi baru ada setelah SQL di
    // src/app/api/admin/vote-teams/route.ts dijalankan — kalau disebut
    // namanya sebelum itu, seluruh daftar tim gagal dimuat.
    supabase.from("vote_teams").select("*").order("created_at"),
    // `*` juga: waktu tutup & saklar jumlah suara baru ada setelah SQL di
    // src/app/api/admin/vote-settings/route.ts dijalankan.
    supabase.from("vote_settings").select("*").eq("id", 1).single(),
    // Pilihan sendiri dicari langsung, bukan dicari di antara semua suara.
    supabase.from("votes").select("team_id").eq("user_id", user.id).maybeSingle(),
  ]);

  /*
    Galat database dilaporkan sebagai galat. Dulu semuanya diganti nilai
    kosong: tim gagal dimuat = "belum ada tim", setelan gagal dimuat =
    "voting belum dibuka" — pengunjung dibohongi, dan admin nggak tau.
  */
  const galat = teamsRes.error ?? settingsRes.error ?? pilihanRes.error;
  if (galat) {
    console.error("[vote] gagal memuat:", galat.message);
    return NextResponse.json({ error: "Data voting gagal dimuat. Silakan coba lagi." }, { status: 500 });
  }

  const setelan = settingsRes.data;
  const status = statusVoting(setelan);
  /*
    Jumlah suara disembunyikan admin → angkanya NGGAK dikirim sama sekali
    (bukan cuma nggak ditampilkan), jadi nggak bisa diintip dari tab
    Network. Berlaku juga setelah voting selesai.
  */
  const kirimJumlah = suaraTerlihat(setelan);

  let jumlah: Record<string, number> = {};
  if (kirimJumlah)
    try {
      jumlah = await hitungSuara((teamsRes.data ?? []).map((t) => t.id));
    } catch (e) {
      console.error("[vote] gagal menghitung suara:", e);
      return NextResponse.json({ error: "Data voting gagal dimuat. Silakan coba lagi." }, { status: 500 });
    }

  const teams = (teamsRes.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    photo_url: t.photo_url,
    video_url: t.video_url ?? null,
    deskripsi: t.deskripsi ?? null,
    vote_count: kirimJumlah ? (jumlah[t.id] ?? 0) : null,
  }));

  return NextResponse.json({
    teams,
    status,
    ditutup_pada: setelan?.voting_ditutup_pada ?? null,
    my_team_id: pilihanRes.data?.team_id ?? null,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Anda belum masuk. Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  // Pastikan voting masih buka — termasuk waktu tutupnya. (Database juga
  // menjaga aturan yang sama, jadi suara nggak bisa masuk lewat jalan lain.)
  const { data: settings } = await supabase.from("vote_settings").select("*").eq("id", 1).single();
  const status = statusVoting(settings);
  if (status !== "buka") {
    return NextResponse.json(
      { error: status === "belum" ? "Voting belum dibuka." : "Voting sudah ditutup.", status },
      { status: 403 },
    );
  }

  const { team_id } = await req.json();
  if (!team_id) {
    return NextResponse.json(
      { error: "Tim yang dipilih tidak terbaca. Silakan muat ulang halaman." },
      { status: 400 },
    );
  }

  // upsert: satu baris per user (user_id primary key), jadi ganti pilihan
  // = timpa baris yang sama
  const { error } = await supabase
    .from("votes")
    .upsert({ user_id: user.id, team_id }, { onConflict: "user_id" });

  if (error) {
    /*
      JANGAN kirim `error.message` ke pengguna.

      Itu teks mentah dari Postgres, bahasa Inggris, dan isinya nama
      constraint — misalnya "duplicate key value violates unique
      constraint votes_pkey". Mahasiswa yang lagi milih jagoannya
      nggak bisa berbuat apa-apa sama kalimat itu, dan dia juga nggak
      perlu tau nama tabel kita.

      Pesan aslinya tetap dicatat di log server biar masih bisa
      ditelusuri kalau ada yang lapor.
    */
    console.error("[vote] gagal simpan:", error.message);
    return NextResponse.json(
      { error: "Suara Anda gagal tersimpan. Silakan coba beberapa saat lagi." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
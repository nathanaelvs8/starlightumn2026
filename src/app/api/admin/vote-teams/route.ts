import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { fotoUrlSah, videoUrlSah } from "@/lib/videoTim";
import { hitungSuara } from "@/lib/suara";

/**
 * Tim voting (khusus admin). Pengunjung ngambil daftar tim lewat /api/vote.
 *
 * Video & keterangan tim butuh kolom dan tempat penyimpanan baru. Jalankan
 * SEKALI lewat SQL Editor Supabase:
 *
 *   -- 1. Kolom baru di tabel tim voting
 *   alter table vote_teams
 *     add column if not exists video_url text,
 *     add column if not exists deskripsi text;
 *
 *   -- 2. Tempat penyimpanan video (publik: semua orang bisa menonton).
 *   --    Batas 50 MB & cuma MP4/MOV juga dijaga Supabase sendiri, bukan
 *   --    cuma form admin.
 *   insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
 *   values ('team-videos', 'team-videos', true, 52428800, array['video/mp4', 'video/quicktime'])
 *   on conflict (id) do update
 *     set file_size_limit = excluded.file_size_limit,
 *         allowed_mime_types = excluded.allowed_mime_types;
 *
 *   -- 3. Cuma admin yang boleh mengunggah & menghapus video
 *   create policy "Admin unggah video tim" on storage.objects
 *     for insert to authenticated
 *     with check (bucket_id = 'team-videos' and exists (
 *       select 1 from public.profiles where id = auth.uid() and role = 'admin'));
 *   create policy "Admin lihat video tim" on storage.objects
 *     for select to authenticated
 *     using (bucket_id = 'team-videos' and exists (
 *       select 1 from public.profiles where id = auth.uid() and role = 'admin'));
 *   create policy "Admin hapus video tim" on storage.objects
 *     for delete to authenticated
 *     using (bucket_id = 'team-videos' and exists (
 *       select 1 from public.profiles where id = auth.uid() and role = 'admin'));
 *
 * Selama kolomnya belum ada, GET balikin `siap: false` — panel admin
 * nampilin peringatan, dan tim tetap bisa ditambah tanpa video.
 */

const MAKS_NAMA = 80;
const MAKS_DESKRIPSI = 600;

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

/**
 * Isi tim dari body permintaan → kolom yang mau disimpan, atau pesan
 * galat. Kolom yang nggak dikirim nggak ikut disentuh — jadi sebelum SQL
 * di atas dijalankan, menambah/mengubah tim tanpa video tetap jalan.
 */
function bacaIsi(
  body: Record<string, unknown>,
  wajibNama: boolean,
): { isi?: Record<string, unknown>; galat?: string } {
  const isi: Record<string, unknown> = {};

  if (body.name !== undefined || wajibNama) {
    const nama = typeof body.name === "string" ? body.name.trim() : "";
    if (!nama) return { galat: "Nama tim wajib diisi." };
    if (nama.length > MAKS_NAMA) return { galat: `Nama tim maksimal ${MAKS_NAMA} karakter.` };
    isi.name = nama;
  }

  if (body.photo_url !== undefined) {
    const f = typeof body.photo_url === "string" && body.photo_url.trim() ? body.photo_url.trim() : null;
    if (!fotoUrlSah(f, process.env.NEXT_PUBLIC_SUPABASE_URL))
      return { galat: "Gambar sampul tidak valid. Unggah ulang gambarnya." };
    isi.photo_url = f;
  }

  if (body.deskripsi !== undefined) {
    const d = typeof body.deskripsi === "string" ? body.deskripsi.trim() : "";
    if (d.length > MAKS_DESKRIPSI)
      return { galat: `Keterangan maksimal ${MAKS_DESKRIPSI} karakter.` };
    isi.deskripsi = d || null;
  }

  if (body.video_url !== undefined) {
    const v = typeof body.video_url === "string" && body.video_url.trim() ? body.video_url.trim() : null;
    if (!videoUrlSah(v, process.env.NEXT_PUBLIC_SUPABASE_URL))
      return { galat: "Link video tidak dikenali. Gunakan link YouTube atau Instagram, atau unggah file video." };
    isi.video_url = v;
  }

  return { isi };
}

/** Pesan galat database yang bisa dimengerti admin. */
function pesanGalat(pesan: string) {
  if (/video_url|deskripsi/.test(pesan) && /column|schema cache/i.test(pesan))
    return "Kolom video belum ada di database. Jalankan SQL yang tercantum di src/app/api/admin/vote-teams/route.ts pada SQL Editor Supabase.";
  console.error("[vote-teams]", pesan);
  return "Data tim gagal disimpan. Silakan coba lagi.";
}

// AMBIL semua tim + jumlah vote-nya (khusus admin: jumlah suara bisa aja
// lagi disembunyikan dari pengunjung — lihat /api/vote)
export async function GET() {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Akses ditolak. Fitur ini khusus admin." }, { status: guard.status });
  const supabase = guard.supabase;
  const [timRes, cekKolom] = await Promise.all([
    supabase.from("vote_teams").select("*").order("created_at"),
    supabase.from("vote_teams").select("video_url, deskripsi").limit(1),
  ]);
  if (timRes.error)
    return NextResponse.json({ error: timRes.error.message }, { status: 500 });

  // Hitung di database, bukan ambil semua baris (lihat src/lib/suara.ts).
  let jumlah: Record<string, number>;
  try {
    jumlah = await hitungSuara((timRes.data ?? []).map((t) => t.id));
  } catch (e) {
    console.error("[vote-teams] gagal menghitung suara:", e);
    return NextResponse.json({ error: "Jumlah suara gagal dimuat." }, { status: 500 });
  }

  const hasil = (timRes.data ?? []).map((t) => ({
    ...t,
    vote_count: jumlah[t.id] ?? 0,
  }));
  return NextResponse.json({ teams: hasil, siap: !cekKolom.error });
}

// TAMBAH tim
export async function POST(request: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Akses ditolak. Fitur ini khusus admin." }, { status: guard.status });

  const body = await request.json().catch(() => ({}));
  const { isi, galat } = bacaIsi(body, true);
  if (galat) return NextResponse.json({ error: galat }, { status: 400 });

  const { error } = await guard.supabase.from("vote_teams").insert(isi!);
  if (error) return NextResponse.json({ error: pesanGalat(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// UBAH tim
export async function PATCH(request: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Akses ditolak. Fitur ini khusus admin." }, { status: guard.status });

  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });

  const { isi, galat } = bacaIsi(body, false);
  if (galat) return NextResponse.json({ error: galat }, { status: 400 });

  const { data, error } = await guard.supabase
    .from("vote_teams")
    .update(isi!)
    .eq("id", body.id)
    .select("id");
  if (error) return NextResponse.json({ error: pesanGalat(error.message) }, { status: 500 });
  // Nol baris = timnya udah dihapus (mis. admin lain) selama form ini terbuka.
  if (!data?.length)
    return NextResponse.json({ error: "Tim tidak ditemukan. Mungkin sudah dihapus. Muat ulang halaman." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// HAPUS tim
export async function DELETE(request: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok || !guard.supabase)
    return NextResponse.json({ error: "Akses ditolak. Fitur ini khusus admin." }, { status: guard.status });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });

  const { error } = await guard.supabase
    .from("vote_teams")
    .delete()
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

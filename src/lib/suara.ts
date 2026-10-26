import { createClient as createAdmin, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Jumlah suara tiap tim. KHUSUS SERVER (API route) — pakai kunci service
 * role, yang nggak pernah ikut terkirim ke browser.
 *
 * Kenapa service role, bukan sesi pengunjung: tabel `votes` dikunci
 * (SQL di src/app/api/admin/vote-settings/route.ts) — tiap akun cuma bisa
 * membaca suaranya SENDIRI, biar nggak ada yang bisa lihat siapa milih
 * siapa. Hitungan lewat sesi pengunjung bakal selalu 0 atau 1. Di sini
 * yang keluar cuma angka per tim, bukan baris suaranya.
 *
 * JANGAN diganti jadi "ambil semua baris `votes` lalu hitung di
 * JavaScript" (cara lama): Supabase cuma ngirim maksimal 1.000 baris per
 * permintaan, jadi begitu pemilihnya lewat 1.000, jumlahnya diam-diam
 * kurang. Di sini tiap tim dihitung database-nya sendiri (`count`).
 *
 * Lempar galat kalau ada hitungan yang gagal — lebih baik halamannya
 * bilang gagal daripada nampilin "0 suara" yang salah.
 */
export async function hitungSuara(idTim: string[]): Promise<Record<string, number>> {
  const db = klienPenghitung();
  const hasil = await Promise.all(
    idTim.map((id) => db.from("votes").select("*", { count: "exact", head: true }).eq("team_id", id)),
  );
  const galat = hasil.find((r) => r.error);
  if (galat?.error) throw new Error(galat.error.message);
  return Object.fromEntries(idTim.map((id, i) => [id, hasil[i].count ?? 0]));
}

let klien: SupabaseClient | null = null;
function klienPenghitung() {
  return (klien ??= createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}

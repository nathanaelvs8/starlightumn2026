import { createClient as createAdmin, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Urusan tabel `votes` yang harus lewat server. KHUSUS SERVER (API route)
 * — pakai kunci service role, yang nggak pernah ikut terkirim ke browser.
 *
 * Kenapa service role, bukan sesi pengunjung: tabel `votes` dikunci
 * (SQL di src/app/api/admin/vote-settings/route.ts) — tiap akun cuma bisa
 * membaca suaranya SENDIRI, biar nggak ada yang bisa lihat siapa milih
 * siapa, dan nggak bisa menghapus suara langsung.
 */

/**
 * Jumlah suara tiap tim. Hitungan lewat sesi pengunjung bakal selalu 0
 * atau 1 (lihat atas); di sini yang keluar cuma angka per tim, bukan
 * baris suaranya.
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
  const db = klienServer();
  const hasil = await Promise.all(
    idTim.map((id) => db.from("votes").select("*", { count: "exact", head: true }).eq("team_id", id)),
  );
  const galat = hasil.find((r) => r.error);
  if (galat?.error) throw new Error(galat.error.message);
  return Object.fromEntries(idTim.map((id, i) => [id, hasil[i].count ?? 0]));
}

/**
 * Batalkan suara satu akun (tombol "Tekan untuk membatalkan"). Yang
 * manggil WAJIB udah ngecek akunnya (sesi login) & voting masih dibuka —
 * lihat DELETE di src/app/api/vote/route.ts.
 */
export async function batalkanSuara(idPengguna: string): Promise<void> {
  const { error } = await klienServer().from("votes").delete().eq("user_id", idPengguna);
  if (error) throw new Error(error.message);
}

let klien: SupabaseClient | null = null;
function klienServer() {
  return (klien ??= createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}

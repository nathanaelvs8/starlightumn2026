import { createClient } from "@/lib/supabase/server";
import { stages, type Stage } from "@/lib/stages";

/**
 * Daftar panggung + status segelnya (dibuka / masih disegel), diatur
 * admin lewat saklar di /admin. Cuma buat Server Component.
 *
 * Disimpan di `vote_settings.panggung_terbuka` (baris id = 1): daftar
 * slug panggung yang udah dibuka, misalnya {lonielle,twizzle}. SQL-nya
 * ada di komentar src/app/api/admin/panggung/route.ts.
 *
 * Selama kolomnya belum ada di database, yang dipakai `terbuka` bawaan
 * di src/lib/stages.ts — jadi situsnya tetap jalan sebelum SQL-nya
 * dijalankan.
 *
 * JANGAN dibungkus try/catch — alasannya sama kayak di src/lib/admin.ts.
 */
export async function stagesDenganStatus(): Promise<Stage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vote_settings")
    .select("panggung_terbuka")
    .eq("id", 1)
    .single();
  if (error || !Array.isArray(data?.panggung_terbuka)) return stages;

  const buka = new Set<string>(data.panggung_terbuka);
  return stages.map((s) => ({ ...s, terbuka: buka.has(s.slug) }));
}

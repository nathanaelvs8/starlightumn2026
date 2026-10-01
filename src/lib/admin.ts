import { createClient } from "@/lib/supabase/server";

/**
 * Yang lagi buka halaman ini admin? (`profiles.role === "admin"`)
 * Cuma buat Server Component / route handler.
 *
 * JANGAN dibungkus try/catch. Pas `next build`, `cookies()` di dalam
 * createClient sengaja ngelempar error khusus biar Next tau halamannya
 * harus dirender per permintaan. Kalau error itu ketangkep, halamannya
 * dikira statis dan hasil "bukan admin" kebeku permanen di hasil build.
 */
export async function isAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin";
}

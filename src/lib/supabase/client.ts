/**
 * Koneksi Supabase buat dipakai di BROWSER (client component).
 *
 * Pakai publishable/anon key yang aman dibawa ke browser — keamanan
 * datanya dijaga sama Row Level Security (RLS) di Supabase, bukan sama
 * kerahasiaan key ini.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
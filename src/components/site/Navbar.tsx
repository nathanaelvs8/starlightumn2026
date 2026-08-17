import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./NavbarClient";

/**
 * Wrapper server: baca status login, terus lempar ke NavbarClient.
 * Kalau user login, ambil nama dari profiles.
 */
export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  if (user) {
    // Ambil nama dari metadata user langsung — ini nggak kena RLS,
    // jadi lebih andal daripada query tabel profiles buat navbar.
    name =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      "Akun";
  }

  return <NavbarClient loggedIn={!!user} name={name} />;
}
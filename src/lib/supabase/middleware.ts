import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const BEBAS = ["/segera-hadir", "/login", "/auth", "/api"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (BEBAS.some((p) => path.startsWith(p))) return response;

  const { data: setelan } = await supabase
    .from("vote_settings")
    .select("situs_terbuka")
    .eq("id", 1)
    .single();

  const terbuka = setelan ? !!setelan.situs_terbuka : true;
  if (terbuka) return response;

  if (user) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profil?.role === "admin") return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/segera-hadir";
  const rewrite = NextResponse.rewrite(url);
  response.cookies.getAll().forEach((c) => rewrite.cookies.set(c));
  return rewrite;
}
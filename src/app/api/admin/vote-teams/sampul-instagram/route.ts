import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { idInstagram } from "@/lib/videoTim";

/**
 * Sampul otomatis buat link reel / post Instagram (khusus admin).
 *
 * Sejak 3 November 2025 oEmbed Instagram nggak lagi ngasih `thumbnail_url`.
 * Saran Meta sendiri: ambil dari metadata HTML post-nya (`og:image`) —
 * itu yang dilakukan di sini, sekali per link, pas admin menempelkannya.
 *
 * Gambarnya dikirim balik ke browser admin, BUKAN disimpan sebagai link:
 * URL CDN Instagram kedaluwarsa dalam beberapa hari. Form admin lalu
 * mengunggahnya ke bucket foto tim, sama kayak gambar sampul biasa.
 *
 * Ini usaha tambahan, bukan jaminan: Instagram bisa minta login atau
 * membatasi server kapan aja. Kalau gagal, form admin minta gambar
 * sampul diunggah manual.
 */

const BATAS_GAMBAR = 5 * 1024 * 1024;
const WAKTU_TUNGGU = 8000;
/** Identitas jujur — bukan menyamar jadi browser atau bot Meta. */
const PENGENAL = "StarlightUMN2026/1.0 (+https://www.starlightumn2026.com)";

async function pastikanAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { ok: false, status: 403 };
  return { ok: true, status: 200 };
}

const gagal = (status: number, error: string) => NextResponse.json({ error }, { status });

/** Isi atribut `content` dari tag <meta property="…"> pertama yang cocok. */
function bacaMeta(html: string, properti: string): string | null {
  for (const tag of html.match(/<meta\s[^>]*>/gi) ?? []) {
    if (!new RegExp(`property=["']${properti}["']`, "i").test(tag)) continue;
    const isi = tag.match(/content=["']([^"']*)["']/i)?.[1];
    if (isi) return isi.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/");
  }
  return null;
}

/** Cuma gambar media dari CDN Instagram — logo / gambar generik ditolak. */
function gambarMediaInstagram(src: string): boolean {
  try {
    const u = new URL(src);
    const host = u.hostname;
    return (
      u.protocol === "https:" &&
      (host.endsWith(".cdninstagram.com") || host.endsWith(".fbcdn.net")) &&
      u.pathname.startsWith("/v/")
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const guard = await pastikanAdmin();
  if (!guard.ok) return gagal(guard.status, "Khusus admin.");

  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  const ig = typeof body.url === "string" ? idInstagram(body.url) : null;
  if (!ig) return gagal(400, "Link Instagram tidak dikenali.");

  const PESAN_GAGAL = "Sampul tidak dapat diambil otomatis dari Instagram. Unggah gambar sampul sendiri.";

  try {
    // Alamatnya dirakit sendiri dari kode yang udah divalidasi — bukan
    // URL mentah dari admin — jadi server ini cuma pernah ngakses instagram.com.
    const halaman = await fetch(`https://www.instagram.com/${ig.tipe}/${ig.kode}/`, {
      headers: { "User-Agent": PENGENAL, Accept: "text/html", "Accept-Language": "id,en;q=0.8" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(WAKTU_TUNGGU),
    });
    // Dialihkan = biasanya ke halaman login (akun privat / server dibatasi).
    if (halaman.status !== 200) return gagal(502, PESAN_GAGAL);
    const html = await halaman.text();

    // Pastikan ini memang halaman post yang diminta, bukan halaman umum.
    const alamat = bacaMeta(html, "og:url");
    const src = bacaMeta(html, "og:image");
    if (!alamat?.includes(`/${ig.kode}`) || !src || !gambarMediaInstagram(src)) return gagal(502, PESAN_GAGAL);

    const gambar = await fetch(src, {
      headers: { "User-Agent": PENGENAL },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(WAKTU_TUNGGU),
    });
    const tipe = gambar.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (gambar.status !== 200 || !["image/jpeg", "image/png", "image/webp"].includes(tipe))
      return gagal(502, PESAN_GAGAL);
    if (Number(gambar.headers.get("content-length") ?? 0) > BATAS_GAMBAR) return gagal(502, PESAN_GAGAL);

    const isi = await gambar.arrayBuffer();
    if (isi.byteLength === 0 || isi.byteLength > BATAS_GAMBAR) return gagal(502, PESAN_GAGAL);

    return new NextResponse(isi, {
      headers: { "Content-Type": tipe, "Cache-Control": "no-store" },
    });
  } catch {
    // Waktu habis / jaringan server putus.
    return gagal(502, PESAN_GAGAL);
  }
}

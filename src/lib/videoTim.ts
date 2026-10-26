/**
 * Media tim voting: video (upload langsung, link YouTube, ATAU link
 * Instagram) dan gambar sampulnya. Dipakai halaman Vote, panel admin, dan API-nya — jadi aturan
 * "link ini video apa" cuma ditulis sekali di sini.
 *
 * Disimpan di tabel `vote_teams`:
 *   video_url  → link YouTube / Instagram, atau URL publik file di bucket
 *                `team-videos`
 *   photo_url  → gambar sampul (cuplikan video / gambar upload sendiri);
 *                kosong + video YouTube = pakai thumbnail YouTube otomatis
 *   deskripsi  → keterangan singkat di pop-up detail (opsional)
 *
 * SQL buat kolom & bucket-nya ada di src/app/api/admin/vote-teams/route.ts.
 */

export type TimVote = {
  id: string;
  name: string;
  photo_url: string | null;
  video_url?: string | null;
  deskripsi?: string | null;
  /** null = jumlah suara lagi disembunyikan admin dari pengunjung. */
  vote_count: number | null;
};

export const BUCKET_VIDEO = "team-videos";
export const BUCKET_FOTO = "team-photos";

/**
 * Batas ukuran video yang boleh diupload, dalam MB.
 *
 * Supabase paket gratis menolak file di atas 50 MB. Kalau proyeknya udah
 * Pro, naikin batas di Supabase (Storage → Settings) DAN angka ini.
 */
export const BATAS_VIDEO_MB = 50;

/**
 * Format file yang diterima. Cuma MP4 / MOV — WebM nggak bisa diputar di
 * sebagian iPhone. Codec-nya (harus H.264) dicek terpisah di form admin,
 * karena ekstensi .mp4 belum tentu isinya H.264.
 */
export const FORMAT_VIDEO = "video/mp4,video/quicktime";

/** Batas panjang URL yang disimpan — link normal jauh di bawah ini. */
const MAKS_URL = 2048;

/** URL https yang sah, atau null. Skema lain (http, ftp, javascript:) ditolak. */
function urlHttps(url: string | null | undefined): URL | null {
  if (!url || url.length > MAKS_URL) return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

/**
 * ID video dari link YouTube apa pun bentuknya: youtube.com/watch?v=…,
 * youtu.be/…, /shorts/…, /embed/…, /live/…, m.youtube.com. Bukan link
 * YouTube yang sah → null.
 */
export function idYoutube(url: string | null | undefined): string | null {
  const u = urlHttps(url);
  if (!u) return null;
  try {
    const host = u.hostname.replace(/^(www|m|music)\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else id = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1] ?? null;
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Link YouTube Shorts — videonya tegak (9:16), bukan 16:9. */
export function youtubeShorts(url: string | null | undefined): boolean {
  return !!idYoutube(url) && !!urlHttps(url)?.pathname.startsWith("/shorts/");
}

/**
 * Reel / post Instagram: bentuknya ("reel" / "p") + kodenya. Link
 * instagram.com/reel/…, /reels/…, /p/…, /tv/… — bukan itu → null.
 */
export function idInstagram(url: string | null | undefined): { tipe: "reel" | "p"; kode: string } | null {
  const u = urlHttps(url);
  if (!u) return null;
  try {
    if (u.hostname.replace(/^(www|m)\./, "") !== "instagram.com") return null;
    // Kodenya harus utuh sampai "/" atau akhir path — "ABCDE!sampah" ditolak.
    const m = u.pathname.match(/^\/(?:[\w.]+\/)?(reels?|p|tv)\/([\w-]{5,})\/?$/);
    if (!m) return null;
    return { tipe: m[1] === "p" ? "p" : "reel", kode: m[2] };
  } catch {
    return null;
  }
}

/** Alamat embed resmi Instagram (tanpa skrip tambahan). */
export function embedInstagram(url: string | null | undefined): string | null {
  const ig = idInstagram(url);
  return ig ? `https://www.instagram.com/${ig.tipe}/${ig.kode}/embed/` : null;
}

/** Video tim ini dari mana. */
export function jenisVideo(url: string | null | undefined): "youtube" | "instagram" | "file" | null {
  if (!url) return null;
  if (idYoutube(url)) return "youtube";
  if (idInstagram(url)) return "instagram";
  return "file";
}

/**
 * Gambar sampul yang ditampilkan di kartu. Urutannya: gambar yang diatur
 * admin → thumbnail YouTube → nggak ada. (Sampul Instagram nggak bisa
 * dipanggil langsung dari sini — form admin mengambilnya sekali lewat
 * /api/admin/vote-teams/sampul-instagram, lalu menyimpannya sebagai
 * `photo_url`.)
 *
 * Thumbnail YouTube yang SELALU ada cuma ukuran kecil-menengah
 * (`maxresdefault` nggak ada di video lama / resolusi rendah):
 *   - "besar" → `hqdefault` 480×360, 4:3 dengan pita hitam di atas & bawah.
 *     Dipakai di kotak 16:9 + object-cover, jadi pitanya pas kepotong.
 *   - "poster" → `mqdefault` 320×180, 16:9 asli tanpa pita. Di kartu poster
 *     gambarnya ditaruh utuh (object-contain), jadi pita hitam bakal kelihatan
 *     kalau pakai hqdefault.
 */
export function sampulTim(
  t: Pick<TimVote, "photo_url" | "video_url">,
  ukuran: "besar" | "poster" = "besar",
): string | null {
  if (t.photo_url) return t.photo_url;
  const yt = idYoutube(t.video_url);
  if (!yt) return null;
  return `https://i.ytimg.com/vi/${yt}/${ukuran === "poster" ? "mqdefault" : "hqdefault"}.jpg`;
}

/** Path file di bucket dari URL publiknya — buat menghapus file lama. */
export function pathDariUrlPublik(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null;
  const tanda = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(tanda);
  return i < 0 ? null : decodeURIComponent(url.slice(i + tanda.length).split("?")[0]);
}

/**
 * Link video yang boleh disimpan: kosong, link YouTube / Instagram, atau
 * file di bucket video proyek ini. Selain itu ditolak — biar nggak ada link ke
 * situs lain yang nyelip ke halaman Vote.
 */
export function videoUrlSah(url: string | null, supabaseUrl: string | undefined): boolean {
  if (url === null) return true;
  if (idYoutube(url) || idInstagram(url)) return true;
  return fileDiBucket(url, supabaseUrl, BUCKET_VIDEO);
}

/** Gambar sampul yang boleh disimpan: kosong, atau file di bucket foto tim. */
export function fotoUrlSah(url: string | null, supabaseUrl: string | undefined): boolean {
  return url === null || fileDiBucket(url, supabaseUrl, BUCKET_FOTO);
}

/**
 * URL publik file di bucket tertentu milik proyek ini. Dicek SETELAH
 * di-parse: parser URL udah ngeberesin "../" (dan "%2e%2e"), jadi
 * ".../team-videos/../team-photos/x" ketahuan keluar dari bucket-nya.
 */
function fileDiBucket(url: string, supabaseUrl: string | undefined, bucket: string): boolean {
  const u = urlHttps(url);
  if (!u || !supabaseUrl) return false;
  try {
    if (u.origin !== new URL(supabaseUrl).origin) return false;
  } catch {
    return false;
  }
  const awalan = `/storage/v1/object/public/${bucket}/`;
  return u.pathname.startsWith(awalan) && u.pathname.length > awalan.length;
}

/** "1:05" / "12:30". */
export function formatDurasi(detik: number) {
  const s = Math.max(0, Math.round(detik));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

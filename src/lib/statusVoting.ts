/**
 * Status voting — satu aturan buat halaman Vote, API-nya, homepage, dan
 * panel admin. Disimpan di `vote_settings` (baris id = 1):
 *   is_open / is_finished  → dipilih admin (Belum Dibuka / Dibuka / Selesai)
 *   voting_ditutup_pada    → opsional; lewat dari jam ini suara ditolak
 *                            walau admin belum ngubah status ke Selesai
 *   tampilkan_suara        → jumlah suara kelihatan pengunjung — selama
 *                            voting DAN sesudah selesai (babaknya
 *                            eliminasi; rekapnya boleh nggak dibuka)
 *
 * SQL kolom-kolomnya ada di src/app/api/admin/vote-settings/route.ts.
 * Aturan yang sama juga dijaga database (fungsi `voting_terbuka()`).
 */

export type SetelanVoting = {
  is_open?: boolean | null;
  is_finished?: boolean | null;
  voting_ditutup_pada?: string | null;
  tampilkan_suara?: boolean | null;
};

/**
 * - belum   : admin belum membuka voting
 * - buka    : suara diterima
 * - lewat   : status masih "Dibuka", tapi waktu tutupnya sudah lewat
 * - selesai : hasil akhir diumumkan
 */
export type StatusVoting = "belum" | "buka" | "lewat" | "selesai";

export function statusVoting(s: SetelanVoting | null | undefined, sekarang = Date.now()): StatusVoting {
  if (s?.is_finished) return "selesai";
  if (!s?.is_open) return "belum";
  const tutup = s.voting_ditutup_pada ? Date.parse(s.voting_ditutup_pada) : NaN;
  return Number.isFinite(tutup) && sekarang >= tutup ? "lewat" : "buka";
}

/** Jumlah suara boleh dikirim ke pengunjung? Ikut saklar admin, termasuk setelah selesai. */
export function suaraTerlihat(s: SetelanVoting | null | undefined): boolean {
  return s?.tampilkan_suara !== false;
}

/* Acaranya di Indonesia: semua jam ditulis & diisi dalam WIB, apa pun
   zona waktu HP / laptop yang membuka. */
const ZONA = "Asia/Jakarta";

/** "2026-11-03" di WIB — buat ngecek "hari ini" / "besok". */
const tanggalWib = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: ZONA });

/**
 * Keterangan waktu yang pas disambung "voting ditutup …":
 * "pada Selasa, 3 November 2026 pukul 20.00 WIB", atau "hari ini / besok /
 * kemarin pukul 20.00 WIB" kalau dekat.
 */
export function formatWaktuTutup(iso: string, sekarang = Date.now()): string {
  const ms = Date.parse(iso);
  const jam = new Date(ms).toLocaleTimeString("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const hari = tanggalWib(ms);
  if (hari === tanggalWib(sekarang)) return `hari ini pukul ${jam} WIB`;
  if (hari === tanggalWib(sekarang + 86_400_000)) return `besok pukul ${jam} WIB`;
  if (hari === tanggalWib(sekarang - 86_400_000)) return `kemarin pukul ${jam} WIB`;
  const tanggal = new Date(ms).toLocaleDateString("id-ID", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `pada ${tanggal} pukul ${jam} WIB`;
}

/** Waktu tersimpan → isi `<input type="datetime-local">` dalam WIB ("2026-11-03T20:00"). */
export function keIsianWib(iso: string | null | undefined): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return "";
  const bagian = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${bagian.year}-${bagian.month}-${bagian.day}T${bagian.hour}:${bagian.minute}`;
}

/** Isi `datetime-local` (dibaca sebagai WIB) → ISO buat disimpan. Kosong / ngawur → null. */
export function dariIsianWib(isian: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(isian)) return null;
  const ms = Date.parse(`${isian}:00+07:00`);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

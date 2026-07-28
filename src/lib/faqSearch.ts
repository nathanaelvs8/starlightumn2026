/**
 * Pencarian FAQ yang toleran typo.
 *
 * Cara kerjanya: tiap kata yang diketik dibandingin sama tiap kata di
 * pertanyaan/jawaban. Cocok kalau:
 *   - katanya kandung (mis. "daftar" ada di "mendaftar"), ATAU
 *   - ejaannya mirip walau typo (mis. "starlite" ~ "starlight").
 *
 * Kemiripan diukur pakai jarak Levenshtein — jumlah huruf yang harus
 * diubah biar dua kata jadi sama. Makin sedikit, makin mirip.
 */

/** Hitung berapa langkah edit biar kata a jadi kata b. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Batas typo yang dimaafkan, nyesuaikan panjang kata. */
function toleransi(len: number): number {
  if (len <= 3) return 0; // kata pendek harus persis
  if (len <= 5) return 1; // "audsi" ~ "audisi"
  if (len <= 8) return 2; // "starlite" ~ "starlight"
  return 3;
}

/** Satu kata ketikan cocok sama satu kata target? */
function kataCocok(ketik: string, target: string): boolean {
  if (target.includes(ketik)) return true; // "daftar" di "mendaftar"
  if (ketik.length < 3) return false;
  return levenshtein(ketik, target) <= toleransi(ketik.length);
}

/**
 * Cek apakah teks (pertanyaan + jawaban) cocok sama query.
 * Cocok kalau MINIMAL satu kata ketikan nyambung ke salah satu kata
 * di teks.
 */
export function faqCocok(query: string, teks: string): boolean {
  const kataKetik = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (kataKetik.length === 0) return true;

  const kataTeks = teks
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return kataKetik.some((k) => kataTeks.some((t) => kataCocok(k, t)));
}
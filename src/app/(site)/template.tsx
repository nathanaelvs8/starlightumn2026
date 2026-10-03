import type { ReactNode } from "react";

/**
 * Transisi antar halaman.
 *
 * Beda sama layout.tsx, template dibikin ULANG tiap pindah halaman — jadi
 * animasi di pembungkus ini jalan sekali tiap kali halaman baru kebuka.
 * Navbar & footer ada di layout, jadi mereka diam; yang muncul pelan cuma
 * isi halamannya.
 *
 * Sengaja CUMA opacity, tanpa geser (transform). Semua halaman punya
 * background `position: fixed` (.latar-layar) di dalam pembungkus ini —
 * kalau pembungkusnya pakai transform, selama animasi background-nya ikut
 * kegeser bareng isinya, bukan diam di layar.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="halaman-masuk">{children}</div>;
}

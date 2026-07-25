import type { CSSProperties, ReactNode } from "react";
import clsx from "@/lib/clsx";

/**
 * Blok besar dengan satu background. Background dipasang per-BAND
 * (beberapa section sekaligus), bukan per-section kecil.
 *
 * === `ratio` ===
 *
 * Isi pakai rasio gambar background-nya, mis. "1920/1450".
 *
 * Rasio ini jadi tinggi MINIMUM band:
 *   - isi lebih pendek  → band berhenti di rasio itu, gambar kepakai pas
 *   - isi lebih panjang → band tumbuh ngikutin isi, nggak ada yang kepotong
 *
 * Isi TIDAK PERNAH diciutin. Ukuran teks & gambar di band ini selalu
 * sama persis dengan band lain.
 *
 * Caranya: section dibikin grid satu sel, terus dua hal ditumpuk di sel
 * yang sama — satu kotak kosong setinggi rasio gambar, dan isinya.
 * Tinggi baris grid otomatis ngambil yang paling tinggi di antara
 * keduanya.
 *
 * (Jangan pasang aspect-ratio langsung di section. Di elemen blok itu
 * MENGUNCI tinggi, bukan bikin minimum — isi yang lebih panjang bakal
 * keluar dari kotak dan kepotong.)
 *
 * === Kenapa background "cover" kalau ada ratio ===
 *
 * Supaya nggak pernah ada sisa warna polos di bawah, berapa pun tinggi
 * bandnya. Pas tinggi band == rasio gambar, "cover" hasilnya identik
 * dengan pas — nggak ada yang kepotong. Baru kalau isi bikin band lebih
 * tinggi, gambar dizoom dikit dan sisi kiri-kanan kepotong sedikit.
 *
 * === `fit` (dipakai kalau `ratio` kosong) ===
 * "width" (default) — lebar gambar pas ke lebar layar, nggak dizoom.
 * "tile" — sama, tapi diulang ke bawah.
 * "cover" — dizoom sampai nutup penuh.
 *
 * === `flipX` ===
 * Balik gambar background mendatar. Isi nggak ikut kebalik.
 */
export function Band({
  bg,
  ratio,
  fit = "width",
  position = "center",
  flipX = false,
  children,
  className,
}: {
  bg?: string;
  ratio?: string;
  fit?: "width" | "tile" | "cover";
  position?: string;
  flipX?: boolean;
  children: ReactNode;
  className?: string;
}) {
  /**
   * Background ditaruh di lapisan sendiri, bukan di <section>, supaya
   * flipX cuma mbalik gambarnya — kalau transform dipasang di section,
   * teksnya ikut kebalik jadi cermin.
   */
  const bgStyle: CSSProperties = {};
  if (bg) {
    bgStyle.backgroundImage = `url("${bg}")`;
    bgStyle.backgroundSize = ratio || fit === "cover" ? "cover" : "100% auto";
    bgStyle.backgroundRepeat = fit === "tile" ? "repeat-y" : "no-repeat";
    bgStyle.backgroundPosition = position;
    if (flipX) bgStyle.transform = "scaleX(-1)";
  }

  return (
    /*
      grid-cols-[minmax(0,1fr)] itu WAJIB.
      Default-nya, kolom grid nggak boleh lebih sempit dari lebar isi
      minimumnya — jadi kotak sponsor & media partner bakal maksa band
      melebar ngelewatin layar dan bikin geseran ke kanan. minmax(0,1fr)
      ngasih izin kolomnya menyempit ngikutin layar.
    */
    <section
      className={clsx(
        "relative grid grid-cols-[minmax(0,1fr)] overflow-hidden bg-band",
        className,
      )}
    >
      {bg && <div aria-hidden className="absolute inset-0" style={bgStyle} />}

      {/* Kotak kosong penentu tinggi minimum. Nggak kelihatan. */}
      {ratio && (
        <div
          aria-hidden
          className="pointer-events-none [grid-area:1/1]"
          style={{ aspectRatio: ratio }}
        />
      )}

      <div className="relative min-w-0 [grid-area:1/1]">{children}</div>
    </section>
  );
}
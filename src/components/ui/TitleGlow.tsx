"use client";

/**
 * Judul besar: warna gradasi (pinggir gelap, tengah terang) + glow.
 *
 * Pas muncul, glow-nya "nyala" dari redup ke terang kayak neon
 * dinyalain — animasi `.title-ignite` di globals.css. Animasinya jalan
 * sekali pas judul dirender.
 */
export function TitleGlow({
  children,
  className,
  /**
   * Tingkat heading-nya. Default `h1`.
   *
   * Dulu komponen ini SELALU merender <h1>, padahal dipakai buat semua
   * judul bergaya sama — besar maupun kecil. Akibatnya homepage punya
   * TUJUH <h1>, dan satu-satunya <h2>-nya malah "Sponsor" dan "Media
   * Partner" (dua grid placeholder kosong). Di halaman panggung,
   * <h1>-nya jadi "Trailer Twizzle" sementara nama panggungnya sendiri
   * cuma <h2>.
   *
   * Yang pakai screen reader lompat antar halaman lewat daftar heading;
   * kalau semuanya level 1, daftarnya jadi datar dan nggak nunjukin apa
   * yang induk dan apa yang anak.
   *
   * Ukuran huruf sama sekali NGGAK diatur di sini — itu datang dari
   * `className` yang dikirim pemanggil. Jadi ganti level heading nggak
   * mengubah tampilan sedikit pun, cuma artinya buat mesin pembaca.
   */
  as: Tag = "h1",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag className={`title-glow title-ignite font-display ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
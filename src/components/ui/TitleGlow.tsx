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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1 className={`title-glow title-ignite font-display ${className ?? ""}`}>
      {children}
    </h1>
  );
}
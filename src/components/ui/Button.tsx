import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "@/lib/clsx";

/*
  Huruf tombol pakai Alice kapital (sama kayak menu navbar & tombol
  login), bukan Efco Brookshire — huruf hias itu di ukuran tombol jadi
  susah dibaca ("Registrasi Penonton" dulu nyaris nggak kebaca).
*/
const base =
  "inline-flex items-center justify-center gap-2 rounded-pill px-7 py-3 font-alice text-sm font-bold uppercase tracking-[0.12em] transition-[background-color,box-shadow,transform] duration-200 sm:px-9 sm:text-base";

const variants = {
  /* Tombol utama: emas (sisi Auradon dari logo), teks biru malam. */
  solid:
    "bg-emas text-night shadow-[0_0_24px_rgb(var(--c-emas-rgb)/0.35)] [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-[0_0_34px_rgb(var(--c-emas-rgb)/0.55)]",
  /* Tombol kedua: kaca tembus pandang, sama kayak navbar. */
  outline:
    "border border-white/35 bg-white/5 text-white backdrop-blur [@media(hover:hover)]:hover:bg-white/15",
} as const;

/**
 * Tombol biasa — bukan tautan.
 *
 * Dipakai buat aksi yang belum punya tujuan, atau yang ditangani
 * JavaScript. Gayanya ngambil dari `base` + `variants` yang sama persis
 * kayak ButtonLink, jadi dua-duanya nggak bisa beda sendiri-sendiri.
 *
 * Yang `disabled` sengaja cuma diredupin dikit (opacity 60%) dan
 * kursornya diganti — bukan disamarkan sampai nggak kebaca. Kalau
 * tombolnya hampir hilang, orang malah nggak tau ada sesuatu yang
 * memang direncanakan di situ.
 */
export function Button({
  variant = "solid",
  disabled,
  title,
  onClick,
  className,
  children,
}: {
  variant?: keyof typeof variants;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      title={title}
      onClick={onClick}
      className={clsx(
        base,
        variants[variant],
        disabled && "cursor-not-allowed opacity-60 hover:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "solid",
  external,
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof variants;
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const cls = clsx(base, variants[variant], className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

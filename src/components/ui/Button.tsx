import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "@/lib/clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-display text-sm font-bold sm:px-8 sm:text-base";

const variants = {
  solid: "bg-strong text-onstrong hover:opacity-90",
  outline: "border border-line bg-page text-ink hover:bg-raised",
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

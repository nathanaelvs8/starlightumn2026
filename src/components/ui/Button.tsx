import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "@/lib/clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-display text-sm font-bold sm:px-8 sm:text-base";

const variants = {
  solid: "bg-strong text-onstrong hover:opacity-90",
  outline: "border border-line bg-page text-ink hover:bg-raised",
} as const;

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

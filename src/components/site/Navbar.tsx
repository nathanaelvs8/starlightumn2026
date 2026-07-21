"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Asset } from "@/components/ui/Asset";
import { Container } from "@/components/ui/Container";
import { asset } from "@/lib/assets";
import clsx from "@/lib/clsx";

/**
 * Menu kondisi BELUM login. Login ikut jadi item biasa di baris yang
 * sama, sejajar dengan yang lain.
 *
 * Nanti pas auth jadi: sisipin { href: "/vote", label: "Vote" } setelah
 * "Stages", dan ganti item Login jadi chip nama user.
 */
const MENU = [
  { href: "/", label: "Home" },
  { href: "/division", label: "Division" },
  { href: "/stages", label: "Stages" },
  { href: "/mini-gerda", label: "Mini Gerda" },
  { href: "/faq", label: "FAQ" },
  { href: "/login", label: "Login" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <Container className="rounded-pill border border-line bg-page/95 px-4 backdrop-blur sm:px-6">
        <nav className="relative flex h-[var(--h-nav)] items-center justify-center">
          {/* Logo — nempel di kiri, menu tetap pas di tengah */}
          <Link
            href="/"
            aria-label="Starlight UMN 2026 — Home"
            className="hover-pop absolute left-0"
          >
            <Asset
              src={asset.logo.nav}
              alt="Starlight UMN 2026"
              className="w-[110px] sm:w-[140px]"
              priority
            />
          </Link>

          {/* Menu desktop */}
          <ul className="hidden items-center gap-8 lg:flex xl:gap-11">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={clsx(
                    "nav-link font-alice text-lg uppercase tracking-wide xl:text-xl",
                    isActive(item.href)
                      ? "text-ink"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Tombol menu di layar kecil */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label="Buka menu"
            className="hover-pop absolute right-0 grid h-10 w-10 place-items-center rounded-pill border border-line lg:hidden"
          >
            <span aria-hidden className="text-lg leading-none">
              {open ? "\u00d7" : "\u2261"}
            </span>
          </button>
        </nav>

        {/* Menu mobile */}
        {open && (
          <ul id="menu-mobile" className="flex flex-col gap-1 pb-4 lg:hidden">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "block rounded-md px-4 py-3 font-alice text-base uppercase tracking-wide transition-colors",
                    isActive(item.href)
                      ? "bg-raised text-ink"
                      : "text-muted hover:bg-surface hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </header>
  );
}
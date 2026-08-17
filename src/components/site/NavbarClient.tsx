"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Asset } from "@/components/ui/Asset";
import { Container } from "@/components/ui/Container";
import { UserMenu } from "./UserMenu";
import { asset } from "@/lib/assets";
import clsx from "@/lib/clsx";

/** Menu utama. Vote disisipin pas login, Login/UserMenu di bawah. */
const MENU_BASE = [
  { href: "/", label: "Home" },
  { href: "/division", label: "Division" },
  { href: "/stages", label: "Stages" },
  { href: "/mini-gerda", label: "Mini Gerda" },
  { href: "/faq", label: "FAQ" },
];

export function NavbarClient({
  loggedIn,
  name,
}: {
  loggedIn: boolean;
  name: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

    // Vote disisipin antara Mini Gerda dan FAQ, cuma kalau udah login.
  const withVote = loggedIn
    ? [
        ...MENU_BASE.slice(0, 4), // Home, Division, Stages, Mini Gerda
        { href: "/vote", label: "Vote" },
        ...MENU_BASE.slice(4), // FAQ
      ]
    : MENU_BASE;

  // Kalau belum login, Login ikut jadi item menu di tengah.
  const menu = loggedIn ? withVote : [...withVote, { href: "/login", label: "Login" }];

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <Container className="rounded-pill border border-white/25 bg-black/25 px-4 backdrop-blur sm:px-6">
        <nav className="relative flex h-[var(--h-nav)] items-center justify-center">
          {/* Logo kiri */}
          <Link
            href="/"
            aria-label="Starlight UMN 2026 — Home"
            className="hover-pop absolute left-0"
          >
            <Asset
              src={asset.logo.nav}
              alt="Starlight UMN 2026"
              className="w-[78px] sm:w-[110px] lg:w-[150px]"
              priority
            />
          </Link>

          {/* Menu desktop */}
          <ul className="hidden items-center gap-8 lg:flex xl:gap-11">
            {menu.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={clsx(
                    "nav-link font-alice text-xl uppercase tracking-wide xl:text-2xl",
                    isActive(item.href)
                      ? "text-white"
                      : "text-white/70 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Kanan: chip user cuma pas udah login. Login (belum masuk)
              sekarang jadi item menu di tengah, bukan di sini. */}
          {loggedIn && name && (
            <div className="absolute right-0 hidden lg:block">
              <UserMenu name={name} />
            </div>
          )}

          {/* Tombol hamburger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="absolute right-0 grid h-11 w-11 place-items-center rounded-pill border border-white/30 text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            <span aria-hidden className="relative block h-3.5 w-5">
              <span
                className={clsx(
                  "absolute left-0 h-[2px] w-full rounded-pill bg-current transition-all duration-300",
                  open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
                )}
              />
              <span
                className={clsx(
                  "absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-pill bg-current transition-opacity duration-200",
                  open && "opacity-0",
                )}
              />
              <span
                className={clsx(
                  "absolute left-0 h-[2px] w-full rounded-pill bg-current transition-all duration-300",
                  open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
                )}
              />
            </span>
          </button>
        </nav>
      </Container>

      {/* Panel mobile */}
      <Container className="lg:hidden">
        <div
          id="menu-mobile"
          className={clsx(
            "mt-2 overflow-hidden rounded-lg border bg-black/40 backdrop-blur transition-all duration-300 ease-out",
            open
              ? "max-h-[480px] border-white/20 opacity-100"
              : "pointer-events-none max-h-0 border-transparent opacity-0",
          )}
        >
          <ul className="flex flex-col gap-1 p-2">
            {menu.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={clsx(
                    "block rounded-md px-4 py-3 font-alice text-lg uppercase tracking-wide transition-all duration-300",
                    isActive(item.href)
                      ? "bg-white/15 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                    open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
                  )}
                  style={{ transitionDelay: open ? `${i * 45}ms` : "0ms" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}

            {/* Login / Logout di mobile */}
            <li>
              {loggedIn ? (
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="block w-full rounded-md px-4 py-3 text-left font-alice text-lg uppercase tracking-wide text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Logout{name ? ` (${name})` : ""}
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-4 py-3 font-alice text-lg uppercase tracking-wide text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Login
                </Link>
              )}
            </li>
          </ul>
        </div>
      </Container>
    </header>
  );
}
"use client";

import { useMemo, useState } from "react";
import { faqs } from "@/lib/faq";
import clsx from "@/lib/clsx";
import { faqCocok } from "@/lib/faqSearch";

export function FaqList() {
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

 const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return faqs.map((item, i) => ({ item, i }));

    return faqs
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => faqCocok(q, item.q + " " + item.a));
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center gap-3 rounded-pill border border-white/25 bg-white/10 px-5 py-3 backdrop-blur">
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari pertanyaan…"
          aria-label="Cari pertanyaan"
          className="w-full bg-transparent font-alice text-white placeholder:text-white/50 focus:outline-none"
        />
      </div>

      {/* Tinggi TETAP: min-h + max-h sama, jadi kotak nggak nyusut walau
          isinya sisa satu. Daftar scroll di dalam. */}
      <div className="mt-6">
        <ul className="flex flex-col gap-3">
          {filtered.map(({ item, i }, pos) => {
            const open = openIdx === i;
            return (
              <li
                key={i}
                className="animate-faq-in overflow-hidden rounded-xl border border-cyan-300/40 bg-white/5 backdrop-blur"
                style={{ animationDelay: `${pos * 50}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                >
                  <span className="font-alice text-base font-bold uppercase tracking-wide text-white sm:text-lg">
                    {item.q}
                  </span>
                  <Chevron open={open} />
                </button>

                <div
                  className={clsx(
                    "grid transition-all duration-300 ease-out",
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 font-alice text-sm leading-relaxed text-white/85 sm:text-base">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}

          {filtered.length === 0 && (
            <li className="rounded-xl border border-white/15 bg-white/5 px-6 py-8 text-center font-alice text-white/70">
              Nggak ada pertanyaan yang cocok. Coba kata kunci lain.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={clsx(
        "h-5 w-5 shrink-0 text-cyan-200 transition-transform duration-300",
        open && "rotate-180",
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-5 w-5 shrink-0 text-white/60"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
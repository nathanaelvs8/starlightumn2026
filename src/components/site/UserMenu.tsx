"use client";

import { useState } from "react";

export function UserMenu({
  name,
  onLogout,
}: {
  name: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  const firstName = name.trim().split(/\s+/)[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-pill border border-cyan-300/30 bg-white/5 py-1.5 pl-1.5 pr-4 backdrop-blur transition-colors hover:border-cyan-300/60 hover:bg-white/10"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 font-alice text-sm font-bold text-[#0a1430] shadow-[0_0_12px_rgba(120,190,255,0.5)]">
          {firstName.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[130px] truncate font-alice text-sm text-white/90">
          {firstName}
        </span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={`h-4 w-4 text-white/50 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />

          <div className="absolute right-0 z-20 mt-3 w-44 overflow-hidden rounded-xl border border-white/15 bg-[#0a1430]/95 p-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-alice text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
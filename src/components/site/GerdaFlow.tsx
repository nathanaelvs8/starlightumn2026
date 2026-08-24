"use client";

import { useEffect, useRef, useState } from "react";
import { Asset } from "@/components/ui/Asset";
import { divisions } from "@/lib/divisions";
import { asset } from "@/lib/assets";
import {
  crestLayout,
  ZOOM,
  FOKUS_X,
  FOKUS_Y,
  SIZE_AKTIF,
  SIZE_NONAKTIF,
} from "@/lib/gerdaLayout";
import { TitleGlow } from "@/components/ui/TitleGlow";

type Member = { division: string; full_name: string; nim: string };
const PER_PAGE = 8;

export function GerdaFlow() {
  const [active, setActive] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Kamera (pixel) — digeser drag, TERPISAH dari divisi aktif.
  const [cam, setCam] = useState({ x: 0, y: 0 });

  // drag: bedain klik vs geser pakai jarak
  const dragging = useRef(false);
  const moved = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ukur = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    ukur();
    window.addEventListener("resize", ukur);
    return () => window.removeEventListener("resize", ukur);
  }, []);

  useEffect(() => {
    fetch("/api/gerda")
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []));
  }, []);

  const total = divisions.length;
  const activeDiv = divisions[active];
  useEffect(() => setPage(0), [active]);

  const grupW = (ZOOM / 100) * size.w;
  const grupH = (ZOOM / 100) * size.h;
  const fokusPx = { x: (FOKUS_X / 100) * size.w, y: (FOKUS_Y / 100) * size.h };

  // Pas klik divisi: kamera meluncur biar crest itu ke titik fokus.
  const pilih = (i: number) => {
    setActive(i);
    const cp = crestLayout[divisions[i].name] ?? { x: 50, y: 50 };
    setCam({
      x: fokusPx.x - (cp.x / 100) * grupW,
      y: fokusPx.y - (cp.y / 100) * grupH,
    });
  };

  // Kamera awal: divisi pertama di fokus
  useEffect(() => {
    if (!size.w) return;
    const cp = crestLayout[divisions[0].name] ?? { x: 0, y: 0 };
    setCam({
      x: fokusPx.x - (cp.x / 100) * grupW,
      y: fokusPx.y - (cp.y / 100) * grupH,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  const anggota = members.filter((m) => m.division === activeDiv?.name);
  const pageCount = Math.max(1, Math.ceil(anggota.length / PER_PAGE));
  const shown = anggota.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  // Hitung Y kamera dari X-nya, biar view selalu ngikut garis.
  // Interpolasi tinggi garis di titik fokus dari crest kiri & kanan.
  const camYdariX = (camX: number) => {
    const fx = fokusPx.x;
    const list = divisions
      .map((d) => {
        const cp = crestLayout[d.name] ?? { x: 50, y: 50 };
        return { px: camX + (cp.x / 100) * grupW, y: cp.y };
      })
      .sort((a, b) => a.px - b.px);

    // titik fokus di kiri semua crest → pakai crest pertama
    if (fx <= list[0].px) return fokusPx.y - (list[0].y / 100) * grupH;
    // di kanan semua → pakai terakhir
    if (fx >= list[list.length - 1].px)
      return fokusPx.y - (list[list.length - 1].y / 100) * grupH;

    // cari dua crest yang ngapit titik fokus, interpolasi y-nya
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].px <= fx && list[i + 1].px >= fx) {
        const span = list[i + 1].px - list[i].px || 1;
        const t = (fx - list[i].px) / span;
        const yP = list[i].y + (list[i + 1].y - list[i].y) * t;
        return fokusPx.y - (yP / 100) * grupH;
      }
    }
    return fokusPx.y - (list[0].y / 100) * grupH;
  };

  // ---- DRAG: geser X bebas, Y otomatis ngikut garis ----
  const onDown = (x: number) => {
    dragging.current = true;
    moved.current = false;
    lastX.current = x;
  };
  // Batas geser: nggak boleh lewat divisi pertama (kiri) & terakhir (kanan)
  const clampCamX = (x: number) => {
    const firstX = (crestLayout[divisions[0].name]?.x ?? 0) / 100 * grupW;
    const lastX =
      ((crestLayout[divisions[divisions.length - 1].name]?.x ?? 100) / 100) *
      grupW;
    // camX supaya crest pertama di fokus = maksimal (paling kanan digeser)
    const maxCam = fokusPx.x - firstX;
    // camX supaya crest terakhir di fokus = minimal (paling kiri digeser)
    const minCam = fokusPx.x - lastX;
    return Math.min(maxCam, Math.max(minCam, x));
  };

  const onMove = (x: number) => {
    if (!dragging.current) return;
    const dx = x - lastX.current;
    if (Math.abs(dx) > 2) moved.current = true;
    lastX.current = x;
    setCam((c) => {
      const nx = clampCamX(c.x + dx);
      return { x: nx, y: camYdariX(nx) };
    });
  };
  const onUp = () => {
    dragging.current = false;
  };

  return (
    <div className="relative">
      <div
        ref={stageRef}
        className="relative h-[85vh] w-screen cursor-grab select-none overflow-hidden active:cursor-grabbing"
        onMouseDown={(e) => onDown(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onUp}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: `${ZOOM}%`,
            height: `${ZOOM}%`,
            transform: `translate(${cam.x}px, ${cam.y}px)`,
            transition: dragging.current ? "none" : "transform 600ms ease-out",
          }}
        >
          <img
            src={asset.gerda.arus}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
          />

          {divisions.map((div, i) => {
            const cp = crestLayout[div.name] ?? { x: 50, y: 50 };
            const isActive = i === active;
            const wLayar = isActive ? SIZE_AKTIF : SIZE_NONAKTIF;
            const wPersenGrup = (wLayar / ZOOM) * 100;
            return (
              <button
                key={div.name}
                type="button"
                aria-label={div.name}
                onClick={() => {
                  // kalau barusan drag, jangan anggap klik
                  if (moved.current) return;
                  pilih(i);
                }}
                className="group absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
                style={{
                  left: `${cp.x}%`,
                  top: `${cp.y}%`,
                  width: `${wPersenGrup}%`,
                  zIndex: isActive ? 30 : 10,
                }}
              >
                <div
                  className="transition-all duration-300 group-hover:scale-110"
                  style={{
                    filter: isActive
                      ? "drop-shadow(0 0 24px rgba(150,200,255,0.75))"
                      : "none",
                    opacity: isActive ? 1 : 0.82,
                  }}
                >
                <div className="[&_img]:pointer-events-none [&_img]:select-none">
                    <Asset src={asset.gerda.crest(div.name)} alt={div.name} />
                </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel anggota */}
        <div className="absolute right-[12%] top-1/2 z-40 w-[38%] max-w-[440px] -translate-y-1/2 overflow-hidden rounded-2xl border border-white/25 bg-[#0a1430]/40 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-6">
          <TitleGlow className="text-center text-2xl sm:text-3xl">
            {activeDiv?.name}
          </TitleGlow>

          <ul className="mt-4 flex flex-col gap-2">
            {shown.length === 0 ? (
              <li className="text-center font-alice text-sm text-white/50">
                Belum ada anggota.
              </li>
            ) : (
              shown.map((m, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5 font-alice text-sm"
                >
                  <span className="text-white/90">{m.full_name}</span>
                  <span className="text-white/60">{m.nim}</span>
                </li>
              ))
            )}
          </ul>

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4 font-alice text-sm text-white/70">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="disabled:opacity-30"
              >
                ‹
              </button>
              <span>
                Page {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page === pageCount - 1}
                className="disabled:opacity-30"
              >
                ›
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
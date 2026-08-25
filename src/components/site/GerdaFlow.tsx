"use client";

import { useEffect, useRef, useState } from "react";
import { Asset } from "@/components/ui/Asset";
import { divisions } from "@/lib/divisions";
import { asset } from "@/lib/assets";
import { Comets } from "@/components/site/Comets";
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
const PER_PAGE = 5;

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
        className="relative h-[100svh] w-full cursor-grab select-none overflow-hidden active:cursor-grabbing"
        onMouseDown={(e) => onDown(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onUp}
      >
        {/* Background parallax — geser 0.15x kecepatan kamera, jadi
            gerak lebih lambat dari garis (efek kedalaman kayak Growtopia) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: `url("${asset.gerda.background}")`,
            backgroundSize: "160% 160%",
            backgroundPosition: `calc(50% + ${cam.x * 0.15}px) calc(50% + ${cam.y * 0.15}px)`,
          }}
        />
        {/* Komet — di belakang garis+crest, di atas background */}
        <Comets />
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


        {/* Isi kanan: nama divisi + list, di atas panel blur */}
        <div className="absolute right-[14%] top-1/2 z-40 w-[30%] max-w-[420px] -translate-y-1/2">
          {/* Judul divisi + fungsi — glow gelap nempel biar belakangnya
              kayak ketutup, tanpa kotak */}
          <TitleGlow className="text-center text-3xl sm:text-4xl">
            {activeDiv?.name}
          </TitleGlow>
          <p
            className="mt-1 text-center font-alice text-sm uppercase tracking-[0.2em] text-cyan-200/90"
            style={{ textShadow: "0 0 12px rgba(10,20,48,0.9), 0 0 6px rgba(10,20,48,0.9)" }}
          >
            {activeDiv?.role}
          </p>

          {/* Page x/y di kiri atas */}
          <p className="mb-2 mt-6 font-alice text-xs uppercase tracking-wide text-white/70">
            Page {page + 1} / {pageCount}
          </p>

          {/* Bilah anggota — fade tiap ganti divisi/page (key) */}
          <div key={`${active}-${page}`} className="animate-fade flex flex-col gap-2">
            {shown.length === 0 ? (
              <p
                className="text-center font-alice text-sm text-white/80"
                style={{ textShadow: "0 0 12px rgba(10,20,48,0.95), 0 0 6px rgba(10,20,48,0.95)" }}
              >
                Belum ada anggota.
              </p>
            ) : (
              shown.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-md bg-white/90 px-3.5 py-2 font-alice text-xs text-[#0a1430] shadow-[0_0_28px_rgba(255,255,255,0.85)]"
                >
                  <span className="font-semibold">{m.full_name}</span>
                  <span className="text-[#0a1430]/70">{m.nim}</span>
                </div>
              ))
            )}
          </div>

          {/* Panah kiri-kanan */}
          {pageCount > 1 && (
            <div className="mt-5 flex justify-center">
              <div className="flex items-center gap-3 rounded-pill border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Sebelumnya"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/40 transition-colors hover:bg-white/15 disabled:opacity-30"
                >
                  <img
                    src={asset.gerda.panah}
                    alt=""
                    draggable={false}
                    className="h-6 w-6 -scale-x-100"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={page === pageCount - 1}
                  aria-label="Berikutnya"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/40 transition-colors hover:bg-white/15 disabled:opacity-30"
                >
                  <img
                    src={asset.gerda.panah}
                    alt=""
                    draggable={false}
                    className="h-6 w-6"
                  />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
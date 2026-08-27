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
  ARUS_RATIO,
  crestLayoutHP,
  ZOOM_HP,
  FOKUS_X_HP,
  FOKUS_Y_HP,
  SIZE_AKTIF_HP,
  SIZE_NONAKTIF_HP,
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
  const [isHP, setIsHP] = useState(false);

  const [cam, setCam] = useState({ x: 0, y: 0 });

  const dragging = useRef(false);
  const moved = useRef(false);
  const lastX = useRef(0);

  // Ukur panggung arus + deteksi HP (< 1024px)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ukur = () => {
      setSize((prev) => {
        const w = el.clientWidth;
        if (prev.w === w && prev.h !== 0) return prev;
        return { w, h: el.clientHeight };
      });
      setIsHP(window.innerWidth < 1024);
    };
    ukur();
    window.addEventListener("resize", ukur);
    return () => window.removeEventListener("resize", ukur);
  }, []);

  useEffect(() => {
    fetch("/api/gerda")
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []));
  }, []);

  const activeDiv = divisions[active];
  useEffect(() => setPage(0), [active]);

  // Pilih setelan sesuai HP / desktop
  const LAYOUT = isHP ? crestLayoutHP : crestLayout;
  const zoom = isHP ? ZOOM_HP : ZOOM;
  const fokusX = isHP ? FOKUS_X_HP : FOKUS_X;
  const fokusY = isHP ? FOKUS_Y_HP : FOKUS_Y;
  const sizeAktif = isHP ? SIZE_AKTIF_HP : SIZE_AKTIF;
  const sizeNonaktif = isHP ? SIZE_NONAKTIF_HP : SIZE_NONAKTIF;

  const grupW = (zoom / 100) * size.w;
  const grupH = grupW / ARUS_RATIO;
  const fokusPx = { x: (fokusX / 100) * size.w, y: (fokusY / 100) * size.h };

  const pilih = (i: number) => {
    setActive(i);
    const cp = LAYOUT[divisions[i].name] ?? { x: 50, y: 50 };
    setCam({
      x: fokusPx.x - (cp.x / 100) * grupW,
      y: fokusPx.y - (cp.y / 100) * grupH,
    });
  };

  // Kamera awal / pas ganti layout: divisi aktif di fokus
  useEffect(() => {
    if (!size.w) return;
    const cp = LAYOUT[divisions[active].name] ?? { x: 0, y: 0 };
    setCam({
      x: fokusPx.x - (cp.x / 100) * grupW,
      y: fokusPx.y - (cp.y / 100) * grupH,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [size.w, isHP]);

  const anggota = members.filter((m) => m.division === activeDiv?.name);
  const pageCount = Math.max(1, Math.ceil(anggota.length / PER_PAGE));
  const shown = anggota.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const camYdariX = (camX: number) => {
    const fx = fokusPx.x;
    const list = divisions
      .map((d) => {
        const cp = LAYOUT[d.name] ?? { x: 50, y: 50 };
        return { px: camX + (cp.x / 100) * grupW, y: cp.y };
      })
      .sort((a, b) => a.px - b.px);

    if (fx <= list[0].px) return fokusPx.y - (list[0].y / 100) * grupH;
    if (fx >= list[list.length - 1].px)
      return fokusPx.y - (list[list.length - 1].y / 100) * grupH;

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

  const onDown = (x: number) => {
    dragging.current = true;
    moved.current = false;
    lastX.current = x;
  };
  const clampCamX = (x: number) => {
    const firstX = ((LAYOUT[divisions[0].name]?.x ?? 0) / 100) * grupW;
    const lastX =
      ((LAYOUT[divisions[divisions.length - 1].name]?.x ?? 100) / 100) * grupW;
    const maxCam = fokusPx.x - firstX;
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

  // ====== Panggung arus (dipakai desktop full-screen & HP panel atas) ======
  const Arus = (
    <div
      ref={stageRef}
      className="relative h-full w-full cursor-grab select-none overflow-hidden active:cursor-grabbing"
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
          width: `${zoom}%`,
          aspectRatio: `${ARUS_RATIO}`,
          transform: `translate(${cam.x}px, ${cam.y}px)`,
          transition: dragging.current ? "none" : "transform 600ms ease-out",
        }}
      >
        <img
          src={asset.gerda.arus}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full object-fill"
        />

        {divisions.map((div, i) => {
          const cp = LAYOUT[div.name] ?? { x: 50, y: 50 };
          const isActive = i === active;
          const wLayar = isActive ? sizeAktif : sizeNonaktif;
          const wPersenGrup = (wLayar / zoom) * 100;
          return (
            <button
              key={div.name}
              type="button"
              aria-label={div.name}
              onClick={() => {
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
    </div>
  );

  // ====== Blok list anggota (dipakai desktop kanan & HP bawah) ======
  const ListAnggota = (
    <>
      <TitleGlow className="text-center text-3xl sm:text-4xl">
        {activeDiv?.name}
      </TitleGlow>
      <p
        className="mt-1 text-center font-alice text-sm uppercase tracking-[0.2em] text-cyan-200/90"
        style={{
          textShadow: "0 0 12px rgba(10,20,48,0.9), 0 0 6px rgba(10,20,48,0.9)",
        }}
      >
        {activeDiv?.role}
      </p>

      <p className="mb-2 mt-6 font-alice text-xs uppercase tracking-wide text-white/70">
        Page {page + 1} / {pageCount}
      </p>

      <div key={`${active}-${page}`} className="animate-fade flex flex-col gap-2">
        {shown.length === 0 ? (
          <p
            className="text-center font-alice text-sm text-white/80"
            style={{
              textShadow:
                "0 0 12px rgba(10,20,48,0.95), 0 0 6px rgba(10,20,48,0.95)",
            }}
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
    </>
  );

  // Background parallax (sama buat dua layout)
  const Background = (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundImage: `url("${asset.gerda.background}")`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    />
  );

  // ====== HP: atas arus, bawah list ======
  if (isHP) {
    return (
      <div className="relative flex h-[100svh] w-full flex-col overflow-hidden">
        {Background}
        <Comets />
        {/* Atas — arus, tinggi tetap 50% */}
        <div className="relative h-1/2 w-full shrink-0">{Arus}</div>
        {/* Bawah — list ngisi sisa ruang & nempel bawah, ditarik naik
            biar numpuk ke arus. Gradient biar garis nyatu. */}
        <div
          className="relative z-20 -mt-[12vh] flex-1 w-full overflow-y-auto px-6 pb-6 pt-8"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(10,20,48,0.55) 15%, rgba(10,20,48,0.8) 35%)",
          }}
        >
          <div className="mx-auto w-full max-w-md">{ListAnggota}</div>
        </div>
      </div>
    );
  }

  // ====== Desktop: full-screen arus + list mengambang kanan ======
  return (
    <div className="relative h-[100svh] w-full overflow-hidden">
      {Background}
      <Comets />
      {Arus}
      <div className="absolute right-[14%] top-1/2 z-40 w-[30%] max-w-[420px] -translate-y-1/2">
        {ListAnggota}
      </div>
    </div>
  );
}
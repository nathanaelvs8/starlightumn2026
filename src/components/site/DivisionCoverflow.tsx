"use client";

import { useEffect, useRef, useState } from "react";
import { divisions } from "@/lib/divisions";
import clsx from "@/lib/clsx";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

const STEP = [0, 250, 390, 530];
const STEP_HP = [0, 150, 240, 330];
const SCALE = [1, 0.74, 0.62, 0.52];
const OPACITY = [1, 1, 1, 1];

export function DivisionCoverflow() {
  const [active, setActive] = useState(0);
  const total = divisions.length;
  const accent = divisions[active].color;

  const go = (dir: number) => setActive((p) => (p + dir + total) % total);

  const jumpTo = (target: number) => {
    if (target === active) return;
    let diff = target - active;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    const dir = diff > 0 ? 1 : -1;
    const steps = Math.abs(diff);
    for (let s = 1; s <= steps; s++) {
      setTimeout(() => setActive((p) => (p + dir + total) % total), s * 90);
    }
  };

  const [layers, setLayers] = useState<[string, string]>([
    asset.division.bg(divisions[0].name),
    "",
  ]);
  const [front, setFront] = useState(0);
  const frontRef = useRef(0);
  const tokenRef = useRef(0);

  useEffect(() => {
    const url = asset.division.bg(divisions[active].name);
    const token = ++tokenRef.current;
    const img = new window.Image();
    img.onload = () => {
      if (token !== tokenRef.current) return;
      const idle = frontRef.current === 0 ? 1 : 0;
      setLayers((prev) => {
        const next = [...prev] as [string, string];
        next[idle] = url;
        return next;
      });
      frontRef.current = idle;
      requestAnimationFrame(() => setFront(idle));
    };
    img.src = url;
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isHP, setIsHP] = useState(false);
  useEffect(() => {
    const cek = () => setIsHP(window.innerWidth < 640);
    cek();
    window.addEventListener("resize", cek);
    return () => window.removeEventListener("resize", cek);
  }, []);

  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <div className="w-full">
      <style>{`
        @keyframes divFloat {0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes divDrift {0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(-2%,1.5%,0)}}
        @keyframes divTwinkleA {0%,100%{opacity:.30}50%{opacity:.55}}
        @keyframes divTwinkleB {0%,100%{opacity:.45}50%{opacity:.75}}
        @media (prefers-reduced-motion: reduce){ .div-anim{animation:none !important} }
      `}</style>

      <div aria-hidden className="fixed inset-0 -z-20 bg-[#0a1430]" />

      {layers.map((src, i) => (
        <div
          key={i}
          aria-hidden
          className="fixed inset-0 -z-10 bg-cover bg-center transition-opacity duration-[1100ms] ease-in-out"
          style={{
            backgroundImage: src ? `url("${src}")` : undefined,
            opacity: front === i ? 1 : 0,
          }}
        />
      ))}

      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a1430]/40" />

      <div
        aria-hidden
        className="div-anim pointer-events-none fixed inset-0 -z-10"
        style={{ animation: "divTwinkleA 7s ease-in-out infinite" }}
      >
        <div
          className="div-anim h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url("${asset.division.bintang}")`,
            animation: "divDrift 42s ease-in-out infinite",
          }}
        />
      </div>

      <div
        aria-hidden
        className="div-anim pointer-events-none fixed inset-0 -z-10"
        style={{
          transform: "scaleX(-1)",
          animation: "divTwinkleB 5s ease-in-out infinite",
        }}
      >
        <div
          className="div-anim h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url("${asset.division.bintang}")`,
            animation: "divDrift 28s ease-in-out infinite",
          }}
        />
      </div>

      <div
        className="relative flex h-[38svh] items-center justify-center sm:h-[470px] lg:h-[42svh]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Arrow dir="left" onClick={() => go(-1)} />

        <div
          className="relative flex h-full w-full items-center justify-center"
          style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
        >
          {divisions.map((div, i) => {
            let offset = i - active;
            if (offset > total / 2) offset -= total;
            if (offset < -total / 2) offset += total;

            const abs = Math.abs(offset);
            if (abs > 3) return null;

            const sign = offset < 0 ? -1 : 1;
            const translateX = sign * (isHP ? STEP_HP : STEP)[abs];
            const rot = offset === 0 ? 0 : sign * -34;
            const isActive = abs === 0;

            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={div.name}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  transform: `translateX(${translateX}px) rotateY(${rot}deg) scale(${SCALE[abs]})`,
                  opacity: OPACITY[abs],
                  zIndex: 10 - abs,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="div-anim"
                  style={{
                    animation: "divFloat 4s ease-in-out infinite",
                    animationDelay: `${(i % 5) * 0.4}s`,
                  }}
                >
                  <div
                    className={clsx(
                      "relative h-[215px] w-[168px] overflow-hidden rounded-2xl sm:h-[344px] sm:w-[268px] lg:h-[268px] lg:w-[209px]",
                      isActive && "animate-card-flip",
                    )}
                    style={undefined}
                  >
                    <img
                      src={asset.division.card(div.name)}
                      alt={div.name}
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Arrow dir="right" onClick={() => go(1)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 sm:mt-8 lg:mt-4">
        {divisions.map((_, i) => {
          const on = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => jumpTo(i)}
              aria-label={`Ke divisi ${i + 1}`}
              className="group grid place-items-center py-1"
            >
              <span
                className="block h-[9px] rounded-full transition-all duration-300 group-hover:scale-125"
                style={{
                  width: on ? 26 : 9,
                  backgroundColor: on ? accent : "rgba(255,255,255,0.28)",
                  boxShadow: on ? `0 0 12px ${accent}aa` : "none",
                }}
              />
            </button>
          );
        })}
      </div>

      <div
        className="animate-panel-in mx-auto mt-4 max-w-2xl rounded-2xl border bg-white/5 p-5 text-center backdrop-blur sm:mt-10 sm:p-10 lg:mt-5 lg:p-6"
        style={{
          borderColor: `${accent}55`,
          boxShadow: `0 0 30px ${accent}22`,
          transition: "border-color 1100ms, box-shadow 1100ms",
        }}
      >
        <div key={active} className="animate-fade">
          <div
            style={{
              filter: `drop-shadow(0 0 16px ${accent}aa)`,
              transition: "filter 1100ms",
            }}
          >
            <TitleGlow className="text-3xl sm:text-4xl">
              {divisions[active].name}
            </TitleGlow>
          </div>
          <p
            className="mt-1 font-alice text-sm uppercase tracking-[0.2em]"
            style={{ color: accent, transition: "color 1100ms" }}
          >
            {divisions[active].role}
          </p>
          <div
            className="mx-auto mt-3 h-px w-16"
            style={{
              backgroundColor: `${accent}88`,
              transition: "background-color 1100ms",
            }}
          />
          <p className="mt-5 font-alice leading-relaxed text-white/80">
            {divisions[active].desc}
          </p>
        </div>
      </div>
    </div>
  );
}

function Arrow({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Sebelumnya" : "Berikutnya"}
      className={clsx(
        "absolute z-20 grid h-11 w-11 place-items-center rounded-pill border border-white/30 bg-black/30 text-xl text-white backdrop-blur transition-colors hover:bg-black/50",
        dir === "left" ? "left-2 sm:left-6" : "right-2 sm:right-6",
      )}
    >
      {dir === "left" ? "‹" : "›"}
    </button>
  );
}
"use client";

import { useState } from "react";
import { divisions } from "@/lib/divisions";
// import { ButtonLink } from "@/components/ui/Button";
import clsx from "@/lib/clsx";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

/**
 * Coverflow 13 kartu divisi.
 *
 * - Kartu tengah paling besar (≈230×280) dengan glow, MEMBALIK tiap ganti.
 * - Kartu samping mengecil & memudar makin jauh dari tengah.
 * - Panah ‹ › + dot indicator.
 *
 * Card pakai gambar asli: public/images/division/divisi-1.png … divisi-13.png
 * (urut sesuai divisions.ts). Pakai <img> biasa, BUKAN <Asset>, karena
 * Asset punya bug auto-trim yang kadang nyembunyiin gambar.
 */
export function DivisionCoverflow() {
    const [active, setActive] = useState(0);
    const total = divisions.length;

    const go = (dir: number) => setActive((prev) => (prev + dir + total) % total);

    /**
     * Lompat ke kartu mana pun. Kalau jauh, digeser cepat bertahap lewat
     * kartu di antaranya biar mulus. Dibikin dari `active` sekarang, terus
     * dijadwalin satu-satu — nggak boleh setActive berlapis (bikin kacau).
     */
    const jumpTo = (target: number) => {
        if (target === active) return;

        let diff = target - active;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        const dir = diff > 0 ? 1 : -1;
        const steps = Math.abs(diff);

        for (let s = 1; s <= steps; s++) {
        setTimeout(() => {
            setActive((prev) => (prev + dir + total) % total);
        }, s * 90);
        }
    };

    return (
        <div className="w-full">
        {/* Stage coverflow */}
        <div className="relative flex h-[340px] items-center justify-center overflow-hidden sm:h-[400px]">
            <Arrow dir="left" onClick={() => go(-1)} />

            <div className="relative flex h-full w-full items-center justify-center">
            {divisions.map((div, i) => {
                let offset = i - active;
                if (offset > total / 2) offset -= total;
                if (offset < -total / 2) offset += total;

                const abs = Math.abs(offset);
                if (abs > 4) return null;

                const scale =
                abs === 0 ? 1 : abs === 1 ? 0.74 : abs === 2 ? 0.54 : abs === 3 ? 0.4 : 0.3;
                const opacity =
                abs === 0 ? 1 : abs === 1 ? 0.7 : abs === 2 ? 0.45 : abs === 3 ? 0.22 : 0;

                const step = (n: number) =>
                n === 0 ? 0 : n === 1 ? 150 : n === 2 ? 265 : n === 3 ? 350 : 415;
                const sign = offset < 0 ? -1 : 1;
                const translateX = sign * step(abs);

                const zIndex = 10 - abs;
                const isActive = abs === 0;

                return (
                <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={div.name}
                    className="absolute transition-all duration-500 ease-out"
                    style={{
                    transform: `translateX(${translateX}px) scale(${scale})`,
                    opacity,
                    zIndex,
                    }}
                >
                    <div
                    className={clsx(
                        "relative h-[296px] w-[230px]",
                        isActive && "animate-card-flip",
                    )}
                    >
                    <div
                        className={clsx(
                        "relative h-full w-full overflow-hidden rounded-2xl",
                        isActive
                            ? "ring-2 ring-cyan-300/70 shadow-[0_0_34px_rgba(103,232,249,0.4)]"
                            : "ring-1 ring-white/10",
                        )}
                    >
                        <img
                        src={asset.division.card(i + 1)}
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

        {/* Dot indicator */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {divisions.map((_, i) => (
            <button
                key={i}
                type="button"
                onClick={() => jumpTo(i)}
                aria-label={`Ke divisi ${i + 1}`}
                className={clsx(
                "h-2 rounded-pill transition-all duration-300",
                i === active
                    ? "w-6 bg-cyan-300"
                    : "w-2 bg-white/30 hover:bg-white/50",
                )}
            />
            ))}
        </div>

        {/* Panel detail */}
        <div className="animate-panel-in mx-auto mt-10 max-w-2xl rounded-2xl border border-cyan-300/30 bg-white/5 p-8 text-center backdrop-blur sm:p-10">
            <div key={active} className="animate-fade">
            <TitleGlow className="text-3xl sm:text-4xl">
                {divisions[active].name}
            </TitleGlow>
            <p className="mt-1 font-alice text-sm uppercase tracking-[0.2em] text-cyan-200/80">
                {divisions[active].role}
            </p>
            <div className="mx-auto mt-3 h-px w-16 bg-cyan-300/50" />
            <p className="mt-5 font-alice leading-relaxed text-white/80">
                {divisions[active].desc}
            </p>
            </div>
            {/* <div className="mt-7">
            <ButtonLink href="#">More Info</ButtonLink>
            </div> */}
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
"use client";

import { useState } from "react";
import { divisions } from "@/lib/divisions";
import { ButtonLink } from "@/components/ui/Button";
import clsx from "@/lib/clsx";
import { TitleGlow } from "@/components/ui/TitleGlow";

/**
 * Coverflow 13 kartu divisi.
 *
 * - Kartu tengah paling besar (≈230×280) dengan badge "active".
 * - Kartu samping mengecil & memudar makin jauh dari tengah.
 * - Panah ‹ › kiri-kanan buat geser.
 * - Dot indicator: yang aktif jadi pill memanjang.
 * - Kartu tengah MEMBALIK (flip kartu sihir) tiap ganti divisi.
 *
 * Card masih placeholder (border dashed + label) — nunggu aset final
 * dari tim visual. Begitu asetnya ada, ganti isi kotak placeholder
 * jadi <Asset src={asset.division.card(...)} ... />.
 */
export function DivisionCoverflow() {
    const [active, setActive] = useState(0);
    const total = divisions.length;

    const go = (dir: number) => setActive((prev) => (prev + dir + total) % total);

    /**
     * Lompat ke kartu mana pun. Kalau jaraknya jauh, digeser cepat
     * bertahap lewat kartu di antaranya — biar nggak ada kartu yang
     * "meletik" muncul mendadak dari luar layar.
     */
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

        // jadwalin tiap langkah menuju target, satu per 90ms
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
                // Render 1 lebih banyak dari yang keliatan (batas 4), biar
                // kartu yang mau masuk udah ada di posisinya sebelum tampil
                // — ini yang bikin geser panah jadi mulus, nggak "meletik".
                if (abs > 4) return null;

                const scale =
                abs === 0 ? 1 : abs === 1 ? 0.74 : abs === 2 ? 0.54 : abs === 3 ? 0.4 : 0.3;
                const opacity =
                abs === 0 ? 1 : abs === 1 ? 0.7 : abs === 2 ? 0.45 : abs === 3 ? 0.22 : 0;

                // Jarak antar kartu ikut mengecil sesuai skala, jadi kartu
                // yang lebih kecil nggak kelihatan makin jauh. Dijumlahin
                // bertahap, bukan offset * angka tetap.
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
                        "relative h-[280px] w-[230px]",
                        isActive && "animate-card-flip",
                    )}
                    >
                    <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cyan-300/50 bg-white/5 p-4 text-center backdrop-blur">
                        <span className="text-4xl opacity-40">✦</span>
                        <span className="font-alice text-xs uppercase tracking-wide text-white/70">
                        Card Divisi
                        </span>
                        <span className="font-alice text-[10px] leading-tight text-white/50">
                        menunggu asset dari tim visual
                        <br />
                        ≈230×280
                        </span>
                        {isActive && (
                        <span className="absolute top-3 rounded-pill bg-cyan-400/90 px-3 py-0.5 text-[10px] font-bold uppercase text-[#0a1430]">
                            active
                        </span>
                        )}
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

        {/* Panel detail — animate-panel-in: fade pas halaman kebuka.
            Isi di dalamnya pakai key={active} biar fade ulang tiap
            ganti kartu. */}
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
            <div className="mt-7">
            <ButtonLink href="#">More Info</ButtonLink>
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
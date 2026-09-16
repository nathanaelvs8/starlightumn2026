"use client";

import { useState } from "react";
import { asset } from "@/lib/assets";

/**
 * Video di dalam bingkai emas ukiran.
 *
 * === Angka-angka di bawah ===
 *
 * File bingkainya 1280x778 dengan lubang tembus di tengah. Lubang itu
 * DIUKUR dari filenya pas dikonversi (lihat convert-stages.js), bukan
 * dikira-kira: lubangnya 898x504 alias tepat 16:9, dan posisinya
 * simetris — 14,92% dari kiri & kanan, 17,61% dari atas & bawah.
 *
 * Jadi videonya ditaruh persis di kotak itu, terus gambar bingkainya
 * ditumpuk DI ATASNYA. Bingkainya dikasih pointer-events-none supaya
 * ukirannya nggak ngalangin tombol putar.
 *
 * Kalau nanti file bingkainya diganti, jalanin ulang convert-stages.js
 * dan samain empat angka di bawah ini sama keluaran skripnya.
 *
 * === Kenapa YouTube-nya nggak langsung dimuat ===
 *
 * Iframe YouTube itu berat (±1MB + skrip pelacak) dan bakal kemuat
 * walaupun videonya nggak pernah ditonton. Jadi yang ditampilin duluan
 * cuma gambar sampulnya; iframe-nya baru dibikin pas tombol putar
 * dipencet. Halaman jadi ringan dan nggak naruh cookie pihak ketiga
 * sebelum pengunjungnya milih nonton.
 */

const BINGKAI_RASIO = "1280 / 778";
const LUBANG = { left: "14.92%", right: "14.92%", top: "17.61%", bottom: "17.61%" };

export function VideoFrame({
  youtubeId,
  title,
}: {
  youtubeId?: string;
  title: string;
}) {
  const [main, setMain] = useState(false);

  return (
    <div
      className="relative mx-auto w-full max-w-5xl"
      style={{ aspectRatio: BINGKAI_RASIO }}
    >
      {/* Lubang bingkai — isinya video / sampul / placeholder. */}
      <div className="absolute overflow-hidden bg-black/70" style={LUBANG}>
        {!youtubeId ? (
          <Placeholder />
        ) : main ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setMain(true)}
            className="group relative h-full w-full"
            aria-label={`Putar ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-white/80 bg-black/45 backdrop-blur transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
                <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 sm:h-9 sm:w-9" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>

      {/* Ukiran emasnya, ditumpuk di atas. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.stages.frame}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
      />
    </div>
  );
}

/** Tampilan sementara selama videonya belum ada. */
function Placeholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0a1430] text-center">
      <svg viewBox="0 0 24 24" className="h-9 w-9 opacity-40" fill="white">
        <path d="M8 5v14l11-7z" />
      </svg>
      <span className="font-alice text-xs uppercase tracking-[0.2em] text-white/45 sm:text-sm">
        Trailer segera hadir
      </span>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { divisions } from "@/lib/divisions";
import clsx from "@/lib/clsx";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

const STEP = [0, 250, 390, 530];
/*
  HP: cuma SATU kartu tetangga tiap sisi, dan posisinya ditarik masuk
  (±118px) biar kartunya utuh di dalam layar. Dulu ±150/240/330 — kartu
  tetangga kepotong lurus di pinggir layar dan ketumpuk tombol panah.
  Kartu ke-2 & ke-3 tetap dirender (biar animasi gesernya mulus) tapi
  disembunyiin (OPACITY_HP 0).
*/
const STEP_HP = [0, 118, 190, 260];
const SCALE = [1, 0.74, 0.62, 0.52];
const OPACITY = [1, 1, 1, 1];
const OPACITY_HP = [1, 0.9, 0, 0];

/** `awal` = indeks kartu yang kebuka pertama (dari ?divisi=, lihat page.tsx). */
export function DivisionCoverflow({ awal = 0 }: { awal?: number }) {
  const [active, setActive] = useState(awal);
  const total = divisions.length;
  const accent = divisions[active].color;

  /* Link ke ?divisi= pas udah di halaman ini (mis. kredit di footer):
     komponennya nggak dipasang ulang, cuma `awal`-nya yang berubah. */
  useEffect(() => setActive(awal), [awal]);

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
    asset.division.bg(divisions[awal].name),
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
      /*
        Panah kiri/kanan diikat ke window, jadi kepencet di MANA pun
        halaman ini bakal geser coverflow-nya. Masalahnya kalau yang
        lagi difokus itu kotak isian: orang mau mindahin kursor di
        dalam teks, yang jalan malah kartunya. Sama juga kalau dia lagi
        nyoba pilih teks pakai keyboard.

        Jadi dicek dulu — kalau fokusnya lagi di tempat mengetik,
        biarin tombolnya jalan sebagaimana mestinya.
      */
      const f = document.activeElement as HTMLElement | null;
      if (
        f &&
        (f.tagName === "INPUT" ||
          f.tagName === "TEXTAREA" ||
          f.tagName === "SELECT" ||
          f.isContentEditable)
      ) {
        return;
      }
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

      <div aria-hidden className="latar-layar -z-20 bg-night" />

      {layers.map((src, i) => (
        <div
          key={i}
          aria-hidden
          className="latar-layar -z-10 bg-cover bg-center transition-opacity duration-[1100ms] ease-in-out"
          style={{
            backgroundImage: src ? `url("${src}")` : undefined,
            opacity: front === i ? 1 : 0,
          }}
        />
      ))}

      <div aria-hidden className="latar-layar -z-10 bg-night/40" />

      {/* Khusus HP: tepi layar digelapin halus (vignette). Di layar tegak
          yang kelihatan cuma bagian TENGAH gambar latar — bagian yang
          paling terang & paling rata — jadi kesannya pucat dan datar.
          Tepi yang lebih gelap ngasih kedalaman & bikin kartunya nyala. */}
      <div
        aria-hidden
        className="latar-layar -z-10 sm:hidden"
        style={{
          background:
            "radial-gradient(ellipse 110% 65% at 50% 42%, transparent 35%, rgb(var(--c-night-rgb) / 0.6) 100%)",
        }}
      />

      {/*
        Dua lapis rasi bintang (yang kedua dicerminkan).

        Gambarnya lebar banget (1920×682). Di HP yang layarnya tegak,
        `cover` cuma nampilin ±16% bagian tengahnya — rasi-rasinya
        kepotong semua, sisa satu-dua di pinggir. Jadi di HP (max-sm)
        gambarnya dikecilin (300% lebar layar) dan diulang ke bawah, dan
        tiap lapis ngambil potongan yang beda (kiri / kanan gambar).
        Hasilnya rasinya kelihatan nyebar di seluruh layar.
      */}
      <div
        aria-hidden
        className="div-anim pointer-events-none latar-layar -z-10"
        style={{ animation: "divTwinkleA 7s ease-in-out infinite" }}
      >
        <div
          className="div-anim h-full w-full bg-cover bg-center max-sm:bg-[length:300%_auto] max-sm:bg-[position:20%_0] max-sm:bg-repeat-y"
          style={{
            backgroundImage: `url("${asset.division.bintang}")`,
            animation: "divDrift 42s ease-in-out infinite",
          }}
        />
      </div>

      <div
        aria-hidden
        className="div-anim pointer-events-none latar-layar -z-10"
        style={{
          transform: "scaleX(-1)",
          animation: "divTwinkleB 5s ease-in-out infinite",
        }}
      >
        <div
          className="div-anim h-full w-full bg-cover bg-center max-sm:bg-[length:300%_auto] max-sm:bg-[position:80%_45%] max-sm:bg-repeat-y"
          style={{
            backgroundImage: `url("${asset.division.bintang}")`,
            animation: "divDrift 28s ease-in-out infinite",
          }}
        />
      </div>

      {/*
        `overflow-hidden` WAJIB di sini.

        Kartu-kartu di dalamnya `absolute` dan digeser sampai ±330px
        (HP) / ±530px (>=640px) dari tengah. Nggak ada satu pun leluhur
        yang motong, dan `overflow-x` juga nggak diset di globals.css —
        jadi kartu terjauh nongol jauh di luar layar dan halamannya bisa
        digeser ke samping. Di layar 360px luberannya ±194px.

        Efeknya buat yang pegang HP: swipe vertikal ke bawah sering
        kebaca sebagai geser mendatar, jadi halaman mental ke samping
        pas dia cuma mau scroll.

        Yang kepotong cuma bagian kartu yang MEMANG udah di luar layar,
        jadi tampilannya sendiri nggak berubah.
      */}
      <div
        className="relative flex h-[38svh] items-center justify-center overflow-hidden sm:h-[470px] lg:h-[42svh]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Panah di samping kartu cuma dari sm ke atas. Di HP panahnya
            pindah ke baris indikator di bawah — di sini dia nutupin kartu. */}
        <Arrow dir="left" onClick={() => go(-1)} className="absolute left-2 z-20 hidden sm:left-6 sm:grid" />

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
                tabIndex={isHP && OPACITY_HP[abs] === 0 ? -1 : undefined}
                style={{
                  transform: `translateX(${translateX}px) rotateY(${rot}deg) scale(${SCALE[abs]})`,
                  opacity: (isHP ? OPACITY_HP : OPACITY)[abs],
                  // kartu yang disembunyiin di HP jangan bisa kepencet
                  pointerEvents: isHP && OPACITY_HP[abs] === 0 ? "none" : undefined,
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

        <Arrow dir="right" onClick={() => go(1)} className="absolute right-2 z-20 hidden sm:right-6 sm:grid" />
      </div>

      {/*
        Indikator: jalur rasi — kerlip empat sudut (bentuk yang sama kayak
        di lingkaran sihir & FAQ) disambung satu garis tipis. Yang aktif
        lebih besar & nyala warna divisinya. Dulu titik bulat + pil.
      */}
      <div className="mt-3 flex items-center justify-center gap-2 sm:mt-8 lg:mt-4">
        {/* HP: panah di kiri-kanan jalur indikator (lebih kecil biar muat
            di layar 360px). */}
        <Arrow dir="left" onClick={() => go(-1)} kecil className="grid sm:hidden" />
        <div className="relative flex items-center gap-2 sm:gap-2.5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
        {divisions.map((_, i) => {
          const on = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => jumpTo(i)}
              aria-label={`Ke divisi ${divisions[i].name}`}
              aria-current={on ? "true" : undefined}
              /*
                Area sentuh dilebarin TANPA mengubah tata letak.
                Titiknya tetap 9px dan jaraknya tetap sama persis.
                Caranya: padding menambah kotak yang bisa diketuk,
                margin negatif menarik balik ruang yang dimakannya.
                  tinggi  9 + 17·2 − 13·2 = 17px  (sama kayak py-1 dulu)
                  lebar   9 +  5·2 −  5·2 =  9px  (sama)
                Area efektifnya jadi 19×43px, dari yang tadinya 9×17px.

                Kenapa nggak 44×44 sesuai panduan Apple/Android: jarak
                antar titik cuma ±19px. Kotak 44px bakal saling tumpuk
                sama titik sebelahnya, jadi ngetuk titik 5 malah kena
                titik 6 — lebih parah dari masalah aslinya. 19×43 itu
                yang paling besar yang masih muat tanpa tabrakan.

                Kalau mau beneran 44×44, titiknya harus direnggangin —
                dan itu mengubah tampilan, jadi nggak saya kerjain.
              */
              className="group relative grid place-items-center px-[5px] py-[17px] -mx-[5px] -my-[13px]"
            >
              {/* Slot setinggi 18px buat semua (yang aktif 18px, yang
                  lain 9px di tengahnya) — jadi baris indikatornya nggak
                  naik-turun pas ganti divisi. */}
              <span
                className="grid h-[18px] place-items-center transition-[width] duration-300"
                style={{ width: on ? 18 : 9 }}
              >
                <svg
                  viewBox="0 0 12 12"
                  aria-hidden
                  className="block transition-all duration-300 [@media(hover:hover)]:group-hover:scale-125"
                  style={{
                    width: on ? 18 : 9,
                    height: on ? 18 : 9,
                    color: on ? accent : "rgba(255,255,255,0.4)",
                    filter: on ? `drop-shadow(0 0 5px ${accent})` : "none",
                  }}
                >
                  <path d="M6 0Q6.9 5.1 12 6Q6.9 6.9 6 12Q5.1 6.9 0 6Q5.1 5.1 6 0Z" fill="currentColor" />
                </svg>
              </span>
            </button>
          );
        })}
        </div>
        <Arrow dir="right" onClick={() => go(1)} kecil className="grid sm:hidden" />
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

/**
 * Tombol panah. Posisi & tampil/sembunyi-nya (display) diatur pemanggil
 * lewat `className` — ada dua pasang: di samping kartu (sm+) dan di baris
 * indikator (HP). `kecil` = versi HP (36px, biar muat di layar 360px).
 */
function Arrow({
  dir,
  onClick,
  className,
  kecil,
}: {
  dir: "left" | "right";
  onClick: () => void;
  className?: string;
  kecil?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Sebelumnya" : "Berikutnya"}
      className={clsx(
        "shrink-0 place-items-center rounded-pill border border-white/30 bg-black/30 text-white backdrop-blur transition-colors [@media(hover:hover)]:hover:bg-black/50",
        kecil ? "h-9 w-9 text-lg" : "h-11 w-11 text-xl",
        className,
      )}
    >
      {dir === "left" ? "‹" : "›"}
    </button>
  );
}
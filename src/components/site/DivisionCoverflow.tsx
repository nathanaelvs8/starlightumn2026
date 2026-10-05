"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { divisions } from "@/lib/divisions";
import clsx from "@/lib/clsx";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { MagicCircle } from "@/components/site/MagicCircle";
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
  /** Layar penuh panggung tim (tombol "Lihat Tim" di panel). */
  const [bukaTim, setBukaTim] = useState(false);
  const tombolTim = useRef<HTMLButtonElement>(null);
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
          className="latar-layar -z-10 bg-cover bg-center transition-opacity duration-[800ms] ease-in-out"
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
                      isActive && "kartu-aktif",
                    )}
                  >
                    <img
                      src={asset.division.card(div.name)}
                      alt={div.name}
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                    {/* Kilatan cahaya sekali lewat pas kartunya jadi aktif
                        (dipasang cuma di kartu aktif, jadi jalan tiap ganti).
                        Dimasker pakai gambar kartunya sendiri: tanpa ini
                        kilaunya ikut nyinarin area transparan di sekitar
                        bingkai kartu — muncul kotak terang samar. */}
                    {isActive && (
                      <span
                        aria-hidden
                        className="kartu-kilau pointer-events-none absolute inset-0"
                        style={{
                          WebkitMaskImage: `url("${asset.division.card(div.name)}")`,
                          maskImage: `url("${asset.division.card(div.name)}")`,
                          WebkitMaskSize: "cover",
                          maskSize: "cover",
                          WebkitMaskPosition: "center",
                          maskPosition: "center",
                        }}
                      />
                    )}
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
          transition: "border-color 800ms, box-shadow 800ms",
        }}
      >
        <div key={active} className="animate-fade">
          <div
            style={{
              filter: `drop-shadow(0 0 16px ${accent}aa)`,
              transition: "filter 800ms",
            }}
          >
            <TitleGlow className="text-3xl sm:text-4xl">
              {divisions[active].name}
            </TitleGlow>
          </div>
          <p
            className="mt-1 font-alice text-sm uppercase tracking-[0.2em]"
            style={{ color: accent, transition: "color 800ms" }}
          >
            {divisions[active].role}
          </p>
          <div
            className="mx-auto mt-3 h-px w-16"
            style={{
              backgroundColor: `${accent}88`,
              transition: "background-color 800ms",
            }}
          />
          <p className="mt-5 font-alice leading-relaxed text-white/80">
            {divisions[active].desc}
          </p>
        </div>

        {/* Buka panggung tim (layar penuh). */}
        <button
          ref={tombolTim}
          type="button"
          onClick={() => setBukaTim(true)}
          className="mt-5 inline-flex items-center rounded-pill border px-5 py-2 font-alice text-xs uppercase tracking-[0.2em] text-white/90 transition-colors sm:text-sm [@media(hover:hover)]:hover:bg-white/10"
          style={{ borderColor: `${accent}88`, transition: "border-color 800ms, background-color 200ms" }}
        >
          Lihat Tim
        </button>
      </div>

      {bukaTim && (
        <ModalTim
          active={active}
          accent={accent}
          onGeser={go}
          onTutup={() => {
            setBukaTim(false);
            tombolTim.current?.focus();
          }}
        />
      )}
    </div>
  );
}

/**
 * Layar penuh "panggung tim" — dibuka dari tombol Lihat Tim.
 *
 * Fotonya foto rombongan (sampai ±30 orang), jadi butuh tempat lega
 * biar wajahnya kebaca — makanya layar penuh, bukan diselipin di
 * halaman. Panah di dalamnya ganti divisi (kartu di belakang ikut
 * geser); tombol panah keyboard juga jalan (dari handler halaman).
 * Esc / klik di luar / tombol × = tutup, fokus balik ke tombol Lihat Tim.
 * Dipasang lewat portal ke <body> biar `position: fixed`-nya nggak
 * ketahan pembungkus mana pun.
 */
function ModalTim({
  active,
  accent,
  onGeser,
  onTutup,
}: {
  active: number;
  accent: string;
  onGeser: (arah: number) => void;
  onTutup: () => void;
}) {
  const tutup = useRef<HTMLButtonElement>(null);
  const div = divisions[active];

  /* Lewat ref: `onTutup` dari induknya fungsi baru tiap render. Kalau
     jadi dependency efek di bawah, tiap ganti divisi (panah) fokusnya
     ketarik balik ke tombol × dan scroll body di-set ulang. */
  const onTutupRef = useRef(onTutup);
  onTutupRef.current = onTutup;

  useEffect(() => {
    tutup.current?.focus();
    const awalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutupRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = awalOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Tim divisi ${div.name}`}
      className="tim-modal fixed inset-0 z-[100] flex flex-col items-center justify-center bg-night/85 px-4 backdrop-blur-sm"
      onClick={onTutup}
    >
      <button
        ref={tutup}
        type="button"
        onClick={onTutup}
        aria-label="Tutup"
        className="absolute right-3 top-3 grid h-12 w-12 place-items-center text-white/75 transition-colors sm:right-7 sm:top-7 [@media(hover:hover)]:hover:text-white"
      >
        {/* Garis silang tipis, sama gayanya kayak panah (tanpa bulatan). */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-6 w-6"
          style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.8)) drop-shadow(0 0 8px rgba(190,184,255,0.6))" }}
        >
          <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Klik di dalam isi jangan nutup. */}
      <div className="flex w-full max-w-6xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <div key={active} className="animate-fade text-center">
          <div style={{ filter: `drop-shadow(0 0 16px ${accent}aa)` }}>
            <TitleGlow as="h2" className="text-4xl sm:text-5xl">
              {div.name}
            </TitleGlow>
          </div>
          <p className="mt-1 font-alice text-sm uppercase tracking-[0.2em]" style={{ color: accent }}>
            {div.role}
          </p>
        </div>

        <PanggungTim active={active} accent={accent} />

        <div className="mt-4 flex items-center gap-4">
          <Arrow dir="left" onClick={() => onGeser(-1)} />
          <Arrow dir="right" onClick={() => onGeser(1)} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * PANGGUNG TIM — foto anggota divisi yang lagi dipilih (di dalam
 * ModalTim). Fotonya PNG transparan, jadi orang-orangnya berdiri
 * langsung di atas latar, disorot lampu dari atas & disinari cahaya
 * lantai — dua-duanya warna divisinya. Kakinya dipudarkan ke lantai
 * biar nggak kelihatan kayak tempelan.
 *
 * Ganti divisi: tim lama turun & memudar (.tim-keluar), tim baru naik
 * (.tim-masuk), lampu sorotnya nyala ulang (.tim-sorot). Dua lapis
 * ditumpuk biar keluar & masuknya bisa barengan.
 *
 * Divisi yang fotonya belum ada: panggungnya tetap ada, isinya tulisan
 * "Foto tim segera hadir" (sama kayak "Trailer segera hadir" di
 * halaman panggung).
 */
function PanggungTim({ active, accent }: { active: number; accent: string }) {
  const urut = useRef(0);
  const [lapis, setLapis] = useState([{ idx: active, id: 0 }]);

  useEffect(() => {
    setLapis((prev) =>
      prev[prev.length - 1].idx === active
        ? prev
        : [...prev.slice(-1), { idx: active, id: ++urut.current }],
    );
    // Siapin foto divisi sebelah-sebelahnya biar pas digeser udah ada.
    for (const d of [-1, 1]) {
      const tetangga = divisions[(active + d + divisions.length) % divisions.length];
      if (tetangga.tim) new window.Image().src = tetangga.tim;
    }
  }, [active]);

  return (
    <div className="relative mt-4 h-[38svh] w-full sm:h-[56svh] sm:max-h-[640px]">
      {/* Lampu sorot dari atas, warna divisi. Di-key biar nyala ulang
          tiap ganti divisi. */}
      <span
        key={`sorot-${active}`}
        aria-hidden
        className="tim-sorot pointer-events-none absolute inset-0"
        style={{
          background: `conic-gradient(from 146deg at 50% -8%, transparent 0deg, ${accent}38 14deg, ${accent}38 54deg, transparent 68deg)`,
          /* Pudar di dua ujung: atasnya muncul dari gelap (bukan kepotong
             rata di tepi kotak), bawahnya habis sebelum lantai. */
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 30%, #000 55%, transparent 95%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 30%, #000 55%, transparent 95%)",
          transition: "background 800ms",
        }}
      />
      {/* Cahaya lantai panggung di kaki mereka. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 48% 15% at 50% 93%, ${accent}66, transparent 72%)`,
          transition: "background 800ms",
        }}
      />
      {/* Lingkaran sihir di lantai — timnya "dipanggil" naik dari sini.
          Lingkaran yang sama kayak di halaman Stages, dimiringin
          (rotateX) biar kebaca sebagai lantai. Di-key per divisi: tiap
          ganti tim, lingkarannya muter muncul lagi (.lingkaran-lantai). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[90%] w-[min(80%,520px)] -translate-x-1/2 -translate-y-1/2"
      >
        <div key={`lingkaran-${active}`} className="lingkaran-lantai relative aspect-square w-full">
          <MagicCircle warna={accent} className="absolute inset-0 h-full w-full" />
        </div>
      </div>

      {lapis.map((l, i) => {
        const div = divisions[l.idx];
        const keluar = i < lapis.length - 1;
        return (
          <div
            key={l.id}
            aria-hidden={keluar || undefined}
            className={clsx(
              "absolute inset-0 flex items-end justify-center",
              keluar ? "tim-keluar pointer-events-none" : "tim-masuk",
            )}
          >
            {div.tim ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={div.tim}
                alt={`Tim divisi ${div.name}`}
                decoding="async"
                draggable={false}
                className="max-h-full max-w-full object-contain"
                style={{
                  WebkitMaskImage: "linear-gradient(to top, transparent 0%, #000 13%)",
                  maskImage: "linear-gradient(to top, transparent 0%, #000 13%)",
                }}
              />
            ) : (
              <p className="mb-[16%] font-alice text-xs uppercase tracking-[0.25em] text-white/50 sm:text-sm">
                Foto tim segera hadir
              </p>
            )}
          </div>
        );
      })}
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
  /*
    Dulu bulatan abu-abu tembus + karakter teks "‹ ›" — tombol bawaan
    yang generik, nggak nyambung sama dunia kartunya. Sekarang cuma
    garis panah tipis yang tinggi (kayak ornamen buku dongeng) dengan
    pendar lavender yang sama kayak garis lingkaran sihir; tanpa
    bulatan. Area sentuhnya tetap lega walau garisnya tipis.
  */
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Sebelumnya" : "Berikutnya"}
      className={clsx(
        "group shrink-0 place-items-center text-white/75 transition-colors [@media(hover:hover)]:hover:text-white",
        kecil ? "h-11 w-9" : "h-16 w-12",
        className,
      )}
    >
      <svg
        viewBox="0 0 16 32"
        aria-hidden
        className={clsx(
          "transition-transform duration-300",
          kecil ? "h-7 w-3.5" : "h-11 w-[22px]",
          dir === "left"
            ? "[@media(hover:hover)]:group-hover:-translate-x-1"
            : "rotate-180 [@media(hover:hover)]:group-hover:translate-x-1",
        )}
        style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.8)) drop-shadow(0 0 8px rgba(190,184,255,0.6))" }}
      >
        <path
          d="M12.5 2 L3.5 16 L12.5 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
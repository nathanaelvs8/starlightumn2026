"use client";

import { useMemo, useRef, useState } from "react";
import { faqs, KATEGORI, type FaqItem } from "@/lib/faq";
import clsx from "@/lib/clsx";
import { faqCocok } from "@/lib/faqSearch";

/** Lama buka-tutup jawaban (ms) — samain sama `duration-300` di bawah. */
const LAMA_BUKA = 300;

/*
  Class yang dipakai BARENG oleh daftar asli dan salinan pengukurnya
  (lihat <Ukuran>). Harus identik — kalau beda satu padding aja, tinggi
  yang dikunci jadi meleset dan footernya bisa gerak lagi.
*/
const KELAS_DAFTAR = "flex flex-col gap-9";
const KELAS_JUDUL =
  "mb-3 flex items-center gap-3 font-alice text-xs uppercase tracking-[0.25em] text-cyan-100/75 sm:text-sm";
const KELAS_UL = "flex flex-col gap-3";
const KELAS_LI = "overflow-hidden rounded-xl border border-cyan-300/40 bg-white/5 backdrop-blur";
const KELAS_TOMBOL = "flex w-full items-center justify-between gap-4 px-6 py-4 text-left";
const KELAS_PERTANYAAN = "font-alice text-base font-bold uppercase tracking-wide text-white sm:text-lg";
const KELAS_JAWABAN = "px-6 pb-5 font-alice text-sm leading-relaxed text-white/85 sm:text-base";

export function FaqList() {
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const itemRef = useRef(new Map<number, HTMLLIElement>());

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return faqs.map((item, i) => ({ item, i }));

    return faqs
      .map((item, i) => ({ item, i }))
      .filter(({ item }) =>
        faqCocok(q, [item.q, item.a, ...(item.daftar ?? [])].join(" ")),
      );
  }, [query]);

  /**
   * Dikelompokin per kategori, urut ngikutin KATEGORI. Kelompok yang
   * semua pertanyaannya nggak cocok sama pencarian nggak ditampilin
   * sama sekali — judulnya juga ikut hilang, biar nggak ada judul kosong.
   */
  const kelompok = KATEGORI.map((kategori) => ({
    kategori,
    isi: filtered.filter(({ item }) => item.kategori === kategori),
  })).filter((k) => k.isi.length > 0);

  /**
   * Buka jawaban yang letaknya mepet bawah layar → halamannya digeser
   * dikit biar jawabannya kelihatan utuh. Nunggu animasi bukanya kelar.
   */
  const buka = (i: number) => {
    const jadiBuka = openIdx !== i;
    setOpenIdx(jadiBuka ? i : null);
    if (!jadiBuka) return;
    window.setTimeout(() => {
      const el = itemRef.current.get(i);
      if (!el) return;
      const b = el.getBoundingClientRect();
      const lewat = b.bottom - (window.innerHeight - 24);
      if (lewat > 0) {
        // jangan sampai pertanyaannya kedorong ke balik navbar (±110px)
        window.scrollBy({ top: Math.min(lewat, b.top - 110), behavior: "smooth" });
      }
    }, LAMA_BUKA + 20);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center gap-3 rounded-pill border border-white/25 bg-white/10 px-5 py-3 backdrop-blur">
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari pertanyaan…"
          aria-label="Cari pertanyaan"
          className="w-full bg-transparent font-alice text-white placeholder:text-white/50 focus:outline-none"
        />
      </div>

      {/*
        TINGGI DAFTAR DIKUNCI — biar FOOTER NGGAK IKUT NAIK-TURUN.

        Tanpa ini, buka-tutup jawaban atau hasil cari yang sedikit/kosong
        ngubah tinggi halaman, dan footernya naik-turun.

        Dulu sempat pakai kotak scroll (daftar discroll di dalam kotak),
        tapi di HP itu nyusahin: scrollbar-nya disembunyiin iOS/Android,
        dan jari yang nempel di kotak nge-scroll kotaknya, bukan
        halamannya — orang bisa ngerasa "nyangkut", nggak nyampe footer.

        Sekarang halamannya discroll biasa. Daftar asli ditumpuk di satu
        sel grid bareng <Ukuran>: salinan TAK KELIHATAN berisi semua
        pertanyaan (ketutup) + satu ruang setinggi jawaban TERPANJANG.
        Sel grid ngambil yang paling tinggi di antara keduanya, jadi
        tingginya selalu = tinggi terpanjang yang mungkin terjadi. Semua
        dihitung browser sendiri, otomatis ikut kalau isi FAQ diganti
        atau layarnya di-resize. Konsekuensinya: pas hasil cari sedikit,
        ada ruang kosong di bawahnya — itu yang bikin footernya diam.
      */}
      <div className="mt-6 grid">
        <Ukuran />

        <div className={clsx(KELAS_DAFTAR, "self-start [grid-area:1/1]")}>
          {kelompok.map(({ kategori, isi }) => (
            <section key={kategori} aria-labelledby={`faq-${kategori}`}>
              {/* Judul kelompok: kecil & renggang, gaya yang sama kayak
                  label "Part of" di footer — penanda, bukan judul besar. */}
              <h2 id={`faq-${kategori}`} className={KELAS_JUDUL}>
                {kategori}
                <span aria-hidden className="h-px flex-1 bg-cyan-200/25" />
              </h2>

              <ul className={KELAS_UL}>
                {isi.map(({ item, i }) => {
                  const open = openIdx === i;
                  // jeda muncul berurutan di SELURUH daftar, bukan per kelompok
                  const pos = filtered.findIndex((f) => f.i === i);
                  return (
                    <li
                      key={i}
                      ref={(el) => {
                        if (el) itemRef.current.set(i, el);
                        else itemRef.current.delete(i);
                      }}
                      className={clsx("animate-faq-in", KELAS_LI)}
                      style={{ animationDelay: `${pos * 50}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => buka(i)}
                        aria-expanded={open}
                        className={KELAS_TOMBOL}
                      >
                        <span className={KELAS_PERTANYAAN}>{item.q}</span>
                        <Chevron open={open} />
                      </button>

                      <div
                        className={clsx(
                          "grid transition-all duration-300 ease-out",
                          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className={KELAS_JAWABAN}>
                            <IsiJawaban item={item} />
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {filtered.length === 0 && (
            <p className="rounded-xl border border-white/15 bg-white/5 px-6 py-8 text-center font-alice text-white/70">
              Tidak ada pertanyaan yang sesuai. Silakan coba kata kunci lain.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Salinan pengukur — nggak kelihatan, nggak bisa difokus, nggak dibaca
 * screen reader. Isinya SEMUA pertanyaan dalam keadaan ketutup, lalu
 * semua jawaban ditumpuk di satu sel grid (tingginya = jawaban yang
 * paling panjang). Totalnya = tinggi terpanjang daftar FAQ yang mungkin:
 * semua pertanyaan tampil + satu jawaban (yang terpanjang) kebuka.
 */
function Ukuran() {
  return (
    <div aria-hidden className="pointer-events-none invisible select-none [grid-area:1/1]">
      <div className={KELAS_DAFTAR}>
        {KATEGORI.map((kategori) => (
          <div key={kategori}>
            <p className={KELAS_JUDUL}>{kategori}</p>
            <div className={KELAS_UL}>
              {faqs
                .filter((f) => f.kategori === kategori)
                .map((item) => (
                  <div key={item.q} className={KELAS_LI}>
                    <div className={KELAS_TOMBOL}>
                      <span className={KELAS_PERTANYAAN}>{item.q}</span>
                      <Chevron open={false} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Semua jawaban ditumpuk di SATU sel → tingginya = yang terpanjang.
          border-x transparan = lebar isi sama persis kayak di dalam <li>. */}
      <div className="grid border-x border-transparent">
        {faqs.map((item) => (
          <div key={item.q} className={clsx(KELAS_JAWABAN, "[grid-area:1/1]")}>
            <IsiJawaban item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function IsiJawaban({ item }: { item: FaqItem }) {
  return (
    <>
      <p>{item.a}</p>
      {item.daftar && (
        <ul className="mt-2 flex flex-col gap-1">
          {item.daftar.map((poin) => (
            <li key={poin} className="flex items-baseline gap-2.5">
              <Kerlip />
              {poin}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Bullet list: kerlip empat sudut, sama kayak di lingkaran sihir & rasi. */
function Kerlip() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className="h-2.5 w-2.5 shrink-0 translate-y-[-1px] text-cyan-200/80">
      <path d="M6 0Q6.9 5.1 12 6Q6.9 6.9 6 12Q5.1 6.9 0 6Q5.1 5.1 6 0Z" fill="currentColor" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={clsx(
        "h-5 w-5 shrink-0 text-cyan-200 transition-transform duration-300",
        open && "rotate-180",
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-5 w-5 shrink-0 text-white/60"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

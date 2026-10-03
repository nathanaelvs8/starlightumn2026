import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { MagicCircle } from "@/components/site/MagicCircle";
import { VideoFrame } from "@/components/site/VideoFrame";
import { DekorPanggung } from "@/components/site/DekorPanggung";
import { asset } from "@/lib/assets";
import { findStage, tanggalPanggung, type Stage } from "@/lib/stages";
import { stagesDenganStatus } from "@/lib/stagesServer";

/**
 * Halaman satu panggung.
 *
 * Alurnya niru contoh Luminous Crystal:
 *   logo (versi KEBUKA) → kartu deskripsi → trailer di bingkai emas
 *   → galeri Moments → footer (otomatis dari layout).
 *
 * Di daftar /stages logonya kegembok; begitu masuk ke sini, segelnya
 * kebuka — logonya berwarna dan lingkaran sihirnya ikut nyala.
 *
 * Background-nya FIXED, sama kayak /stages dan /faq. Gambarnya langit
 * aurora (asset.stages.bgDetail) — beda sama daftar /stages yang tetap
 * pakai background lama. Diatur per panggung lewat `bg` di
 * src/lib/stages.ts, jadi kalau nanti ada gambar khusus tinggal ganti di
 * sana.
 */

/*
  Dirender per permintaan: segel tiap panggung dibuka/ditutup admin dari
  /admin, jadi statusnya harus dibaca dari database tiap kali halaman
  dibuka — kalau statis, perubahannya baru kelihatan setelah build ulang.
*/
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }) {
  const stage = findStage(params.slug);
  if (!stage) return { title: "Stage · Starlight UMN 2026" };
  return {
    title: `${stage.name} · Starlight UMN 2026`,
    description: stage.tagline,
  };
}

export default async function StagePage({ params }: { params: { slug: string } }) {
  const stage = (await stagesDenganStatus()).find((s) => s.slug === params.slug);
  if (!stage) notFound();

  /* Masih disegel → cuma admin yang boleh lihat (buat ngecek isinya
     sebelum dibuka). Pengunjung lain dibalikin ke daftar panggung. */
  if (!stage.terbuka && !(await isAdmin())) redirect("/stages");

  return (
    <>
      <div
        aria-hidden
        className="latar-layar -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${stage.bg}")` }}
      />
      {/* Peredup: default tipis (25%) — background aurora-nya sengaja
          yang berwarna, jangan ditutup lagi. Background yang terang
          banget (Lonielle / Enchanted) pasang `redup` lebih tebal di
          src/lib/stages.ts. Kartu & teksnya udah punya kaca gelap /
          bayangan sendiri. */}
      <div
        aria-hidden
        className="latar-layar -z-10"
        style={{ background: `rgb(var(--c-night-rgb) / ${(stage.redup ?? 25) / 100})` }}
      />

      <Container className="pb-32 pt-8 sm:pb-40 sm:pt-12">
        <Hero stage={stage} />

        <Reveal>
          <Panel className="mt-12 sm:mt-16">
            <Berlian accent={stage.accent} />
            {/* Ini <h1> halaman ini — nama panggungnya sendiri. Sebelumnya
                <h2>, sementara "Trailer <nama>" di bawah yang jadi <h1>,
                jadi daftar heading-nya kebalik. Ukuran hurufnya nggak
                berubah: semuanya dari className, bukan dari tag-nya. */}
            <h1 className="mt-4 text-center font-display text-3xl text-white [text-shadow:0_0_18px_rgba(190,184,255,0.45)] sm:text-4xl">
              {stage.name}
            </h1>
            <div className="mt-6 flex flex-col gap-5">
              {stage.desc.map((paragraf, i) => (
                <p
                  key={i}
                  className="mx-auto max-w-3xl text-center font-alice text-base leading-relaxed text-white/85 sm:text-lg"
                >
                  {paragraf}
                </p>
              ))}
            </div>
          </Panel>
        </Reveal>

        {/* ---------- Trailer ---------- */}
        <section className="mt-16 sm:mt-24">
          <Reveal>
            <TitleGlow as="h2" className="text-center text-3xl sm:text-4xl">
              {`Trailer ${stage.name}`}
            </TitleGlow>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-8">
              <VideoFrame
                youtubeId={stage.youtubeId}
                title={`Trailer ${stage.name} — Starlight UMN 2026`}
              />
            </div>
          </Reveal>
          <Reveal delay={240}>
            {/* Sengaja teks putih biasa, bukan .prose-starlight. Efek
                timbul dua lapis itu dirancang buat latar gelap pekat;
                di atas latar panggung yang terang begini muka hurufnya
                (abu-abu) malah tenggelam. */}
            <p className="mx-auto mt-6 max-w-3xl text-center font-alice text-sm italic leading-relaxed text-white/85 [text-shadow:0_2px_12px_rgba(0,0,0,0.6)] sm:text-base">
              {stage.tagline}
            </p>
          </Reveal>
        </section>

        {/* ---------- Moments ----------
            Cuma tampil kalau fotonya udah ada (`moments` di
            src/lib/stages.ts). Selama kosong, bagian ini disembunyiin —
            kotak-kotak "Foto" kosong kelihatan kayak halaman belum jadi.
            Begitu fotonya diisi, bagiannya muncul sendiri. */}
        {stage.moments.length > 0 && (
          <Reveal>
            <Panel className="mt-16 sm:mt-24">
              <h2 className="text-center font-display text-3xl text-white [text-shadow:0_0_18px_rgba(190,184,255,0.45)] sm:text-4xl">
                Moments
              </h2>
              <Moments foto={stage.moments} nama={stage.name} />
            </Panel>
          </Reveal>
        )}

        <Reveal>
          <div className="mt-12 text-center">
            <Link
              href="/stages"
              className="footer-link font-alice text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white"
            >
              {"← Semua Panggung"}
            </Link>
          </div>
        </Reveal>
      </Container>
    </>
  );
}

/**
 * Logo panggung versi berwarna, dilingkerin lingkaran sihir yang udah
 * nyala penuh.
 *
 * Lingkarannya dikunci persegi dan ukurannya ngikutin lebar layar,
 * sementara logonya ditaruh di tengah dengan lebar 68% dari sisi itu.
 */
function Hero({ stage }: { stage: Stage }) {
  return (
    <div className="relative flex justify-center">
      {/* Dekor ngikutin vibe panggungnya — di belakang lingkaran & logo. */}
      <DekorPanggung slug={stage.slug} />
      <div
        className="relative grid aspect-square place-items-center"
        style={{ width: "min(92vw, 720px)" }}
      >
        {/* Lingkarannya pakai warna logo panggungnya (`accent`), biar
            nyatu sama logo di tengahnya. Di daftar /stages tetap putih —
            di sana tiga panggung satu lingkaran. */}
        {/* "Segelnya kebuka" pas halaman dibuka: lingkaran muter terbuka
            dari kecil (.segel-buka), cahaya warna panggung nyala sebentar
            (.segel-kilat), lalu logonya muncul belakangan (logo-pop
            dengan jeda). Lihat globals.css. */}
        <div className="segel-buka absolute inset-0">
          <MagicCircle warna={stage.accent} className="absolute inset-0 h-full w-full opacity-75" />
        </div>
        <span
          aria-hidden
          className="segel-kilat pointer-events-none absolute inset-[18%] rounded-full opacity-25 blur-3xl"
          style={{ background: stage.accent }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.stages.logo(stage.slug)}
          alt={stage.name}
          draggable={false}
          className="logo-pop relative w-[68%]"
          style={{ filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.5))", animationDelay: "380ms" }}
        />
        {/* Tanggal panggungnya — di ruang kosong bawah logo, gaya yang
            sama kayak tanggal di segel /stages. */}
        <p className="absolute bottom-[25%] font-alice text-xs uppercase tracking-[0.25em] text-emas [text-shadow:0_1px_10px_rgba(0,0,0,0.7)] sm:text-sm">
          {tanggalPanggung(stage)}
        </p>
      </div>
    </div>
  );
}

/**
 * Panel kaca gelap.
 *
 * Bentuknya ngikutin kartu di contoh Luminous, tapi warnanya dibalik.
 * Kartu putih di tengah halaman segelap ini bikin matanya kelempar ke
 * kotaknya duluan, bukan ke panggungnya — dan nuansa sihirnya patah.
 * Biru malam transparan bikin kartunya nyatu sama latar, dan ini juga
 * sama kayak kaca yang udah dipakai navbar & modal logout.
 */
function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-5xl rounded-xl border border-white/15 bg-night/55 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-10 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/** Berlian kecil di atas judul kartu, ngikutin contohnya. */
function Berlian({ accent }: { accent: string }) {
  return (
    <svg
      viewBox="0 0 24 40"
      aria-hidden
      className="mx-auto h-9 w-auto"
      fill="none"
      stroke={accent}
      strokeWidth="2.2"
      strokeLinejoin="round"
    >
      <path d="M12 1 L22 14 L12 39 L2 14 Z" />
    </svg>
  );
}

/**
 * Galeri dokumentasi. Cuma dipanggil kalau fotonya udah ada (lihat
 * bagian Moments di atas).
 */
function Moments({ foto, nama }: { foto: string[]; nama: string }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {foto.map((src, i) => (
        <div
          key={i}
          className="aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Dokumentasi ${nama} ${i + 1}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}

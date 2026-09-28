import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { MagicCircle } from "@/components/site/MagicCircle";
import { VideoFrame } from "@/components/site/VideoFrame";
import { asset } from "@/lib/assets";
import { stages, findStage, type Stage } from "@/lib/stages";

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
 * Background-nya FIXED per panggung, sama kayak /stages dan /faq. Masih
 * numpang gambar divisi sampai aset khusus panggung dikirim (mapping-nya
 * ada di src/lib/stages.ts).
 */

/** Bikin ketiga halaman jadi statis pas build — nggak ada query sama sekali. */
export function generateStaticParams() {
  return stages.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const stage = findStage(params.slug);
  if (!stage) return { title: "Stage · Starlight UMN 2026" };
  return {
    title: `${stage.name} · Starlight UMN 2026`,
    description: stage.tagline,
  };
}

export default function StagePage({ params }: { params: { slug: string } }) {
  const stage = findStage(params.slug);
  if (!stage) notFound();

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${stage.bg}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-night/60" />

      <Container className="pb-32 pt-8 sm:pb-40 sm:pt-12">
        <Hero stage={stage} />

        <Reveal>
          <Panel className="mt-12 sm:mt-16">
            <Berlian accent={stage.accent} />
            {/* Ini <h1> halaman ini — nama panggungnya sendiri. Sebelumnya
                <h2>, sementara "Trailer <nama>" di bawah yang jadi <h1>,
                jadi daftar heading-nya kebalik. Ukuran hurufnya nggak
                berubah: semuanya dari className, bukan dari tag-nya. */}
            <h1 className="mt-4 text-center font-display text-3xl text-white [text-shadow:0_0_18px_rgba(255,154,77,0.35)] sm:text-4xl">
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

        {/* ---------- Moments ---------- */}
        <Reveal>
          <Panel className="mt-16 sm:mt-24">
            <h2 className="text-center font-display text-3xl text-white [text-shadow:0_0_18px_rgba(255,154,77,0.35)] sm:text-4xl">
              Moments
            </h2>
            <Moments foto={stage.moments} nama={stage.name} />
          </Panel>
        </Reveal>

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
    <div className="flex justify-center">
      <div
        className="relative grid aspect-square place-items-center"
        style={{ width: "min(92vw, 720px)" }}
      >
        {/* Lingkarannya sengaja api di semua panggung, bukan warna
            panggungnya masing-masing — biar kerasa satu mantra yang
            sama, cuma isinya yang beda. Warna panggung tetap kepakai
            buat kabut di belakang logo & berlian di kartu. */}
        <MagicCircle className="absolute inset-0 h-full w-full opacity-75" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[18%] rounded-full opacity-25 blur-3xl"
          style={{ background: stage.accent }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.stages.logo(stage.slug)}
          alt={stage.name}
          draggable={false}
          className="logo-pop relative w-[68%]"
          style={{ filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.5))" }}
        />
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
 * Galeri dokumentasi. Selama fotonya belum ada, yang tampil kotak
 * kosong — biar susunannya udah kelihatan duluan.
 */
function Moments({ foto, nama }: { foto: string[]; nama: string }) {
  const isi = foto.length > 0 ? foto : Array.from({ length: 8 }).map(() => "");

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {isi.map((src, i) => (
        <div
          key={i}
          className="aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]"
        >
          {src ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt={`Dokumentasi ${nama} ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-white/40 sm:text-xs">
              Foto
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

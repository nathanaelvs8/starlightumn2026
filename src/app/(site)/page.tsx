import { Band } from "@/components/ui/Band";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";
import { copy } from "@/lib/copy";

const REGISTRASI_PENONTON_URL = "#";

export default function HomePage() {
  return (
    <>
      <Band bg={asset.home.bandHero} position="center">
        <Container className="flex min-h-[calc(100svh-var(--h-nav))] flex-col items-center justify-center gap-8 py-14 text-center sm:py-20">
          <div className="logo-pop">
            <img
              src={asset.logo.main}
              alt="Starlight UMN 2026"
              draggable={false}
              className="mx-auto w-[220px] sm:w-[300px] lg:w-[360px]"
            />
          </div>

          <ButtonLink href={REGISTRASI_PENONTON_URL} external>
            Registrasi Penonton
            <span aria-hidden>↗</span>
            <span className="sr-only">(buka di tab baru)</span>
          </ButtonLink>
        </Container>
      </Band>

      <Separator naik={10} />

      <Band bg={asset.home.bandAbout} ratio="1920/1500">
        <Container className="flex flex-col justify-center gap-10 py-14 sm:gap-14 sm:py-16">
          <div>
            <Reveal>
              <TitleGlow className="text-center text-4xl sm:text-5xl">
                About Us
              </TitleGlow>
            </Reveal>
            <Reveal delay={120}>
              <TitleGlow className="mt-20 text-center text-3xl sm:mt-28 sm:text-4xl">
                What is Starlight?
              </TitleGlow>
            </Reveal>
            <Reveal delay={240}>
              <Paragraf className="mt-6 max-w-4xl sm:mt-8">
                {copy.aboutUs}
              </Paragraf>
            </Reveal>
          </div>

          <div className="mt-16 grid items-start gap-8 sm:mt-24 lg:grid-cols-2 lg:gap-10">
            <TwoCol judul="Vision" from="left">
              {copy.vision}
            </TwoCol>
            <TwoCol judul="Mission" from="right">
              {copy.mission}
            </TwoCol>
          </div>
        </Container>
      </Band>

      <Separator naik={10} />

      <Band bg={asset.home.bandConcept} ratio="1920/1450">
        <Container className="flex flex-col justify-center gap-8 pb-32 pt-10 sm:gap-10 sm:pb-40 sm:pt-12">
          <div>
            <Reveal>
              <TitleGlow className="text-center text-4xl sm:text-5xl">
                Concept
              </TitleGlow>
            </Reveal>
            <Reveal delay={160}>
              <Paragraf className="mt-6 max-w-4xl sm:mt-8">
                {copy.concept}
              </Paragraf>
            </Reveal>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <TwoCol judul="Theme" from="left">
              {copy.theme}
            </TwoCol>
            <TwoCol judul="Tagline" from="right">
              {copy.tagline}
            </TwoCol>
          </div>

          <div className="rounded-xl border border-line bg-surface/90 p-4 sm:p-6">
            <h2 className="text-center text-lg sm:text-xl">Sponsor</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-[3/1] items-center justify-center rounded-lg border border-dashed border-line bg-raised text-xs text-muted"
                >
                  Logo sponsor
                </div>
              ))}
            </div>

            <hr className="my-4 border-line sm:my-5" />

            <h2 className="text-center text-lg sm:text-xl">Media Partner</h2>
            <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-[3/1] items-center justify-center rounded-md border border-dashed border-line bg-raised text-center text-[10px] leading-tight text-muted"
                >
                  Logo
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Band>
    </>
  );
}

function Separator({ naik = -60 }: { naik?: number }) {
  return (
    <div className="relative z-20 h-0">
      <img
        src={asset.shared.separator}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute left-1/2 max-w-none w-[165%] lg:w-[120%]"
        style={{
          top: `${-naik}px`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}

const LEBAR_KOLOM = "max-w-full";

function Paragraf({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`prose-starlight mx-auto ${className ?? ""}`}
      style={{ fontSize: "clamp(15px, 1.1vw, 20px)" }}
    >
      <span aria-hidden className="star-under absolute inset-0">
        {children}
      </span>
      <span className="star-face relative">{children}</span>
    </p>
  );
}

function TwoCol({
  judul,
  children,
  from = "up",
}: {
  judul: string;
  children?: React.ReactNode;
  from?: "up" | "left" | "right";
}) {
  return (
    <div className="flex flex-col">
      <Reveal from={from}>
        <div className="flex h-[clamp(44px,5vw,72px)] items-center justify-center">
          <TitleGlow className="text-3xl sm:text-4xl">{judul}</TitleGlow>
        </div>
      </Reveal>

      <Reveal from={from} delay={160}>
        <div className="mt-5">
          <Paragraf className={LEBAR_KOLOM}>{children}</Paragraf>
        </div>
      </Reveal>
    </div>
  );
}
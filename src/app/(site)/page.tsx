import { Band } from "@/components/ui/Band";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Asset } from "@/components/ui/Asset";
import { Reveal } from "@/components/ui/Reveal";
import { asset } from "@/lib/assets";
import { copy } from "@/lib/copy";

/** TODO: ganti pakai URL registrasi penonton yang asli. */
const REGISTRASI_PENONTON_URL = "#";

export default function HomePage() {
  return (
    <>
      {/* ================= BAND 1 · HERO · 1920x1080 ================= */}
      <Band bg={asset.home.bandHero} position="center">
        <Container className="flex min-h-[calc(100svh-var(--h-nav))] flex-col items-center justify-center gap-6 py-14 text-center sm:gap-8 sm:py-20">
          <Asset
            src={asset.logo.main}
            alt="Starlight UMN 2026"
            size="md"
            priority
          />

          <div className="w-full max-w-[340px]">
            <span className="dummy-line h-4 w-full" />
            <p className="mt-3 text-sm text-muted">Main Tag Line</p>
          </div>

          {/* Baris 1 — aksi utama produk */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <ButtonLink href="/division">Explore</ButtonLink>
            <ButtonLink href="/login" variant="outline">
              Login
            </ButtonLink>
          </div>

          {/* Divider — nandain baris di bawahnya beda tujuan */}
          <div className="flex w-full max-w-[400px] items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="whitespace-nowrap text-[11px] font-bold text-muted">
              ke website eksternal
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {/* Baris 2 — pihak ketiga, sengaja dipisah */}
          <ButtonLink href={REGISTRASI_PENONTON_URL} external>
            Registrasi Penonton
            <span aria-hidden>↗</span>
            <span className="sr-only">(buka di tab baru)</span>
          </ButtonLink>
        </Container>
      </Band>

      {/* ===== BAND 2 · ABOUT + VISION/MISSION + STARLIGHT 2026 · 1920x1500 ===== */}
      <Band bg={asset.home.bandAbout} ratio="1920/1500">
        <Container className="flex flex-col justify-center gap-10 py-14 sm:gap-14 sm:py-16">
          {/* --- About Us --- */}
          <div>
            {/* Judul sengaja nggak dianimasiin — tetap diam. */}
            <Asset src={asset.home.judulAboutUs} alt="About Us" height="lg" />
            <Reveal>
              <Paragraf className="mt-6 max-w-6xl sm:mt-8">
                {copy.aboutUs}
              </Paragraf>
            </Reveal>
          </div>

          {/* --- Vision & Mission — dua kolom, judul center --- */}
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <TwoCol judul={asset.home.judulVision} judulAlt="Vision" from="left">
              {copy.vision}
            </TwoCol>
            <TwoCol judul={asset.home.judulMission} judulAlt="Mission" from="right">
              {copy.mission}
            </TwoCol>
          </div>

          {/* --- Starlight UMN 2026 --- */}
          <div>
            <Asset
              src={asset.home.identity2026}
              alt="Identitas Starlight UMN 2026"
              size="2xl"
            />
            <div className="mx-auto mt-4 flex max-w-2xl flex-col items-center gap-2.5">
              <span className="dummy-line w-[88%]" />
              <span className="dummy-line w-[70%]" />
            </div>
          </div>
        </Container>
      </Band>

      {/* ===== BAND 3 · CONCEPT + THEME/TAGLINE + SPONSOR · 1920x1450 ===== */}
      <Band bg={asset.home.bandConcept} ratio="1920/1450">
        <Container className="flex flex-col justify-center gap-8 py-10 sm:gap-10 sm:py-12">
          {/* --- Concept --- */}
          <div>
            <Reveal>
              <Asset src={asset.home.judulConcept} alt="Concept" height="lg" />
            </Reveal>
            <Reveal delay={160}>
              <Paragraf className="mt-6 max-w-6xl sm:mt-8">
                {copy.concept}
              </Paragraf>
            </Reveal>
          </div>

          {/* --- Theme & Tag Line — dua kolom, judul center --- */}
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <TwoCol judul={asset.home.judulTheme} judulAlt="Theme" from="left">
              {copy.theme}
            </TwoCol>
            <TwoCol
              judul={asset.home.judulTagline}
              judulAlt="Tag Line"
              gambar={asset.home.isiTagline}
              gambarAlt={copy.tagline}
              from="right"
            />
          </div>

          {/* --- Sponsor & Media Partner — satu container besar --- */}
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

/**
 * Lebar isi kolom kiri-kanan. Dipakai bareng sama teks DAN gambar
 * supaya Vision/Mission dan Theme/Tagline sama persis lebarnya.
 *
 * "max-w-full" = isi penuh selebar kolomnya. Kalau mau dikasih jarak
 * di kiri-kanan, ganti jadi angka, mis. "max-w-[640px]".
 */
const LEBAR_KOLOM = "max-w-full";

/**
 * Paragraf Starlight — font Alice, rata tengah, muka huruf abu
 * bergradasi dengan lapisan putih timbul di bawahnya.
 *
 * Ukuran hurufnya ikut lebar layar. Geser angka di clamp() kalau mau
 * diubah.
 */
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
      style={{ fontSize: "clamp(17px, 1.5vw, 27px)" }}
    >
      {/* Lapisan bawah — putih, digeser turun. Disembunyiin dari screen
          reader biar teksnya nggak kebaca dua kali. */}
      <span aria-hidden className="star-under absolute inset-0">
        {children}
      </span>
      {/* Lapisan atas — muka huruf bergradasi */}
      <span className="star-face relative">{children}</span>
    </p>
  );
}

/**
 * Satu kolom dari pasangan kiri-kanan (Vision/Mission, Theme/Tagline).
 *
 * Judulnya ditaruh di slot dengan tinggi tetap, jadi judul kiri dan
 * kanan selalu sejajar dan isi di bawahnya mulai di garis yang sama —
 * walaupun panjang katanya beda.
 *
 * Isinya boleh teks (`children`) atau gambar (`gambar`). Dua-duanya
 * dibatasi LEBAR_KOLOM yang sama, jadi Theme/Tagline nggak pernah
 * kelihatan lebih sempit dari Vision/Mission.
 */
function TwoCol({
  judul,
  judulAlt,
  children,
  gambar,
  gambarAlt,
  from = "up",
}: {
  judul: string;
  judulAlt: string;
  /** Isi berupa teks. Diabaikan kalau `gambar` diisi. */
  children?: React.ReactNode;
  /** Isi berupa gambar — dipakai buat Tag Line. */
  gambar?: string;
  gambarAlt?: string;
  /** Arah datangnya animasi. Kolom kiri dari kiri, kanan dari kanan. */
  from?: "up" | "left" | "right";
}) {
  return (
    <div className="flex flex-col">
      {/* Logo duluan, isinya nyusul 160ms kemudian. */}
      <Reveal from={from}>
        <div className="flex h-[clamp(44px,5vw,72px)] items-center justify-center">
          <Asset src={judul} alt={judulAlt} height="md" />
        </div>
      </Reveal>

      <Reveal from={from} delay={160}>
        <div className="mt-5">
          {gambar ? (
            <div className={`mx-auto w-full ${LEBAR_KOLOM}`}>
              <Asset src={gambar} alt={gambarAlt ?? ""} />
            </div>
          ) : (
            <Paragraf className={LEBAR_KOLOM}>{children}</Paragraf>
          )}
        </div>
      </Reveal>
    </div>
  );
}
import { Band } from "@/components/ui/Band";
import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { Comets } from "@/components/site/Comets";
import { Awan } from "@/components/site/Awan";
import { asset } from "@/lib/assets";
import { copy } from "@/lib/copy";

/**
 * Tautan pendaftaran penonton.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ ISI INI SEBELUM RILIS.                                          │
 * │ Selama masih "#", tombolnya tampil tapi DIMATIKAN — lihat di    │
 * │ bawah. Begitu diisi URL beneran, tombolnya nyala sendiri.       │
 * └─────────────────────────────────────────────────────────────────┘
 */
const REGISTRASI_PENONTON_URL = "#";

/** Tautannya udah beneran ada, belum? */
const REGISTRASI_SIAP = REGISTRASI_PENONTON_URL !== "#";

export default function HomePage() {
  return (
    /*
      SATU langit buat seluruh homepage, dipasang di pembungkus ini —
      bukan per band. Dulu tiap band pasang gambarnya sendiri, dan di
      perbatasannya kelihatan garis lurus (kayak kebelah) karena dua
      potongan gambar yang beda ketemu di satu baris. Separator nggak
      nutup penuh: ekor kabutnya transparan, garisnya nongol di bawahnya.

      Gambarnya diulang ke bawah tanpa sambungan — lihat convert-langit.js.
      Lebarnya minimal 1350px biar di HP zoom-nya sama kayak hero dulu
      (bukan jadi kecil banget gara-gara dipas ke lebar layar).

      Lapisan atasnya gradasi gelap tipis yang mulai SETELAH hero: hero
      tetap terang, bagian yang banyak tulisannya diredupin dikit biar
      paragraf kebaca di atas bercak nebula yang terang. Karena gradasi,
      nggak ada garis juga di sini.

      Negatif margin-nya (setinggi navbar) pindah ke sini dari band hero,
      biar langitnya mulai dari paling atas, di belakang navbar.
    */
    <div
      className="-mt-[104px] bg-night sm:-mt-[95px]"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgb(var(--c-night-rgb) / 0) 80svh, rgb(var(--c-night-rgb) / 0.45) 125svh), url("${asset.home.langit}")`,
        backgroundSize: "100% 100%, max(100%, 1350px) auto",
        backgroundRepeat: "no-repeat, repeat-y",
        backgroundPosition: "top center, top center",
      }}
    >
      <Band>
        <Comets />
        <Container className="relative flex min-h-[100svh] flex-col items-center justify-center gap-8 pb-14 pt-[110px] text-center sm:pb-20 sm:pt-[130px]">
          <Awan n={5} sisi="kiri" atas="24%" lebar="clamp(110px, 21vw, 390px)" keluar={0.35} redup={0.8} durasi={22} />
          {/* Di HP logonya hampir selebar layar, jadi awan kanan diturunin
              ke bawah tombol biar nggak nempel ke ujung bintang. */}
          <Awan n={6} sisi="kanan" atas="80%" lebar="clamp(140px, 18vw, 350px)" keluar={0.3} redup={0.75} balik durasi={26} jeda={9} className="sm:hidden" />
          <Awan n={6} sisi="kanan" atas="58%" lebar="clamp(140px, 18vw, 350px)" keluar={0.3} redup={0.75} balik durasi={26} jeda={9} className="hidden sm:block" />

          <h1 className="logo-pop">
            <img
              src={asset.logo.main}
              alt="Starlight UMN 2026"
              draggable={false}
              className="mx-auto w-[300px] sm:w-[300px] lg:w-[360px]"
            />
          </h1>

          {/*
            Selama tautannya masih "#", tombolnya dirender sebagai
            tombol MATI, bukan tautan.

            Sebelumnya dia `<a href="#" target="_blank">`, jadi ditekan
            malah buka tab kedua berisi halaman yang sama persis — dan
            orang menyimpulkan situsnya rusak. Itu satu-satunya tombol
            aksi di homepage, jadi kesan pertamanya mahal.

            Tombolnya sengaja TETAP DITAMPILKAN, bukan disembunyikan,
            supaya susunan hero-nya nggak berubah. Tampilannya sama,
            cuma sekarang nggak bisa diklik dan `aria-disabled` bikin
            screen reader menyebutnya nonaktif.
          */}
          {REGISTRASI_SIAP ? (
            <ButtonLink href={REGISTRASI_PENONTON_URL} external>
              Registrasi Penonton
              <span aria-hidden>↗</span>
              <span className="sr-only">(buka di tab baru)</span>
            </ButtonLink>
          ) : (
            <Button disabled title="Pendaftaran belum dibuka">
              Registrasi Penonton
              <span aria-hidden>↗</span>
            </Button>
          )}
        </Container>
      </Band>

      <Separator naik={10} />

      {/*
        Band About & Concept nggak punya background sendiri — langit dari
        pembungkus di atas yang kelihatan. Dulu dua band ini pakai lukisan
        kusam + aurora cyan, beda jauh sama hero, jadi warnanya kerasa
        loncat. Supaya nggak monoton, tiap band dikasih awan lepas (<Awan>).
        `ratio` tetap dipasang: dia yang jaga tinggi minimum band-nya.
      */}
      <Band ratio="1920/1500">
        {/* pb sm ke atas 28, bukan 16: separator di bawah band ini naik
            ±75px ke dalam band. Di tablet (isinya lebih tinggi dari rasio
            gambar) 64px nggak cukup — baris terakhir Vision/Mission
            ketutup awan. Di laptop band-nya udah lebih tinggi dari isi,
            jadi angka ini nggak ngaruh apa-apa di sana. */}
        <Container className="flex flex-col justify-center gap-10 pb-32 pt-32 sm:gap-14 sm:pb-28 sm:pt-40">
          <div className="relative">
            <Awan n={1} sisi="kiri" atas="-3rem" lebar="clamp(160px, 34vw, 640px)" keluar={0.35} durasi={24} jeda={5} />
            <Awan n={4} sisi="kanan" atas="4.5rem" lebar="clamp(150px, 28vw, 540px)" keluar={0.4} redup={0.8} durasi={19} jeda={12} />

            <Reveal>
              <TitleGlow as="h2" className="text-center text-4xl sm:text-5xl">
                About Us
              </TitleGlow>
            </Reveal>
            <Reveal delay={120}>
              <TitleGlow as="h2" className="mt-20 text-center text-3xl sm:mt-28 sm:text-4xl">
                What is Starlight?
              </TitleGlow>
            </Reveal>
            <Reveal delay={240}>
              <Paragraf className="mt-6 max-w-4xl sm:mt-8">
                {copy.aboutUs}
              </Paragraf>
            </Reveal>
          </div>

          {/* gap-14 di HP & tablet (satu kolom): jarak antar blok harus
              jelas lebih lega dari jarak judul → paragrafnya sendiri,
              kalau nggak semuanya kebaca satu tumpukan. */}
          <div className="relative mt-4 grid items-start gap-14 sm:mt-24 lg:grid-cols-2 lg:gap-10">
            <Awan n={5} sisi="kanan" atas="-5rem" lebar="clamp(150px, 19vw, 360px)" keluar={0.35} redup={0.75} balik durasi={23} jeda={3} className="hidden sm:block" />

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

      <Band ratio="1920/1900">
        <Container className="flex flex-col justify-center gap-14 pb-40 pt-28 sm:pb-48 sm:pt-36 lg:gap-10">
          <div className="relative">
            <Awan n={3} sisi="kanan" atas="-3.5rem" lebar="clamp(220px, 32vw, 620px)" keluar={0.35} durasi={25} jeda={7} />
            <Awan n={6} sisi="kiri" atas="0rem" lebar="clamp(125px, 17vw, 320px)" keluar={0.45} redup={0.75} durasi={21} jeda={14} />

            <Reveal>
              <TitleGlow as="h2" className="text-center text-4xl sm:text-5xl">
                Tagline
              </TitleGlow>
            </Reveal>
            <Reveal delay={160}>
              <Paragraf
                className="mt-6 max-w-4xl sm:mt-8"
                size="clamp(22px, 2.2vw, 38px)"
              >
                {copy.tagline}
              </Paragraf>
            </Reveal>
          </div>

          <div className="relative grid items-start gap-14 lg:grid-cols-2 lg:gap-10">
            {/* Dua awan di celah antara Theme/Concept dan kotak sponsor. */}
            <Awan n={1} sisi="kanan" atas="calc(100% + 2rem)" lebar="clamp(190px, 28vw, 540px)" keluar={0.3} balik durasi={22} jeda={2} />
            <Awan n={2} sisi="kiri" atas="calc(100% + 3.5rem)" lebar="clamp(170px, 24vw, 480px)" keluar={0.35} redup={0.8} durasi={27} jeda={16} />

            <TwoCol judul="Theme" from="left">
              {copy.theme}
            </TwoCol>
            <TwoCol judul="Concept" from="right">
              {copy.concept}
            </TwoCol>
          </div>

          <div className="mt-20 rounded-xl border border-line bg-surface/90 p-4 sm:mt-28 sm:p-6">
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
    </div>
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
        /* Lebar per layar biar TINGGI pitanya kira-kira setara. Dulu 165%
           di HP → cuma ±66px, kelihatan kayak garis tipis. */
        className="pointer-events-none absolute left-1/2 max-w-none w-[300%] sm:w-[200%] lg:w-[130%]"
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
  /* Minimal 16px: di HP 15px + huruf timbul dua lapis kebaca buram. */
  size = "clamp(16px, 1.1vw, 20px)",
}: {
  children: React.ReactNode;
  className?: string;
  size?: string;
}) {
  return (
    <p
      className={`prose-starlight mx-auto ${className ?? ""}`}
      style={{ fontSize: size }}
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
          <TitleGlow as="h3" className="text-3xl sm:text-4xl">{judul}</TitleGlow>
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
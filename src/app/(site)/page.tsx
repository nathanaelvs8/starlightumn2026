import { Band } from "@/components/ui/Band";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { Comets } from "@/components/site/Comets";
import { Awan } from "@/components/site/Awan";
import { asset } from "@/lib/assets";
import { copy } from "@/lib/copy";
import { SPONSOR, MEDIA_PARTNER } from "@/lib/sponsor";
import { createClient } from "@/lib/supabase/server";

/*
  Dirender per permintaan, bukan sekali pas build: tombol Vote &
  Registrasi di hero ngikutin setelan admin. Kalau statis, tombolnya
  kebeku sesuai setelan di hari build.
*/
export const dynamic = "force-dynamic";

/**
 * Link registrasi penonton — diatur admin di /admin (saklar + link).
 * `null` = tombolnya nggak ditampilin sama sekali: saklarnya mati, link
 * belum diisi, atau kolom setelannya belum ada di database.
 * (Dulu link-nya ditulis di sini dan tombolnya tampil abu-abu mati
 * selama belum diisi — kelihatan kayak tombol rusak.)
 *
 * Nggak pakai try/catch: Supabase nggak ngelempar kalau query gagal,
 * dia balikin `error` — dan itu udah ditangani di bawah.
 */
async function linkRegistrasi(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vote_settings")
    .select("registrasi_aktif, registrasi_url")
    .eq("id", 1)
    .single();
  if (error || !data?.registrasi_aktif || !data.registrasi_url) return null;
  return /^https?:\/\//i.test(data.registrasi_url) ? data.registrasi_url : null;
}

/** Voting lagi dibuka? Dipakai buat nampilin tombol "Vote Sekarang" di hero. */
async function votingDibuka() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vote_settings")
    .select("is_open, is_finished")
    .eq("id", 1)
    .single();
  return !!data?.is_open && !data?.is_finished;
}

export default async function HomePage() {
  const [registrasi, voting] = await Promise.all([linkRegistrasi(), votingDibuka()]);

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
        <LampuSorot />
        <Comets />
        <Container className="relative flex min-h-[100svh] flex-col items-center justify-center gap-6 pb-14 pt-[110px] text-center sm:pb-20 sm:pt-[130px]">
          <Awan n={5} sisi="kiri" atas="24%" lebar="clamp(110px, 21vw, 390px)" keluar={0.35} redup={0.8} durasi={22} />
          {/* Di HP logonya hampir selebar layar, jadi awan kanan diturunin
              ke bawah tombol biar nggak nempel ke ujung bintang. */}
          <Awan n={6} sisi="kanan" atas="80%" lebar="clamp(140px, 18vw, 350px)" keluar={0.3} redup={0.75} balik durasi={26} jeda={9} className="sm:hidden" />
          <Awan n={6} sisi="kanan" atas="58%" lebar="clamp(140px, 18vw, 350px)" keluar={0.3} redup={0.75} balik durasi={26} jeda={9} className="hidden sm:block" />

          {/*
            Hero = logo aja, TANPA tulisan. Sempat ada subjudul + kotak
            "panggung terdekat" + tombol — kesannya kayak template generik.
            Biar nggak kosong, logonya digedein, melayang pelan, dan ada
            cahaya dua warna di belakangnya: ungu di kiri (sisi "Star"),
            emas di kanan (sisi "light") — ngikutin dua warna logonya.

            `isolate` biar cahayanya (-z-10) tetap di DEPAN langit tapi di
            BELAKANG logo. Tiap gerakan di elemennya sendiri karena
            semuanya pakai transform: geser-pas-scroll di pembungkus
            (.hero-gulir), pop sekali jalan di <h1>, melayang di <span>
            (logo + kerlip di ujung bintangnya ikut melayang bareng).
          */}
          <div className="hero-gulir">
            <h1 className="logo-pop relative isolate">
              <span
                aria-hidden
                className="hero-halo pointer-events-none absolute -inset-x-[30%] -inset-y-[20%] -z-10"
                style={{
                  background:
                    "radial-gradient(closest-side at 36% 50%, rgba(150,95,255,0.38), transparent), radial-gradient(closest-side at 64% 50%, rgb(var(--c-emas-rgb) / 0.32), transparent)",
                }}
              />
              <span className="hero-melayang relative block">
                <img
                  src={asset.logo.main}
                  alt="Starlight UMN 2026"
                  draggable={false}
                  className="mx-auto w-[300px] sm:w-[380px] lg:w-[460px]"
                />
                <KerlipUjungBintang />
              </span>
            </h1>
          </div>

          {/* Tombol cuma muncul kalau ada yang perlu dilakukan: voting
              lagi dibuka, atau registrasi penonton dinyalain admin.
              Selain itu hero-nya bersih, cuma logo. */}
          {(voting || registrasi) && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              {voting && <ButtonLink href="/vote">Vote Sekarang</ButtonLink>}
              {registrasi && (
                <ButtonLink href={registrasi} external variant={voting ? "outline" : "solid"}>
                  Registrasi Penonton
                  <span aria-hidden>↗</span>
                  <span className="sr-only">(buka di tab baru)</span>
                </ButtonLink>
              )}
            </div>
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
              {/* max-w-2xl: ±75 huruf per baris di laptop (dulu 4xl, ±100). */}
              <Paragraf className="mt-6 max-w-2xl sm:mt-8">
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

            <TwoCol judul="Theme" subjudul={copy.temaNama} from="left">
              {copy.theme}
            </TwoCol>
            <TwoCol judul="Concept" subjudul={copy.konsepNama} from="right">
              {copy.concept}
            </TwoCol>
          </div>

          {/*
            Sponsor & Media Partner — cuma tampil kalau daftarnya udah
            diisi (src/lib/sponsor.ts).

            Sengaja TANPA kotak/panel: logonya jalan langsung di atas
            langit. Panel kaca (atau kotak per logo) jadi elemen paling
            mencolok, nutupin ilustrasi latar, dan logo yang punya latar
            sendiri jadi kelihatan "kotak di dalam kotak". File logonya
            udah disiapin buat latar gelap (convert-sponsor.js).
          */}
          {(SPONSOR.length > 0 || MEDIA_PARTNER.length > 0) && (
            <div className="mt-20 space-y-14 sm:mt-28 sm:space-y-20">
              <DaftarLogo judul="Our Sponsor" logo={SPONSOR} besar />
              <DaftarLogo judul="Our Media Partner" logo={MEDIA_PARTNER} />
            </div>
          )}
        </Container>
      </Band>
    </div>
  );
}

/**
 * Lampu sorot panggung di hero — Starlight itu kompetisi bakat, jadi
 * logonya "disorot" kayak di atas panggung. Dua berkas dari pojok bawah,
 * nyilang di belakang logo dan nyapu pelan: ungu dari kiri (sisi Isle),
 * emas dari kanan (sisi Auradon), sama kayak dua warna logonya.
 *
 * Bentuk berkasnya dari conic-gradient yang berpusat di sumber cahaya
 * (tepinya udah lembut dari gradasinya, nggak perlu filter blur yang
 * berat), lalu dipudarkan ke ujung atas pakai mask.
 */
function LampuSorot() {
  const pudar = "linear-gradient(to top, #000 0%, rgba(0,0,0,0.6) 50%, transparent 100%)";
  const berkas = (warna: string) => ({
    background: `conic-gradient(from -14deg at 50% 100%, transparent 0deg, ${warna} 7deg, ${warna} 21deg, transparent 28deg)`,
    maskImage: pudar,
    WebkitMaskImage: pudar,
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="lampu-kiri absolute bottom-0 left-[6%] block h-[115%] [aspect-ratio:1/2]"
        style={berkas("rgba(165,110,255,0.3)")}
      />
      <span
        className="lampu-kanan absolute bottom-0 left-[94%] block h-[115%] [aspect-ratio:1/2]"
        style={berkas("rgb(var(--c-emas-rgb) / 0.28)")}
      />
    </div>
  );
}

/**
 * Kerlip di lima ujung bintang logo, gantian nyala. Posisinya persen
 * dari kotak gambar logo (starlight-hero.webp): ujung atas, lengan
 * kiri-kanan, kaki kiri-kanan. Warnanya ngikutin sisi logonya — ungu di
 * kiri, emas di kanan, putih hangat di puncak.
 */
const UJUNG_BINTANG = [
  { x: 50.6, y: 15, warna: "#fff3d6", ukuran: 22, durasi: 3.4, mulai: 0 },
  { x: 14, y: 41, warna: "#d8c2ff", ukuran: 16, durasi: 4.2, mulai: 1.3 },
  { x: 86, y: 42, warna: "#ffe2a0", ukuran: 18, durasi: 3.8, mulai: 2.4 },
  { x: 26, y: 85, warna: "#d8c2ff", ukuran: 14, durasi: 4.6, mulai: 3.1 },
  { x: 72.5, y: 85, warna: "#ffe2a0", ukuran: 15, durasi: 4, mulai: 0.7 },
];

function KerlipUjungBintang() {
  return (
    <>
      {UJUNG_BINTANG.map((k, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${k.x}%`, top: `${k.y}%` }}
        >
          <span
            className="dekor-kerlip block"
            style={{ animationDuration: `${k.durasi}s`, animationDelay: `-${k.mulai}s` }}
          >
            <svg
              viewBox="0 0 12 12"
              width={k.ukuran}
              height={k.ukuran}
              style={{ filter: `drop-shadow(0 0 5px ${k.warna}) drop-shadow(0 0 12px ${k.warna})` }}
            >
              <path d="M6 0Q6.9 5.1 12 6Q6.9 6.9 6 12Q5.1 6.9 0 6Q5.1 5.1 6 0Z" fill={k.warna} />
            </svg>
          </span>
        </span>
      ))}
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

/*
  Lebar maksimal paragraf dua kolom (Vision/Mission, Theme/Concept).
  Dulu "max-w-full" — di laptop satu baris jadi ±90 huruf, rata tengah,
  capek dibaca. 34rem ≈ 65–70 huruf per baris. Di HP nggak ngaruh
  (layarnya udah lebih sempit dari ini).
*/
const LEBAR_KOLOM = "max-w-[34rem]";

type LogoSponsor = { nama: string; src: string };

/**
 * Logo sponsor / media partner. Kosong = nggak dirender.
 *
 * Logonya JALAN terus ke samping (marquee), langsung di atas langit —
 * tanpa kotak. File logonya udah disiapin buat latar gelap
 * (convert-sponsor.js). Kalau logonya banyak, dibagi dua baris yang
 * jalannya berlawanan arah; kalau cuma sedikit (di bawah 6), diam
 * berjejer — jalur yang terlalu pendek bakal kelihatan bolong pas muter.
 */
function DaftarLogo({
  judul,
  logo,
  besar,
}: {
  judul: string;
  logo: LogoSponsor[];
  besar?: boolean;
}) {
  if (logo.length === 0) return null;
  const tengah = Math.ceil(logo.length / 2);
  const baris = logo.length > 8 ? [logo.slice(0, tengah), logo.slice(tengah)] : [logo];

  return (
    <section>
      {/* Gaya judulnya sama kayak judul bagian lain di homepage (About
          Us, Theme, ...) — sekarang Sponsor berdiri sebagai bagian
          sendiri di atas langit, bukan judul kecil di dalam panel. */}
      <Reveal>
        <TitleGlow as="h2" className="text-center text-3xl sm:text-4xl">
          {judul}
        </TitleGlow>
      </Reveal>
      {logo.length < 6 ? (
        <ul className="mt-6 flex flex-wrap justify-center sm:mt-8">
          {logo.map((l) => (
            <ItemLogo key={l.nama} l={l} besar={besar} />
          ))}
        </ul>
      ) : (
        /* Selebar LAYAR, bukan selebar Container: logonya masuk dari tepi
           layar & keluar di tepi seberang (ujungnya dipudarkan .marquee).
           Geseran mendatarnya dipotong overflow-hidden di Band. */
        <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 space-y-6 sm:mt-10 sm:space-y-10">
          {baris.map((isi, i) => (
            <Marquee key={i} logo={isi} balik={i % 2 === 1} besar={besar} detik={34 + i * 6} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Satu jalur berjalan. Isinya ditulis DUA kali berdampingan, lalu
 * jalurnya digeser -50% berulang-ulang: pas salinan kedua sampai di
 * posisi salinan pertama, animasinya mulai lagi dari awal — sambungannya
 * nggak kelihatan. Salinan kedua disembunyiin dari screen reader.
 * Berhenti pas disentuh kursor (biar logonya bisa dilihat), dan diam
 * berjejer buat yang nyalain "kurangi animasi" (lihat globals.css).
 *
 * Semua logo SELALU berwarna penuh. Sempat dicoba "lampu sorot" (cuma
 * logo di tengah yang berwarna, sisanya abu-abu) — dibatalin: sponsor
 * bayar biar logonya kelihatan, dan warna itu identitas brand mereka.
 */
function Marquee({
  logo,
  balik,
  besar,
  detik,
}: {
  logo: LogoSponsor[];
  balik?: boolean;
  besar?: boolean;
  detik: number;
}) {
  return (
    <div className="marquee overflow-hidden">
      <div
        className="marquee-jalur"
        style={{ animationDuration: `${detik}s`, animationDirection: balik ? "reverse" : "normal" }}
      >
        <ul className="flex shrink-0 items-center">
          {logo.map((l) => (
            <ItemLogo key={l.nama} l={l} besar={besar} />
          ))}
        </ul>
        <ul aria-hidden className="marquee-salinan flex shrink-0 items-center">
          {logo.map((l) => (
            <ItemLogo key={l.nama} l={l} besar={besar} salinan />
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Satu logo. Kotaknya (tak kelihatan) ukurannya sama semua, logonya
 * dimuat di dalamnya — jadi logo yang melebar & yang bundar kebaca
 * seimbang. Jaraknya pakai padding, bukan gap, biar lebar satu salinan
 * pas buat sambungan marquee.
 */
function ItemLogo({ l, besar, salinan }: { l: LogoSponsor; besar?: boolean; salinan?: boolean }) {
  return (
    <li className="shrink-0 px-4 sm:px-8">
      <div
        className={`flex items-center justify-center ${
          besar ? "h-12 w-28 sm:h-[72px] sm:w-44" : "h-10 w-24 sm:h-14 sm:w-32"
        }`}
      >
        {/* Sengaja BUKAN loading="lazy": logo yang mulai di luar layar
            sebelah kanan baru dimuat pas udah jalan masuk, jadi nongol
            telat sebagai tempat kosong. Totalnya cuma ±300KB. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={l.src}
          alt={salinan ? "" : l.nama}
          decoding="async"
          draggable={false}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </li>
  );
}

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
  subjudul,
  children,
  from = "up",
}: {
  judul: string;
  /**
   * Nama tema / konsepnya, tampil besar warna emas di bawah judul
   * (pola dari Starlight 2025: "THEME" lalu nama temanya). Emas = sisi
   * Auradon dari logo; dipakai hemat, cuma di sini & tombol utama.
   */
  subjudul?: string;
  children?: React.ReactNode;
  from?: "up" | "left" | "right";
}) {
  return (
    <div className="flex flex-col">
      <Reveal from={from}>
        <div className="flex h-[clamp(44px,5vw,72px)] items-center justify-center">
          <TitleGlow as="h3" className="text-3xl sm:text-4xl">{judul}</TitleGlow>
        </div>
        {subjudul && (
          <p className="mt-3 text-center font-display text-2xl text-emas [text-shadow:0_0_18px_rgb(var(--c-emas-rgb)/0.45)] sm:text-3xl">
            {subjudul}
          </p>
        )}
      </Reveal>

      <Reveal from={from} delay={160}>
        <div className="mt-5">
          <Paragraf className={LEBAR_KOLOM}>{children}</Paragraf>
        </div>
      </Reveal>
    </div>
  );
}
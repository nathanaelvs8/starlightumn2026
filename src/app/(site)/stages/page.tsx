import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { Reveal } from "@/components/ui/Reveal";
import Link from "next/link";
import { MagicCircle, POSISI_SEAL, WARNA_SIHIR, GLOW_SIHIR } from "@/components/site/MagicCircle";
import { StageSeal } from "@/components/site/StageSeal";
import { RasiLangit } from "@/components/site/RasiLangit";
import { asset } from "@/lib/assets";
import { stages, tanggalPanggung, type Stage } from "@/lib/stages";
import { isAdmin } from "@/lib/admin";
import clsx from "@/lib/clsx";

export const metadata = { title: "Stages · Starlight UMN 2026" };

/**
 * Daftar panggung — ketiganya masih KEKUNCI.
 *
 * === Susunannya ===
 *
 * Bukan tiga gambar ditaruh sejajar, tapi satu lingkaran sihir dengan
 * tiga seal di sudut segitiga yang tertulis di dalamnya. Urutannya
 * searah jarum jam ngikutin urutan acara (urutan di src/lib/stages.ts):
 *
 *        Lonielle (atas)          3–4 Okt  — segelnya udah kebuka
 *         ╱        ╲
 *   Enchantia  ─  Twizzle
 *  (kiri-bawah)   (kanan-bawah)   Twizzle 8–9 Okt, Enchantia 4 Nov
 *
 * Titik sudutnya dihitung sekali di MagicCircle.tsx (POSISI_SEAL), terus
 * dipakai bareng sama gambar segitiganya. Jadi logonya selalu duduk
 * persis di ujung garis, bukan kira-kira.
 *
 * === Kenapa arenanya persegi ===
 *
 * Supaya persen mendatar dan menurun artinya sama, jadi segitiganya
 * beneran sama sisi. Ukurannya dibatasi vh juga biar di laptop pendek
 * tetap keliatan utuh tanpa discroll.
 *
 * Seal-nya sengaja MELUAP keluar arena (pusatnya di 37,5% + jari-jari
 * seal 22% = 59,5% > 50%). Itu disengaja — arenanya kotak ukur buat
 * lingkarannya, bukan batas potong. Wadah luarnya dikasih ruang lega
 * biar nggak ada yang kepotong dan nggak bikin geseran mendatar.
 *
 * Di HP susunan segitiga nggak muat. Yang dipakai bukan tumpukan rata
 * tengah — itu kebaca sebagai tiga bulatan beruntun, mirip deretan
 * avatar, dan nggak ada yang nunjukin ketiganya satu rangkaian.
 * Gantinya segitiganya DIBUKA jadi jalur menurun: segelnya gantian
 * kiri-kanan, disambung garis penghubung yang bahan visualnya sama
 * kayak sisi segitiga di layar lebar (garis solid ber-gradient +
 * titik denyut). Nama & tagline-nya ditaruh di sisi kosongnya, karena
 * logo versi kekunci itu wordmark berantai yang nggak kebaca di lebar
 * segitu — tanpa label, ketiganya cuma tiga gumpalan putih yang mirip.
 */

/**
 * Lebar sisi arena.
 *
 * Sengaja NGGAK dibatasi tinggi layar. Kalau dibatasi vh, di laptop
 * yang layarnya lebar tapi pendek arenanya nyusut drastis dan logonya
 * jadi kekecilan buat kebaca. Mending arenanya tetap besar dan
 * halamannya bisa discroll dikit.
 *
 * Batas 76vw-nya dari lebar TOTAL susunan: seal paling pinggir nongol
 * sampai (64,95 + 52) / 2 = 58,5% sisi arena dari pusat, jadi total
 * lebarnya ±117% arena. Di layar 1024px (batas `lg`) itu jadi ±910px,
 * masih muat di dalam Container tanpa bikin geseran mendatar.
 */
const ARENA = "min(76vw, 880px)";

/** Ukuran tiap seal, dalam persen sisi arena. */
const SEAL = 52;

export default async function StagesPage() {
  /* Admin boleh masuk ke panggung yang masih disegel; yang lain cuma
     bisa buka yang `terbuka`. */
  const admin = await isAdmin();

  return (
    <>
      {/* Background FIXED — nggak ikut memanjang sama isi, sama kayak
          pola di /division dan /faq. Footer naik nutupin pas mentok. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.stages.bg}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-night/55" />
      {/* Rasi-rasi kecil yang digambar satu-satu di pinggir langit —
          tiga panggung di tengah itu rasi paling besarnya. */}
      <RasiLangit />

      <Container className="pb-32 pt-12 sm:pb-40 sm:pt-16">
        <Reveal>
          <TitleGlow className="text-center text-5xl sm:text-6xl">
            Stages
          </TitleGlow>
          <p className="mx-auto mt-4 max-w-xl text-center font-alice text-sm text-white/70 sm:text-base">
            {"Starlight UMN 2026 terdiri atas tiga panggung. Pilih salah satu panggung untuk melihat detailnya."}
          </p>
        </Reveal>

        {/* ---------- Susunan segitiga (layar lebar) ----------
            Seal paling atas pusatnya di 12,5% dan jari-jarinya 26%,
            jadi dia nongol ±13,5% sisi arena ke ATAS arena. Ruangnya
            disiapin di sini biar nggak nabrak subjudul. */}
        <div
          className="hidden justify-center lg:flex"
          style={{ paddingTop: `calc(${ARENA} * 0.14)` }}
        >
          <div className="relative aspect-square" style={{ width: ARENA }}>
            <MagicCircle
              segitiga
              className="absolute inset-0 h-full w-full opacity-95"
            />

            {stages.map((stage, i) => (
              <div
                key={stage.slug}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${POSISI_SEAL[i].left}%`,
                  top: `${POSISI_SEAL[i].top}%`,
                }}
              >
                <StageSeal stage={stage} size={`calc(${ARENA} * ${SEAL / 100})`} priority admin={admin} />
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Jalur konstelasi (HP & tablet) ---------- */}
        <div className="mt-10 lg:hidden">
          {stages.map((stage, i) => (
            <div key={stage.slug}>
              {i > 0 && <Penghubung kanan={i % 2 === 1} />}
              <Baris stage={stage} kanan={i % 2 === 1} priority={i === 0} admin={admin} />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}

/* ====================================================================
   JALUR KONSTELASI — versi HP & tablet dari susunan segitiga.
   ==================================================================== */

/**
 * Lebar segel di jalur konstelasi, dalam persen lebar baris.
 *
 * 50% itu kompromi buat layar 360px — yang paling sempit yang masih
 * wajar didukung. Di situ Container nyisain 320px, jadi segelnya 160px
 * dan kolom teksnya 148px. Nama panggung terpanjang, "Enchantia",
 * dirender pakai Efco Brookshire yang hurufnya melebar; di text-xl dia
 * makan ±105px, jadi masih ada sisa. Kalau angka ini dinaikin, ukuran
 * namanya harus ikut diturunin — namanya satu kata, nggak bisa turun
 * baris kalau kepepet.
 */
const SEAL_HP = 50;

/**
 * Pusat segel diukur dari sisi barisnya. Segelnya nempel di pinggir,
 * jadi pusatnya di setengah lebarnya sendiri. Dipakai buat nentuin
 * ujung garis penghubung — diturunkan dari SEAL_HP, bukan ditulis
 * ulang, biar garisnya nggak bisa meleset kalau lebarnya disetel.
 */
const PUSAT_HP = SEAL_HP / 2;

/**
 * Satu panggung di jalur konstelasi: segel di satu sisi, nama dan
 * tagline di sisi kosongnya.
 *
 * Satu baris = SATU tautan, bukan segel-nya sendiri yang diklik. Di HP
 * target sentuh sebesar mungkin itu murah dan langsung kerasa, dan
 * kalau namanya nggak ikut bisa diketuk orang bakal ngetuk namanya
 * duluan lalu ngira halamannya rusak. Makanya segelnya dirender
 * `tanpaLink` — tautan di dalam tautan itu HTML nggak sah.
 */
function Baris({
  stage,
  /** Segelnya di kanan? Kalau nggak, di kiri. Gantian tiap panggung. */
  kanan,
  priority,
  admin,
}: {
  stage: Stage;
  kanan: boolean;
  priority?: boolean;
  admin?: boolean;
}) {
  const terbuka = !!stage.terbuka;
  const bisaDibuka = terbuka || !!admin;

  const isi = (
    <>
      <StageSeal
        stage={stage}
        size={`${SEAL_HP}%`}
        priority={priority}
        tanpaLink
        admin={admin}
        className="shrink-0"
      />

      <div className={clsx("min-w-0 flex-1", kanan && "text-right")}>
        <h2 className="font-display text-xl leading-tight text-white [text-shadow:0_0_18px_rgba(190,184,255,0.45)] sm:text-3xl">
          {stage.name}
        </h2>

        {/* Garis pendek warna panggungnya — penanda yang sama sekali
            nggak makan tempat, tapi bikin ketiganya langsung kebaca
            sebagai tiga hal yang beda, bukan tiga blok teks. */}
        <span
          aria-hidden
          className={clsx("mt-2 block h-px w-8", kanan && "ml-auto")}
          style={{
            background: stage.accent,
            boxShadow: `0 0 10px ${stage.accent}`,
          }}
        />

        {/* Tanggalnya — warna emas, sama kayak kartu panggung terdekat
            di hero homepage. */}
        <p className="mt-2.5 font-alice text-xs tracking-wide text-emas sm:text-sm">
          {tanggalPanggung(stage)}
        </p>

        <p className="mt-1.5 font-alice text-[11px] leading-relaxed text-white/70 sm:text-sm">
          {stage.tagline}
        </p>

        {/* Petunjuk yang SELALU kelihatan. Semua tanda "bisa diklik"
            yang lain nempel di hover, dan di HP hover itu nggak ada
            sama sekali. Yang masih disegel dapet keterangan diam,
            tanpa panah — biar nggak dikira tombol. */}
        {bisaDibuka ? (
          <span
            className={clsx(
              "mt-3 inline-flex items-center gap-1.5 font-alice text-[10px] uppercase tracking-[0.2em] text-white/55 transition-colors duration-300 group-hover:text-white group-active:text-white sm:text-xs",
              kanan && "flex-row-reverse",
            )}
          >
            {terbuka ? "Lihat Panggung" : "Pratinjau Admin"}
            <span
              aria-hidden
              className={clsx(
                "transition-transform duration-300",
                kanan
                  ? "group-hover:-translate-x-1 group-active:-translate-x-1"
                  : "group-hover:translate-x-1 group-active:translate-x-1",
              )}
            >
              {kanan ? "←" : "→"}
            </span>
          </span>
        ) : (
          <span className="mt-3 inline-block font-alice text-[10px] uppercase tracking-[0.2em] text-white/40 sm:text-xs">
            Segera Dibuka
          </span>
        )}
      </div>
    </>
  );

  const kelas = clsx(
    "flex items-center gap-3 sm:gap-5",
    kanan && "flex-row-reverse",
  );

  return (
    <Reveal from={kanan ? "right" : "left"}>
      {bisaDibuka ? (
        <Link
          href={`/stages/${stage.slug}`}
          aria-label={
            terbuka
              ? `Panggung ${stage.name}, ${tanggalPanggung(stage)}`
              : `Panggung ${stage.name}, ${tanggalPanggung(stage)} — pratinjau admin`
          }
          className={clsx("group outline-offset-4", kelas)}
        >
          {isi}
        </Link>
      ) : (
        <div className={kelas}>{isi}</div>
      )}
    </Reveal>
  );
}

/**
 * Garis penghubung antar dua panggung — sisi segitiga yang "dibuka".
 *
 * Bahannya sengaja disamain persis sama polygon di MagicCircle: garis
 * solid tipis yang pudar di kedua ujungnya, plus satu titik cahaya yang
 * denyut di tengah. Itu yang bikin versi HP kebaca sebagai susunan yang
 * SAMA kayak di layar lebar, cuma dilipat.
 *
 * Kotaknya dibiarin gepeng (`preserveAspectRatio="none"`) supaya ujung
 * garisnya nempel tepat di pusat segel berapa pun lebar layarnya, tanpa
 * perlu tau tinggi barisnya. Tebal garisnya nggak ikut ketarik karena
 * dikunci `vector-effect="non-scaling-stroke"`.
 */
function Penghubung({
  /** Segel di baris BAWAH ada di kanan? Yang atas otomatis kebalikannya. */
  kanan,
}: {
  kanan: boolean;
}) {
  const dari = kanan ? PUSAT_HP : 100 - PUSAT_HP;
  const ke = kanan ? 100 - PUSAT_HP : PUSAT_HP;
  const id = `konstelasi-${kanan ? "ka" : "ki"}`;

  return (
    <div
      aria-hidden
      /* Ditarik naik-turun karena segelnya kotak persegi sementara
         logonya melebar — di atas & bawah logo ada ruang kosong bawaan.
         Tanpa ini jarak antar panggung jadi jauh banget padahal yang
         misahin cuma udara. */
      className="relative -my-4 h-16 sm:-my-5 sm:h-20"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        className="h-full w-full"
        style={{ color: WARNA_SIHIR, filter: GLOW_SIHIR }}
      >
        <defs>
          <linearGradient
            id={id}
            gradientUnits="userSpaceOnUse"
            x1={dari}
            y1="0"
            x2={ke}
            y2="100"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <line
          x1={dari}
          y1="0"
          x2={ke}
          y2="100"
          stroke={`url(#${id})`}
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Titik cahaya di tengah garis. Ditaruh sebagai elemen HTML, bukan
          <circle> di dalam SVG-nya — di kotak yang sengaja digepengin
          begitu, lingkaran bakal ikut jadi lonjong. Posisinya dipisah ke
          pembungkus luar karena .seal-pulse animasinya transform, jadi
          bakal nabrak kalau ditumpuk sama translate. */}
      <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span
          className="seal-pulse block h-1.5 w-1.5 rounded-full"
          style={{
            background: WARNA_SIHIR,
            boxShadow: `0 0 6px ${WARNA_SIHIR}, 0 0 16px rgba(190,184,255,0.7)`,
          }}
        />
      </span>
    </div>
  );
}

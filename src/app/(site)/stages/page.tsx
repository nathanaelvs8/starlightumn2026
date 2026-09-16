import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { Reveal } from "@/components/ui/Reveal";
import { MagicCircle, POSISI_SEAL } from "@/components/site/MagicCircle";
import { StageSeal } from "@/components/site/StageSeal";
import { asset } from "@/lib/assets";
import { stages } from "@/lib/stages";

export const metadata = { title: "Stages · Starlight UMN 2026" };

/**
 * Daftar panggung — ketiganya masih KEKUNCI.
 *
 * === Susunannya ===
 *
 * Bukan tiga gambar ditaruh sejajar, tapi satu lingkaran sihir dengan
 * tiga seal di sudut segitiga yang tertulis di dalamnya. Urutannya
 * searah jarum jam ngikutin urutan acara:
 *
 *        Twizzle (atas)
 *         ╱        ╲
 *   Enchantia  ─  Lonielle
 *  (kiri-bawah)   (kanan-bawah)
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
 * Di HP susunan segitiga nggak muat — jadi ditumpuk ke bawah, tiap
 * logo tetap bawa cincin kecilnya sendiri.
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

export default function StagesPage() {
  return (
    <>
      {/* Background FIXED — nggak ikut memanjang sama isi, sama kayak
          pola di /division dan /faq. Footer naik nutupin pas mentok. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.stages.bg}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a1430]/55" />

      <Container className="pb-32 pt-12 sm:pb-40 sm:pt-16">
        <Reveal>
          <TitleGlow className="text-center text-5xl sm:text-6xl">
            Stages
          </TitleGlow>
          <p className="mx-auto mt-4 max-w-xl text-center font-alice text-sm text-white/70 sm:text-base">
            {"Tiga panggung, tiga babak. Segelnya belum dibuka — sentuh salah satunya untuk melihat apa yang menanti di baliknya."}
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
                <StageSeal stage={stage} size={`calc(${ARENA} * ${SEAL / 100})`} priority />
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Tumpukan (HP & tablet) ----------
            Jaraknya sengaja MINUS. Tiap seal itu kotak persegi, padahal
            logonya melebar — jadi di atas & bawah logo ada ruang kosong
            bawaan hampir 85px. Ditumpuk apa adanya, jarak antar logo
            jadi ±200px dan harus discroll jauh cuma buat lihat tiga
            gambar. Ditarik 64px, ruang kosongnya kepakai dan logonya
            sendiri tetap nggak pernah ketindihan. */}
        <div className="mt-8 flex flex-col items-center -space-y-16 lg:hidden">
          {stages.map((stage, i) => (
            <Reveal key={stage.slug} delay={i * 120}>
              <StageSeal stage={stage} size="min(82vw, 380px)" priority={i === 0} />
            </Reveal>
          ))}
        </div>
      </Container>
    </>
  );
}

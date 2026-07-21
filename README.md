# Starlight UMN 2026 — Website

Next.js 14 (App Router) + TypeScript + Tailwind.

Fokus sekarang: **Homepage + Navbar + Footer**. Halaman lain sengaja
masih kosong — cuma background bersama, navbar, dan footer.

## Jalanin

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Taruh aset di mana

Semua gambar masuk ke `public/images/`. **Rename dulu** sebelum ditaruh —
nama file dari Drive banyak yang pakai spasi dan huruf besar campur.
Di laptop lu itu aman, tapi di Vercel (Linux) huruf besar-kecil
dibedain, jadi `STARLIGHT.PNG` nggak akan ketemu kalau kodenya nyari
`starlight.png`. Ini penyebab bug yang cuma muncul setelah deploy.

### `public/images/logo/`

| File di Drive | Rename jadi |
|---|---|
| `MAIN LOGO Starlight.PNG` | `starlight-main.png` |
| `MAIN LOGO Starlight.PNG` (versi kecil) | `starlight-nav.png` |
| `MAIN LOGO Starlight.PNG` (versi footer) | `starlight-footer.png` |
| `LOGO UMN - NO OUTLIENE.png` | `umn.png` |
| `LOGO BEM - NO OUTLINE.png` | `bem.png` |

Kalau logo navbar/footer belum ada versi terpisah, pakai file yang sama
aja — tinggal copy tiga kali dengan nama beda.

### `public/images/home/`

| File di Drive | Rename jadi |
|---|---|
| — **belum ada** — | `band-1-hero.png` |
| `Background Band 2 (About + Vision + Starlight 2026)...` | `band-2-about.png` |
| `Background Band 3 (Concept + Theme + Sponsor)...` | `band-3-concept.png` |
| `judul about us.png` | `judul-about-us.png` |
| `judul vision.png` | `judul-vision.png` |
| `judul mission.png` | `judul-mission.png` |
| `judul concept.png` | `judul-concept.png` |
| `judul theme.png` | `judul-theme.png` |
| `judul tagline.png` | `judul-tagline.png` |
| `isi about us.png` | `isi-about-us.png` |
| `isi concept.png` | `isi-concept.png` |
| `isi theme.png` | `isi-theme.png` |
| `isi tagline.png` | `isi-tagline.png` |
| `Vision.png` | `vision.png` |
| `Mision.png` | `mission.png` |
| `concept.png` | `concept.png` |
| — **belum jelas** — | `identity-2026.png` |

### `public/images/shared/`

| Isi | Nama file |
|---|---|
| Ornamen connector di atas footer | `connector.png` |
| Background footer (1920x700) | `footer-bg.png` |
| Background halaman selain Home | `page-bg.png` |

## Kalau file belum ada

Nggak error, nggak gambar rusak. Komponen `<Asset>` otomatis nampilin
kotak putus-putus berisi nama file yang lagi dicari. Begitu file-nya
ditaruh, gambar langsung muncul — nggak perlu ubah kode.

Buat lihat mana aja yang masih bolong, cari `data-missing-asset` di
DevTools.

## Restyle

**Cukup edit `src/app/tokens.css`.** Semua warna, radius, dan font ada di
situ sebagai CSS variable. Nggak ada warna yang di-hardcode di komponen.

## Struktur

```
public/images/
  logo/     starlight-main, starlight-nav, starlight-footer, umn, bem
  home/     band-*, judul-*, isi-*, vision, mission, concept
  shared/   connector, footer-bg, page-bg

src/
  app/
    tokens.css          ← file buat restyle
    globals.css
    layout.tsx
    (site)/
      layout.tsx        ← navbar + footer
      page.tsx          ← Homepage
      division/         ← kosong
      stages/           ← kosong
      mini-gerda/       ← kosong
      faq/              ← kosong
      vote/             ← kosong
      login/            ← kosong
  components/
    ui/       Asset, Band, Button, Container
    site/     Navbar, Footer
  lib/
    assets.ts           ← peta path gambar, satu tempat
    clsx.ts
```

## Catatan

- **Belum ada animasi** sama sekali, sesuai permintaan. Cuma perubahan
  warna pas hover.
- **Responsif** sampai layar HP. Ukuran px dari wireframe dipakai
  sebagai rasio (`aspect-ratio`), bukan angka mati, jadi gambar nggak
  pernah gepeng dan layout nggak lompat pas gambar loading.
- **Navbar sekarang kondisi belum login** — sesuai wireframe FAQ &
  Stage Detail. Nanti pas auth jadi: sisipin menu `Vote` setelah
  `Stages`, dan ganti tombol Login jadi chip nama user. Dua-duanya udah
  ditandai komentar di `Navbar.tsx` dan `Footer.tsx`.
- **`/login` masih stub** di dalam layout ini. Nanti dipindah ke route
  group `(auth)` sendiri karena layar auth nggak punya navbar & footer.

## Yang masih gw butuh

1. **Background Band 1 (Hero)** — belum ada di folder Drive.
2. **`concept.png` vs `isi concept.png`** bedanya apa.
3. **Identitas Starlight 2026** (kotak ~900x700 di band 2) filenya yang mana.
4. **Connector + background footer** — belum ada.
5. **Nama 13 divisi**, buat halaman Division nanti.
6. **Teks asli About Us & Concept.** Sekarang paragraf dikirim sebagai
   gambar. Di HP, gambar teks selebar 1000px bakal mengecil sampai susah
   dibaca, dan nggak kebaca Google maupun screen reader. Judul jadi
   gambar masih wajar (font custom), tapi isi paragraf sebaiknya teks
   beneran + webfont.

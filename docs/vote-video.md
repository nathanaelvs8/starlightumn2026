# Vote: video & pop-up detail tim

Brief + bahan review. Dibikin Claude; kasih file ini (plus file-file yang
disebut di bawah) ke reviewer lain, terus tempel balik kritiknya.

## Yang diminta

- Admin bisa ngatur nama tim (udah ada), plus **video** dan **gambar sampul**
  tiap tim.
- Video boleh dari mana aja: **unggah langsung**, **link YouTube**, atau
  **link Instagram** (reel/post). Belum diputusin mana yang dipakai, jadi
  semuanya didukung — dipilih per tim di halaman admin.
- Di halaman Vote: kartu tim jadi thumbnail; diketuk → **pop-up detail**
  yang langsung muter videonya.
- Halaman Vote tetap halaman buat **memilih**. Video itu pelengkap.

## Yang udah dibikin

| File | Isi |
|---|---|
| `src/lib/videoTim.ts` | Aturan media bersama: kenali link YouTube/Instagram, sampul otomatis, validasi link, batas ukuran |
| `src/app/api/admin/vote-teams/route.ts` | API admin + **SQL yang harus dijalankan** (kolom `video_url`, `deskripsi`, bucket `team-videos`, policy admin) |
| `src/app/api/vote/route.ts` | Ikut ngirim `video_url` & `deskripsi` ke halaman Vote |
| `src/components/site/EditorTimVote.tsx` | Form tambah/ubah tim di admin |
| `src/components/site/VoteAdmin.tsx` | Panel admin voting, pakai form di atas |
| `src/components/site/VoteBoard.tsx` | Halaman Vote: `KartuTim`, `DetailTim` (pop-up), `PemutarVideo` |

### Admin (`/admin/vote`)

- Sumber video: **Tanpa video / Unggah video / Link YouTube / Instagram**.
- Unggah video: file dicek bisa diputar di browser atau nggak (HEVC `.mov`
  iPhone sering gagal di Chrome → ditolak dengan pesan jelas), lalu dibikin
  **3 cuplikan** (15% / 50% / 85% durasi) buat dipilih jadi thumbnail —
  kayak YouTube Studio. Upload pakai XHR biar ada **progres %**.
- Link YouTube: thumbnail otomatis dari YouTube. Link Shorts disimpan tetap
  `/shorts/…` (pemutarnya tegak).
- Link Instagram: sampul **dicoba diambil otomatis** (lihat "Putaran 2");
  kalau gagal, wajib unggah gambar sampul.
- Semua sumber boleh pakai gambar sampul sendiri — pilih file, seret ke
  kotak unggah, atau tempel (Ctrl+V) di mana aja di form.
- File lama dibuang dari Storage pas diganti / timnya dihapus.
- Kalau SQL belum dijalankan: muncul peringatan, tim tetap bisa ditambah
  tanpa video.

### Halaman Vote (`/vote`)

- Grid **2 kolom di HP**, 3 di desktop — semua pilihan kelihatan sekilas.
- Kartu: sampul (ada ikon putar kalau ada video), nama, jumlah suara,
  **tombol pilih tetap di kartu**.
- Sampul / "Lihat Detail" → detail: video (nunggu dipencet, nggak
  autoplay), nama, jumlah suara, tombol pilih, keterangan.
- Detail: Esc / back HP / × = tutup, fokus balik ke kartu, body nggak ikut
  ke-scroll, halaman belakang `inert`.
- HP: layar penuh; nama tim muncul di bilah atas begitu judul besar nggak
  kelihatan; tombol pilih nempel di bawah. Video tegak setinggi ruang di
  antara bilah atas & tombol pilih.
- Desktop (lg) + video tegak (IG, Shorts, unggahan tegak): dua kolom —
  video kiri, info + tombol kanan. YouTube biasa tetap bertumpuk.
- Embed Instagram setinggi isinya (lihat "Putaran 2"), lebar desktop
  menyesuaikan tinggi layar.

## Aturan situs yang wajib diikutin

- Teks buat pengunjung: **bahasa Indonesia formal, pakai "Anda"**.
- Animasi sekali jalan **< 1 detik** (durasi + jeda).
- Jangan bikin elemen generik ala template / "AI slop": tombol gelembung,
  ikon dekoratif nggak perlu, gradien norak. Ikut bahasa visual Starlight
  (garis tipis bercahaya, kaca gelap, font Alice / display).
- Refinement, bukan redesign.
- Tampilan HP diutamakan.

## Keputusan & alasannya

- **Upload langsung dari browser ke Supabase**, bukan lewat server Next:
  serverless Vercel nolak body > ±4,5 MB.
- **`select("*")` di API**: kolom baru belum tentu ada sebelum SQL
  dijalankan; nyebut nama kolomnya bikin seluruh daftar tim gagal dimuat.
- **YouTube pakai `hqdefault`**, bukan `maxresdefault` (nggak selalu ada).
- **Batas video 50 MB** (`BATAS_VIDEO_MB`) = batas Supabase paket gratis.
  Kalau Pro: naikin di Supabase + konstanta itu.
- **Bukan WebM**: sebagian iPhone nggak bisa muter WebM. Kalau mau
  dikompres otomatis, targetnya MP4 H.264 720p (lihat "Belum").

## Belum / perlu keputusan

1. **Kompres otomatis** video sebelum diunggah (MP4 720p, pakai WebCodecs
   lewat library `mediabunny`, cuma dimuat di halaman admin). Nunggu
   persetujuan nambah dependency.
2. Instagram embed nampilin bingkai Instagram & butuh akun publik — kalau
   mau tampilan bersih, unggah file aslinya.
3. Jumlah suara masih kelihatan selama voting berlangsung (perilaku lama,
   nggak diubah).

## Review GPT (Codex CLI, read-only) — 27 Okt 2026

Dijalankan lewat `codex exec -s read-only` dengan 5 screenshot. Yang
diterima & udah dikerjain:

- Tombol pilih di detail nempel di bawah layar HP (reel/IG tinggi ngubur tombol).
- Halaman belakang `inert` selama detail terbuka (Tab nggak bisa kabur).
- Jumlah suara dihitung di database (`src/lib/suara.ts`), pilihan sendiri
  dicari langsung — dulu ambil semua baris, kepotong di 1.000.
- Daftar pemilih admin diambil per halaman (dulu 1.000 suara & 50 akun doang).
- Galat database / jaringan nggak lagi ditampilkan sebagai "0 suara" /
  "voting belum dibuka"; ada tombol Coba Lagi.
- Vote berhasil tapi penyegaran gagal → tetap dilaporkan tersimpan.
- Semua tombol pilih terkunci selama satu suara disimpan.
- Status voting admin: satu perubahan dalam satu waktu.
- Validasi link: wajib https, path dicek setelah di-parse (`../` ketahuan),
  kode Instagram harus utuh, `photo_url` ikut divalidasi.
- Bucket video dibatasi 50 MB & MP4/MOV di Supabase juga (SQL diperbarui).
- Video: WebM & HEVC ditolak; codec dicek dari kotak `stsd` file, bukan
  dari "browser admin bisa muter".
- Form admin: hasil olah video lama dibuang kalau admin keburu ganti video;
  pilihan cuplikan direset kalau cuplikannya hilang; file baru nggak
  dihapus kalau hasil simpan nggak pasti (sinyal putus); unggahan ada
  batas waktu; sampul diperkecil (maks. 1280px JPEG); HEIC ditolak jelas.
- Pratinjau kartu asli di form admin (komponen bersama `PosterTim`).
- Tombol kartu 44px, nama panjang dipotong rapi (bug `block` vs
  `line-clamp`), aksesibel name "Pilih <nama tim>".
- Video gagal: pesan + tautan "Buka di YouTube/Instagram/file".
- Radio sumber video pakai `<input type="radio">` asli + label link.

Belum / perlu keputusan:

- **Privasi suara (penting):** cara lama menghitung suara butuh semua akun
  boleh baca tabel `votes` (siapa milih siapa). Perbaikannya: fungsi SQL
  `security definer` yang cuma ngeluarin jumlah + RLS `votes` dibatasi ke
  baris sendiri. Perlu ngecek policy RLS yang sekarang dulu.
- Aturan "voting harus terbuka" sebaiknya dijaga database (trigger), bukan
  cuma API.
- Pembersihan file yatim di Storage masih dari tab admin.
- Kompres otomatis video (mediabunny) — nunggu persetujuan.

## Putaran 2 — fokus reels Instagram (27 Okt 2026)

Keluhan pemilik situs dari screenshot HP & desktop: embed IG "nggak full"
(kepotong & bisa di-scroll di dalam), "Buka di Instagram" kekecilan,
panel desktop kebanyakan ruang kosong, sampul IG harus diunggah manual.

Fakta yang udah dicek langsung (bukan tebakan):

- **Embed IG ngabarin tingginya** lewat `postMessage` dari
  `https://www.instagram.com`: string JSON
  `{"type":"MEASURE","details":{"height":N}}` (juga `LOADING`, `MOUNTED`).
  Tingginya ≈ `1,25 × lebar + 209` (kotak media 4:5 + kepala & kaki):
  326→616, 343→637, 375→677, 400→708, 480→808, 540→883. Iframe WAJIB
  `scrolling="no"` — scrollbar-nya makan lebar, kotak medianya mengecil &
  angkanya meleset ±19px.
- Bilah hitam kiri-kanan di reel = kotak 4:5 bawaan embed IG. Nggak bisa
  diubah dari luar iframe. Mau tampil penuh tegak → unggah file MP4-nya.
- **oEmbed IG nggak ngasih `thumbnail_url` lagi** sejak 3 Nov 2025. Saran
  Meta: ambil dari metadata HTML post-nya (`og:image`). Hasilnya 640px
  (reel: 361×640, tegak), ada ikon putar bawaan IG di tengahnya, dan
  URL-nya kedaluwarsa dalam hitungan hari (`oe=`) → harus disalin ke
  bucket kita, bukan disimpan sebagai link.
- `/api/admin/vote-teams/sampul-instagram`: khusus admin, User-Agent jujur
  (nggak menyamar jadi bot Meta), cuma ngakses instagram.com & CDN-nya,
  cek `og:url` memuat kode post-nya + path gambar `/v/` (biar logo /
  halaman login nggak kepakai). Dari laptop: 3 reel asli berhasil
  0,6–1,1 dtk. **Dari server Vercel belum terbukti** — IG bisa minta
  login; form admin lalu minta unggah manual.

Yang dikerjain:

- Embed IG setinggi isinya + placeholder sampul selagi dimuat; cadangan:
  tetap tampil 1,5 dtk setelah `onLoad` kalau kabar tinggi nggak datang.
- Tombol "Buka di Instagram/YouTube" 44px (gaya "Lihat Detail"). Desktop
  dua kolom: pindah ke kolom kanan. (Sempat ada catatan "Jumlah suka di
  Instagram tidak dihitung sebagai suara." — dihapus atas permintaan
  pemilik situs; jangan dipasang lagi.)
- Desktop dua kolom untuk video tegak; HP: nama tim di bilah atas.
- Fokus awal ke dialog, bukan tombol × (cincin fokus oranye pas dibuka
  pakai mouse).
- "Pilihan Anda: X" di atas grid; tombol tim lain → "Ubah pilihan ke tim
  ini".
- YouTube Shorts tegak; sampul rusak → "Tanpa foto".

Review GPT putaran 3 (review kode hasil putaran 2) — diterima & udah
dikerjain:

- Form admin crash kalau SQL belum dijalankan (`igId!` dibaca walau
  `siap=false`) → sumber video cuma diproses kalau `siap`.
- Dua admin buka tim yang sama → form yang basi bisa mengembalikan sampul
  ke file yang udah dihapus → ubah tim cuma ngirim kolom yang berubah;
  nggak ada yang berubah = nggak ngirim apa-apa.
- Tempel gambar A (besar) lalu B (kecil) → A bisa menimpa B → nomor urut
  + "Memproses gambar…", tombol simpan nunggu; semua isian dikunci
  (`<fieldset disabled>`) selama menyimpan.
- Ganti reel di tim lama → sampul reel lama tetap kepilih → sampul reel
  baru dipilih otomatis (sampul lama tetap bisa diklik balik).
- Tombol pilih nggak nempel di tablet & HP landscape (sticky berhenti di
  `sm`, dua kolom baru mulai `lg`) → nempel di semua tata letak kecuali
  desktop dua kolom; panel pakai `overflow-clip` (`hidden` bikin sticky
  mati).
- Embed IG menggantung → dulu "Memuat…" selamanya → batas 10 dtk sejak
  dipasang: "Video Instagram belum dapat dimuat." + Coba lagi + Buka di
  Instagram. Perkiraan tinggi dihitung ulang saat lebar berubah.

Ditolak / dibiarkan: tombol "Buka di Instagram" ketutup bilah pilih pas
detail baru dibuka di HP — kartu IG-nya sendiri udah punya tautan ke
Instagram, dan pas embed gagal tombolnya muncul di tengah kotak videonya.

Review GPT putaran 2 — belum dikerjain, perlu keputusan pemilik situs:

- Tampilkan **periode voting** (tanggal & jam tutup) — datanya belum ada.
- **Sembunyikan jumlah suara** selama voting (ngurangin efek ikut-ikutan)
  — kebijakan acara.
- Tombol **salin tautan tim** (`?tim=` udah ada) buat promosi tiap tim.
- Privasi tabel `votes` + aturan "voting harus terbuka" di database.
- Lisensi musik: reel yang diunggah ulang sebagai MP4 di situs kita bawa
  musik IG-nya keluar dari Instagram.

## Putaran 4 — keputusan pemilik situs (27 Okt 2026)

Disetujui semua; jumlah suara diserahkan ke admin (saklar). GPT nggak
dipakai lagi di putaran ini (kuotanya mau habis).

- **Waktu tutup voting** (admin, WIB, opsional) → pengunjung lihat
  "Pilihan dapat diubah sampai voting ditutup …"; lewat dari jam itu
  status jadi `lewat`: suara ditolak API **dan** database, halaman bilang
  "Voting telah ditutup", tombol "Vote Sekarang" di homepage hilang.
  Hasil tetap baru tampil setelah admin pilih Selesai. Aturannya satu:
  src/lib/statusVoting.ts.
- **Saklar jumlah suara** (admin) → disembunyikan = angkanya nggak
  dikirim API sama sekali (`vote_count: null`) — selama voting DAN
  setelah Selesai.
- **Halaman "Voting Selesai" = rekap, bukan pengumuman pemenang.** Babaknya
  eliminasi: nggak ada peringkat, nggak ada label "Juara" / "Suara
  terbanyak" (keduanya sempat dipasang lalu ditolak pemilik situs — tim
  yang di bawah kebaca kalah duluan). Urutan sama kayak halaman vote; yang
  ditandai cuma pilihan sendiri. Teks: hasil resmi diumumkan panitia.
  `GET /api/admin/vote-teams` sekarang khusus admin (dulu publik & ikut
  ngirim jumlah suara).
- **Bagikan tautan tim** di detail: HP/tablet → lembar bagikan bawaan,
  desktop → salin. `/vote?tim=<id>` untuk yang belum login: pesannya
  nyebut timnya, tombol Masuk balik ke detail tim itu, pratinjau
  WhatsApp/IG nampilin nama & sampul tim (`generateMetadata`).
- **Privasi suara**: dicek langsung — tabel `votes` bisa dibaca **tanpa
  login**. SQL di src/app/api/admin/vote-settings/route.ts: RLS + izin
  "baris sendiri" + pembatas `restrictive` (berlaku di atas izin lama apa
  pun) + fungsi `voting_terbuka()`. Jumlah suara dihitung server pakai
  service role (src/lib/suara.ts) — butuh `SUPABASE_SERVICE_ROLE_KEY` di
  Vercel (udah dipakai daftar pemilih admin).
- Musik: reel pakai lagu dari pustaka musik IG → lisensinya cuma buat
  diputar di Instagram (embed termasuk). Diunduh lalu diunggah sebagai
  MP4 = situs kita yang menyebarkan lagunya. Saran: lagu berlisensi →
  pakai link IG; MP4 → audio asli / bebas royalti.

## Batal pilih (unvote) & "pilihan bisa diganti" — 27 Okt 2026

Masalahnya: orang nggak tau pilihannya bisa diganti / dibatalkan.

- Tombol tim yang dipilih: "✓ Pilihan Anda" + baris kecil "Tekan untuk
  membatalkan". Dipencet → "Batalkan pilihan? · Tekan sekali lagi"
  (merah lembut) → dipencet lagi = batal. 4 detik dibiarin / pindah fokus
  → balik semula (biar nggak kebatal kesenggol jempol).
- Tombol tim lain setelah memilih: "Ganti pilihan" (detail: "Ganti pilihan
  ke tim ini"), bukan "Pilih".
- Teks pembuka & pesan sesudah vote: "Pilihan dapat diganti atau
  dibatalkan sampai voting ditutup".
- `DELETE /api/vote`: cuma selama status `buka`; hapusnya pakai service
  role (src/lib/suara.ts → `batalkanSuara`). Akun biasa sengaja nggak
  punya izin hapus langsung di database (SQL privasi cuma ngasih
  pembatas, tanpa izin hapus).

## Minta di-review

Tolong kritik keras bagian ini:

1. UX pop-up di HP: urutan isi (video → nama → keterangan → tombol),
   tinggi embed Instagram, tombol pilih kadang di bawah lipatan.
2. Kartu 2 kolom di HP: kebaca? nama panjang? tombolnya cukup gede buat jempol?
3. Ikon putar (segitiga garis tipis + glow) — nyatu sama gaya situs?
4. Form admin: alurnya jelas buat panitia yang bukan orang teknis?
5. Bug: race condition pas vote dari pop-up, kebocoran object URL,
   autoplay di iOS, video `.mov`, link aneh yang lolos validasi.
6. Keamanan: validasi `video_url` di server, policy Storage di SQL.

# Rencana Bot WhatsApp Penonton — Starlight UMN 2026

> **Status:** rencana, BELUM dikerjakan. Ditulis 1 Oktober 2026.
> Kalau kamu (Claude / developer) baru baca ini di sesi baru: baca sampai
> habis dulu, lalu cek bagian **Keputusan yang masih ditunggu** — tanyakan
> ke panitia sebelum mulai bikin.

---

## 1. Tujuan

Bot tanya-jawab lewat **WhatsApp** (dan opsional di website) buat
**penonton**. Penonton cuma ada di panggung **Enchantia — 4 November 2026**
(panggung terakhir; Lonielle 3–4 Okt & Twizzle 8–9 Okt nggak ada penonton
umum).

Alur yang diinginkan:

1. Penonton **daftar di web Starlight** (nama + nomor HP + centang setuju
   dihubungi lewat WhatsApp).
2. Setelah daftar, muncul tombol **"Hubungkan WhatsApp"** → membuka
   `wa.me/<nomor bot>?text=...` dengan pesan otomatis → penonton tinggal
   tekan kirim.
3. Bot membalas dengan menu, penonton bisa tanya: lokasi, jadwal / open
   gate, tiket, aturan masuk, dresscode, voting, kontak panitia.

Contoh pembanding yang disebut panitia: UMN Vara, eventory.ai.

---

## 2. Keputusan yang SUDAH diambil

| Hal | Keputusan | Alasan |
|---|---|---|
| Jalur WhatsApp | **WhatsApp Cloud API resmi dari Meta, langsung** (tanpa vendor/BSP seperti Wati, Qontak, Twilio) | Gratis, nggak ada biaya langganan |
| Library nggak resmi (whatsapp-web.js, Baileys, Fonnte, wablas, dll.) | **Ditolak** | Melanggar ToS WhatsApp, nomor bisa diblokir kapan aja — berisiko buat acara resmi kampus |
| Siapa yang chat duluan | **Penonton** (lewat tombol "Hubungkan WhatsApp") | Balasan bot di dalam jendela 24 jam = gratis. Bot chat duluan (template) = berbayar |
| Otak bot | **Bot menu** dulu (bukan AI) | Gratis total, jawabannya pasti benar. AI bisa ditambah belakangan kalau ada dana |
| Target biaya | **Praktis Rp 0** (cuma kartu perdana buat nomor bot) | Permintaan panitia |

---

## 3. Keputusan yang MASIH DITUNGGU dari panitia

1. **Registrasi penonton pindah ke web kita?** Sekarang tombol "Registrasi
   Penonton" di homepage ngarah ke link form luar (diatur di `/admin`).
   Alur bot butuh pendaftarannya di web kita sendiri (biar nomor HP-nya
   tersimpan & bisa dicocokkan). → **Wajib diputuskan dulu.**
2. **Info Enchantia buat penonton** — isi jawaban bot. Belum ada sama
   sekali di web: lokasi, tanggal & jam (open gate, mulai, selesai), tiket
   (gratis/bayar, kuota), aturan masuk, dresscode, kontak panitia.
3. **Nomor HP khusus bot + akun Meta Business** — siapa yang ngurus?
   Verifikasi bisnis Meta butuh dokumen badan hukum → kemungkinan harus
   lewat **BEM / UMN**.
4. **Pengingat H-1** — pilih salah satu:
   - template WhatsApp (berbayar, ±Rp 300-an per orang), atau
   - email dari web (gratis, pakai kuota gratis layanan email), atau
   - nggak ada; bot cuma bilang "ketik INFO kapan aja buat cek jadwal".
5. **Bot menu atau AI?** Default: menu. AI = lihat bagian 7.

---

## 4. Fakta soal biaya WhatsApp (cek ulang sebelum dipakai — harga Meta bisa berubah)

- Cloud API sendiri: **nggak ada biaya langganan**.
- **Membalas** chat pengguna di dalam **jendela layanan 24 jam** (dihitung
  dari pesan terakhir PENGGUNA): **gratis** (berlaku sejak 1 Nov 2024).
  Setiap kali pengguna chat lagi, jendelanya kebuka lagi 24 jam.
- Pesan interaktif (tombol balasan maks. 3, list maks. 10 baris) di dalam
  jendela 24 jam = pesan biasa → **gratis**. Cocok buat bot menu.
- **Bot chat duluan / di luar jendela 24 jam** → wajib **template** yang
  disetujui Meta, **ditagih per pesan** (sejak 1 Jul 2025). Kisaran
  Indonesia: utility ±US$0,02, marketing ±US$0,04 per pesan. **Cek rate
  card Meta terbaru.**
- Akun belum terverifikasi: pesan yang dimulai bisnis dibatasi (±250
  pengguna / 24 jam). Balasan ke chat dari pengguna nggak kena batas ini.
- Verifikasi Meta Business: gratis, tapi butuh dokumen & bisa makan
  beberapa hari–minggu.
- Meta nyediain **nomor tes gratis** buat development — bisa kirim ke
  maks. 5 nomor penerima yang didaftarkan (pakai nomor panitia).

---

## 5. Rancangan teknis

### Konteks proyek yang udah ada (per 1 Okt 2026)

- Next.js 14.2 App Router + TypeScript + Tailwind, Supabase (auth + DB).
- Tabel `profiles`: `id, full_name, phone, role` — nomor HP udah diisi
  pas daftar akun (`src/app/(site)/login/page.tsx`, `options.data.phone`).
- Tabel `vote_settings` (baris `id = 1`) dipakai juga buat setelan situs:
  `is_open`, `is_finished`, `registrasi_aktif`, `registrasi_url`.
  (SQL kolom `registrasi_*` ada di komentar
  `src/app/api/admin/registrasi/route.ts` — per 1 Okt belum dijalankan.)
- Cek admin di server: `isAdmin()` di `src/lib/admin.ts`.
- Contoh panel saklar admin: `src/components/site/AdminRegistrasi.tsx`
  (+ route `src/app/api/admin/registrasi/route.ts`). Bot bisa dikasih
  saklar `bot_aktif` dengan pola yang sama.

### Bagian baru

1. **Registrasi penonton** (kalau keputusan 3.1 = ya)
   - Tabel `penonton`: `user_id`, `nama`, `phone` (format `628…`),
     `setuju_wa boolean`, `created_at`.
   - Halaman / form di web + tombol "Hubungkan WhatsApp"
     (`https://wa.me/<nomor bot>?text=<encodeURIComponent("Halo Starlight!")>`).
   - Cocokkan pengirim WA ke penonton lewat **nomor HP** (normalisasi
     `08…` → `628…`). Opsional: kode unik di teks pesan biar pasti cocok.
2. **Isi jawaban bot** — `src/lib/infoPenonton.ts`: daftar item menu
   (judul + jawaban). Bisa dipakai ulang buat halaman info penonton di web.
3. **Webhook WhatsApp** — `src/app/api/whatsapp/webhook/route.ts`
   - `GET`: verifikasi Meta (`hub.mode`, `hub.verify_token`,
     `hub.challenge`).
   - `POST`: terima pesan → **cek tanda tangan `X-Hub-Signature-256`**
     pakai App Secret → balas cepat 200 → proses pesan.
   - Balas lewat `POST https://graph.facebook.com/<versi>/<PHONE_NUMBER_ID>/messages`
     dengan `Authorization: Bearer <token>`; pakai pesan interaktif (list /
     tombol) buat menu.
   - Env: `WHATSAPP_TOKEN` (token permanen System User),
     `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`,
     `WHATSAPP_APP_SECRET`.
   - Webhook butuh URL HTTPS publik: pakai deploy produksi, atau tunnel
     (cloudflared / ngrok) waktu develop lokal.
4. **Saklar admin** `bot_aktif` di `/admin` — bot cuma jawab kalau nyala
   (di luar itu balas satu kalimat "Layanan belum dibuka").
5. (Opsional) **Log pesan** — tabel `wa_pesan` buat panitia lihat
   pertanyaan yang sering muncul.

---

## 6. Jadwal kasar (Enchantia 4 Nov 2026)

| Waktu | Panitia | Developer |
|---|---|---|
| 1–8 Okt | Siapin nomor HP khusus, mulai urus Meta Business (lewat BEM/UMN), kumpulin info Enchantia | Registrasi penonton di web + isi menu bot |
| 8–22 Okt | Verifikasi Meta jalan | Sambungin webhook, tes pakai nomor tes Meta ke nomor panitia |
| ±21 Okt | — | Go live: registrasi dibuka, bot aktif |
| 4 Nov | Enchantia | Pantau log |

---

## 7. Kalau nanti mau pakai AI

- Model: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — murah & cepat.
- Isi `infoPenonton.ts` jadi system prompt + prompt caching.
- Perkiraan: ±Rp 25–70 per pertanyaan → 500 penonton × 5 pertanyaan ≈
  Rp 60–170 ribu satu acara. Butuh isi saldo API.
- Batasi: bot cuma jawab dari info yang dikasih; kalau nggak tau, arahkan
  ke kontak panitia.

---

## 8. Alternatif paling sederhana (tanpa koding)

Kalau ternyata nggak sempat / nggak dapat akun Meta: pasang **pesan
sapaan otomatis** di aplikasi **WhatsApp Business** di HP panitia
(gratis). Isinya teks tetap berisi info penting + link web. Nggak
nyambung ke pendaftaran web, nggak ada menu.

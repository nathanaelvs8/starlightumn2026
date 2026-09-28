"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

type Mode = "login" | "register" | "lupa";
type Kolom = "nama" | "hp" | "email" | "password";
type Salah = Partial<Record<Kolom, string>>;

const PASSWORD_MIN = 6; // sama kayak batas bawaan Supabase

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const formRef = useRef<HTMLFormElement>(null);

  const [mode, setMode] = useState<Mode>("login");
  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // tahap: "form" (isi data / email) → "otp" (masukin kode)
  // dipakai register DAN lupa password
  const [tahap, setTahap] = useState<"form" | "otp">("form");

  // Lupa password: kode reset cuma bisa dipakai SEKALI. Kalau kodenya
  // udah lolos tapi password barunya ditolak (misal sama kayak yang
  // lama), jangan cek kode lagi — sesinya udah kebuka, tinggal simpan.
  const kodeLolos = useRef(false);

  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "error" | "ok"; teks: string } | null>(
    null,
  );
  // salah per kolom — muncul di bawah kolomnya masing-masing
  const [salah, setSalah] = useState<Salah>({});

  // spasi nyelip di awal/akhir email (biasanya kebawa pas copy-paste)
  // bikin login gagal padahal emailnya bener
  const emailBersih = email.trim();

  /*
    Semua panggilan ke Supabase lewat sini. Kalau internetnya putus atau
    ada error tak terduga, tombolnya nggak nyangkut di "Tunggu…" selamanya
    dan orangnya tetap dapat pesan yang jelas.
  */
  const jalankan = async (aksi: () => Promise<void>) => {
    if (loading) return;
    setPesan(null);
    setLoading(true);
    try {
      await aksi();
    } catch {
      setPesan({ tipe: "error", teks: terjemahkan(null) });
    } finally {
      setLoading(false);
    }
  };

  // Cek isian SEBELUM dikirim ke server
  const validasi = (): Salah => {
    const s: Salah = {};
    if (mode === "register") {
      if (!nama.trim()) s.nama = "Nama wajib diisi.";
      if (!hp) s.hp = "No HP wajib diisi.";
      else if (!/^08\d{8,12}$/.test(hp)) s.hp = "No HP diawali 08, panjangnya 10–14 angka.";
    }
    if (!emailBersih) s.email = "Email wajib diisi.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBersih))
      s.email = "Format email belum bener, contoh: nama@email.com";
    if (mode !== "lupa") {
      if (!password) s.password = "Password wajib diisi.";
      else if (mode === "register" && password.length < PASSWORD_MIN)
        s.password = `Password minimal ${PASSWORD_MIN} karakter.`;
    }
    return s;
  };

  // Ngetik ulang di kolom yang salah → pesan salahnya langsung hilang
  const ubah = (kolom: Kolom, set: (v: string) => void) => (v: string) => {
    set(v);
    if (salah[kolom]) setSalah((s) => ({ ...s, [kolom]: undefined }));
  };

  // Kirim data register → Supabase kirim OTP ke email
  const daftar = () =>
    jalankan(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: emailBersih,
        password,
        options: { data: { full_name: nama.trim(), phone: hp } },
      });
      if (error) {
        setPesan({ tipe: "error", teks: terjemahkan(error) });
        return;
      }
      // Email yang UDAH terdaftar nggak dikasih error sama Supabase (biar
      // orang nggak bisa ngecek email siapa aja yang terdaftar). Tandanya
      // cuma satu: `identities` kosong. Tanpa cek ini, orangnya dibawa ke
      // layar OTP dan nungguin kode yang nggak akan pernah datang.
      if (data.user?.identities?.length === 0) {
        setPesan({ tipe: "error", teks: "Email ini udah terdaftar. Silakan login." });
        return;
      }
      setTahap("otp");
      setPesan({
        tipe: "ok",
        teks: "Kode verifikasi udah dikirim ke email kamu.",
      });
    });

  // Verifikasi kode OTP → akun aktif → auto login
  const verifikasi = () =>
    jalankan(async () => {
      const { error } = await supabase.auth.verifyOtp({
        email: emailBersih,
        token: otp,
        type: "signup",
      });
      if (error) {
        setPesan({ tipe: "error", teks: terjemahkan(error) });
        return;
      }
      router.push("/");
      router.refresh();
    });

  // Lupa password 1/2: kirim kode reset ke email
  const kirimKodeReset = () =>
    jalankan(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(emailBersih);
      if (error) {
        setPesan({ tipe: "error", teks: terjemahkan(error) });
        return;
      }
      kodeLolos.current = false;
      setOtp("");
      setPassword(""); // kolomnya sekarang buat password BARU
      setSalah({});
      setTahap("otp");
      // Supabase nggak ngasih tau email itu terdaftar atau nggak (biar
      // nggak bisa dipakai ngecek email orang), jadi kalimatnya "kalau".
      setPesan({
        tipe: "ok",
        teks: "Kalau email ini terdaftar, kodenya udah dikirim. Cek juga folder spam.",
      });
    });

  // Lupa password 2/2: cek kode, lalu simpan password baru → langsung login
  const simpanPasswordBaru = () =>
    jalankan(async () => {
      if (!kodeLolos.current) {
        const { error } = await supabase.auth.verifyOtp({
          email: emailBersih,
          token: otp,
          type: "recovery",
        });
        if (error) {
          setPesan({ tipe: "error", teks: terjemahkan(error) });
          return;
        }
        kodeLolos.current = true;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPesan({ tipe: "error", teks: terjemahkan(error) });
        return;
      }
      router.push("/");
      router.refresh();
    });

  // Kirim ulang kode (register atau lupa password)
  const kirimUlang = () =>
    jalankan(async () => {
      const { error } =
        mode === "lupa"
          ? await supabase.auth.resetPasswordForEmail(emailBersih)
          : await supabase.auth.resend({ type: "signup", email: emailBersih });
      if (!error) kodeLolos.current = false;
      setPesan(
        error
          ? { tipe: "error", teks: terjemahkan(error) }
          : { tipe: "ok", teks: "Kode baru udah dikirim." },
      );
    });

  // Login biasa
  const masuk = () =>
    jalankan(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailBersih,
        password,
      });

      // Udah daftar tapi kodenya belum pernah dimasukin. Daripada mentok,
      // kirim kode baru dan langsung bawa ke layar OTP.
      if (error?.code === "email_not_confirmed") {
        const { error: gagalKirim } = await supabase.auth.resend({
          type: "signup",
          email: emailBersih,
        });
        setMode("register");
        setTahap("otp");
        setPesan({
          tipe: "ok",
          teks: gagalKirim
            ? "Email kamu belum diverifikasi. Masukin kode yang dikirim waktu daftar, atau tekan Kirim ulang kode."
            : "Email kamu belum diverifikasi. Kode baru udah dikirim — masukin di sini.",
        });
        return;
      }
      if (error) {
        setPesan({ tipe: "error", teks: terjemahkan(error) });
        return;
      }
      router.push("/");
      router.refresh();
    });

  // Tampilkan pesan salah per kolom. `true` = ada yang salah.
  const tandaiSalah = (s: Salah) => {
    setSalah(s);
    if (Object.keys(s).length === 0) return false;
    setPesan(null);
    // fokus ke kolom salah yang paling atas, biar langsung bisa dibenerin
    requestAnimationFrame(() =>
      formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus(),
    );
    return true;
  };

  const kirimForm = (e: React.FormEvent) => {
    e.preventDefault(); // Enter di kolom mana pun = tekan tombol utama
    if (loading || tandaiSalah(validasi())) return;
    if (mode === "login") masuk();
    else if (mode === "register") daftar();
    else kirimKodeReset();
  };

  const kirimOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || otp.length < 6) return;
    if (mode !== "lupa") {
      verifikasi();
      return;
    }
    const s: Salah = {};
    if (!password) s.password = "Password baru wajib diisi.";
    else if (password.length < PASSWORD_MIN)
      s.password = `Password minimal ${PASSWORD_MIN} karakter.`;
    if (!tandaiSalah(s)) simpanPasswordBaru();
  };

  const gantiMode = (m: Mode) => {
    setMode(m);
    setTahap("form");
    setPesan(null);
    setSalah({});
    setOtp("");
    kodeLolos.current = false;
  };

  const judul = { login: "Login", register: "Register", lupa: "Lupa Password" }[mode];

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandAbout}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-night/60" />

      <Container className="flex min-h-[80svh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-2xl border border-cyan-300/30 bg-white/5 p-8 backdrop-blur sm:p-10">
          <TitleGlow className="text-center text-3xl sm:text-4xl">{judul}</TitleGlow>

          {/* ---- TAHAP OTP (register / lupa password, setelah kode dikirim) ---- */}
          {mode !== "login" && tahap === "otp" ? (
            <form
              ref={formRef}
              onSubmit={kirimOtp}
              noValidate
              className="mt-8 flex flex-col gap-4"
            >
              <p className="text-center font-alice text-sm text-white/70">
                Masukin kode yang dikirim ke <br />
                <span className="text-white">{emailBersih}</span>
              </p>

              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="Kode OTP"
                placeholder="Kode OTP"
                maxLength={8}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-center font-alice text-2xl tracking-[0.3em] text-white placeholder:text-base placeholder:tracking-normal placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
              />

              {mode === "lupa" && (
                <PasswordField
                  label="Password Baru"
                  value={password}
                  onChange={ubah("password", setPassword)}
                  autoComplete="new-password"
                  error={salah.password}
                />
              )}

              <Pesan pesan={pesan} />

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="mt-2 rounded-pill bg-cyan-400 px-6 py-3 font-alice font-bold uppercase tracking-wide text-night transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Tunggu…" : mode === "lupa" ? "Simpan Password" : "Verifikasi"}
              </button>

              <button
                type="button"
                onClick={kirimUlang}
                disabled={loading}
                className="font-alice text-sm text-cyan-300 underline disabled:opacity-50"
              >
                Kirim ulang kode
              </button>
            </form>
          ) : (
            /* ---- TAHAP FORM (login, register, lupa password isi email) ---- */
            <form
              ref={formRef}
              onSubmit={kirimForm}
              noValidate
              className="mt-8 flex flex-col gap-4"
            >
              {mode === "lupa" && (
                <p className="text-center font-alice text-sm text-white/70">
                  Masukin email akun kamu. Kami kirim kode buat bikin password baru.
                </p>
              )}

              {mode === "register" && (
                <>
                  <Field
                    label="Nama Lengkap"
                    value={nama}
                    onChange={ubah("nama", setNama)}
                    type="text"
                    autoComplete="name"
                    error={salah.nama}
                  />
                  <Field
                    label="No HP"
                    value={hp}
                    onChange={ubah("hp", (v) => setHp(v.replace(/[^0-9]/g, "")))}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="08xxxxxxxxxx"
                    error={salah.hp}
                  />
                </>
              )}

              <Field
                label="Email"
                value={email}
                onChange={ubah("email", setEmail)}
                type="email"
                inputMode="email"
                autoComplete="email"
                error={salah.email}
              />
              {mode !== "lupa" && (
                <PasswordField
                  value={password}
                  onChange={ubah("password", setPassword)}
                  // bikin browser nawarin simpan password pas login/daftar,
                  // jadi lain kali nggak perlu inget sendiri
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  error={salah.password}
                />
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => gantiMode("lupa")}
                  className="-mt-2 self-end py-1 font-alice text-sm text-cyan-300 underline"
                >
                  Lupa password?
                </button>
              )}

              <Pesan pesan={pesan} />

              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-pill bg-cyan-400 px-6 py-3 font-alice font-bold uppercase tracking-wide text-night transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading
                  ? "Tunggu…"
                  : { login: "Masuk", register: "Daftar", lupa: "Kirim Kode" }[mode]}
              </button>
            </form>
          )}

          <p className="mt-6 text-center font-alice text-sm text-white/70">
            {
              {
                login: "Belum punya akun? ",
                register: "Udah punya akun? ",
                lupa: "Udah inget password? ",
              }[mode]
            }
            <button
              type="button"
              onClick={() => gantiMode(mode === "login" ? "register" : "login")}
              className="text-cyan-300 underline"
            >
              {mode === "login" ? "Daftar" : "Login"}
            </button>
          </p>
        </div>
      </Container>
    </>
  );
}

/**
 * Pesan error Supabase itu bahasa Inggris dan teknis ("Invalid login
 * credentials"). Yang sering muncul diterjemahin di sini; sisanya
 * ditampilin apa adanya. `null` = gagal nyambung ke server.
 */
function terjemahkan(error: AuthError | null): string {
  if (!error || error.name === "AuthRetryableFetchError" || error.status === 0) {
    return "Nggak bisa nyambung ke server. Cek koneksi internet kamu, lalu coba lagi.";
  }
  switch (error.code) {
    case "invalid_credentials":
      return "Email atau password salah.";
    case "user_already_exists":
    case "email_exists":
      return "Email ini udah terdaftar. Silakan login.";
    case "weak_password":
      return "Password terlalu lemah. Coba yang lebih panjang, campur huruf dan angka.";
    case "otp_expired":
      return "Kodenya salah atau udah kedaluwarsa. Coba kirim ulang kode.";
    case "same_password":
      return "Password baru harus beda dari password lama.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.";
    case "email_address_invalid":
      return "Format email belum bener, contoh: nama@email.com";
    case "signup_disabled":
      return "Pendaftaran lagi ditutup.";
  }
  return error.message;
}

function Pesan({ pesan }: { pesan: { tipe: "error" | "ok"; teks: string } | null }) {
  if (!pesan) return null;
  return (
    <p
      role={pesan.tipe === "error" ? "alert" : "status"}
      className={`text-sm ${pesan.tipe === "error" ? "text-red-300" : "text-cyan-200"}`}
    >
      {pesan.teks}
    </p>
  );
}

const KELAS_INPUT =
  "w-full rounded-lg border bg-white/10 px-4 py-2.5 font-alice text-white placeholder:text-white/40 focus:outline-none";

const kelasBorder = (error?: string) =>
  error ? "border-red-300/70 focus:border-red-300" : "border-white/20 focus:border-cyan-300/60";

function Field({
  label,
  value,
  onChange,
  type,
  inputMode,
  autoComplete,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  inputMode?: "numeric" | "text" | "email" | "tel";
  autoComplete?: string;
  placeholder?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-alice text-sm text-white/80">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-salah` : undefined}
        className={`${KELAS_INPUT} ${kelasBorder(error)}`}
      />
      {error && (
        <p id={`${id}-salah`} className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Kolom password + tombol mata buat nampilin/nyembunyiin isinya.
 * Plus peringatan Caps Lock — penyebab "password salah" paling sering
 * padahal passwordnya bener.
 */
function PasswordField({
  label = "Password",
  value,
  onChange,
  autoComplete,
  error,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  error?: string;
}) {
  const id = useId();
  const [lihat, setLihat] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const cekCaps = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState("CapsLock"));

  const keterangan =
    [error && `${id}-salah`, capsLock && `${id}-caps`].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-alice text-sm text-white/80">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={lihat ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={cekCaps}
          onKeyUp={cekCaps}
          onBlur={() => setCapsLock(false)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={keterangan}
          className={`${KELAS_INPUT} pr-12 ${kelasBorder(error)}`}
        />
        <button
          type="button"
          onClick={() => setLihat((v) => !v)}
          aria-label="Tampilkan password"
          aria-pressed={lihat}
          aria-controls={id}
          title={lihat ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-white/50 transition-colors hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {lihat ? (
              <>
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </>
            ) : (
              <>
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      {capsLock && (
        <p id={`${id}-caps`} className="text-sm text-amber-200">
          Caps Lock lagi nyala.
        </p>
      )}
      {error && (
        <p id={`${id}-salah`} className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

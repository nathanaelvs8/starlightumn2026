"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Container } from "@/components/ui/Container";
import { TitleGlow } from "@/components/ui/TitleGlow";
import { asset } from "@/lib/assets";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // tahap register: "form" (isi data) → "otp" (masukin kode)
  const [tahap, setTahap] = useState<"form" | "otp">("form");

  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "error" | "ok"; teks: string } | null>(
    null,
  );

  // Kirim data register → Supabase kirim OTP ke email
  const daftar = async () => {
    setPesan(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nama, phone: hp } },
    });
    setLoading(false);
    if (error) {
      setPesan({ tipe: "error", teks: error.message });
    } else {
      setTahap("otp");
      setPesan({
        tipe: "ok",
        teks: "Kode verifikasi udah dikirim ke email kamu.",
      });
    }
  };

  // Verifikasi kode OTP → akun aktif → auto login
  const verifikasi = async () => {
    setPesan(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });
    setLoading(false);
    if (error) {
      setPesan({ tipe: "error", teks: error.message });
    } else {
      router.push("/");
      router.refresh();
    }
  };

  // Kirim ulang kode
  const kirimUlang = async () => {
    setPesan(null);
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    setPesan(
      error
        ? { tipe: "error", teks: error.message }
        : { tipe: "ok", teks: "Kode baru udah dikirim." },
    );
  };

  // Login biasa
  const masuk = async () => {
    setPesan(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setPesan({ tipe: "error", teks: error.message });
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const gantiMode = (m: Mode) => {
    setMode(m);
    setTahap("form");
    setPesan(null);
    setOtp("");
  };

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.home.bandAbout}")` }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a1430]/60" />

      <Container className="flex min-h-[80svh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-2xl border border-cyan-300/30 bg-white/5 p-8 backdrop-blur sm:p-10">
          <TitleGlow className="text-center text-3xl sm:text-4xl">
            {mode === "login" ? "Login" : "Register"}
          </TitleGlow>

          {/* ---- TAHAP OTP (khusus register setelah kirim data) ---- */}
          {mode === "register" && tahap === "otp" ? (
            <div className="mt-8 flex flex-col gap-4">
              <p className="text-center font-alice text-sm text-white/70">
                Masukin kode yang dikirim ke <br />
                <span className="text-white">{email}</span>
              </p>

              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder="Kode OTP"
                maxLength={8}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-center font-alice text-2xl tracking-[0.3em] text-white placeholder:text-base placeholder:tracking-normal placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
              />

              {pesan && (
                <p
                  className={`text-sm ${
                    pesan.tipe === "error" ? "text-red-300" : "text-cyan-200"
                  }`}
                >
                  {pesan.teks}
                </p>
              )}

              <button
                type="button"
                onClick={verifikasi}
                disabled={loading || otp.length < 6}
                className="mt-2 rounded-pill bg-cyan-400 px-6 py-3 font-alice font-bold uppercase tracking-wide text-[#0a1430] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Tunggu…" : "Verifikasi"}
              </button>

              <button
                type="button"
                onClick={kirimUlang}
                disabled={loading}
                className="font-alice text-sm text-cyan-300 underline disabled:opacity-50"
              >
                Kirim ulang kode
              </button>
            </div>
          ) : (
            /* ---- TAHAP FORM (login & register isi data) ---- */
            <div className="mt-8 flex flex-col gap-4">
              {mode === "register" && (
                <>
                  <Field label="Nama Lengkap" value={nama} onChange={setNama} type="text" />
                  <Field
                    label="No HP"
                    value={hp}
                    onChange={(v) => setHp(v.replace(/[^0-9]/g, ""))}
                    type="tel"
                    inputMode="numeric"
                    placeholder="08xxxxxxxxxx"
                  />
                </>
              )}

              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field label="Password" value={password} onChange={setPassword} type="password" />

              {pesan && (
                <p
                  className={`text-sm ${
                    pesan.tipe === "error" ? "text-red-300" : "text-cyan-200"
                  }`}
                >
                  {pesan.teks}
                </p>
              )}

              <button
                type="button"
                onClick={mode === "login" ? masuk : daftar}
                disabled={loading}
                className="mt-2 rounded-pill bg-cyan-400 px-6 py-3 font-alice font-bold uppercase tracking-wide text-[#0a1430] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Tunggu…" : mode === "login" ? "Masuk" : "Daftar"}
              </button>
            </div>
          )}

          <p className="mt-6 text-center font-alice text-sm text-white/70">
            {mode === "login" ? "Belum punya akun? " : "Udah punya akun? "}
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

function Field({
  label,
  value,
  onChange,
  type,
  inputMode,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  inputMode?: "numeric" | "text" | "email" | "tel";
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-alice text-sm text-white/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        placeholder={placeholder}
        className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 font-alice text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
      />
    </label>
  );
}
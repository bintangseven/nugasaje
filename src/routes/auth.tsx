import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutList,
  Loader2,
  Users2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — Numu AI" },
      {
        name: "description",
        content:
          "Masuk ke akun Numu AI untuk menyimpan proyek akademik dan mengakses fitur AI penyusun tugas kuliah.",
      },
      { property: "og:title", content: "Masuk — Numu AI" },
      {
        property: "og:description",
        content:
          "Masuk atau daftar akun Numu AI untuk mulai menyusun makalah dan presentasi dengan bantuan AI.",
      },
      { property: "og:url", content: "https://nugasaje.lovable.app/auth" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://nugasaje.lovable.app/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Akun berhasil dibuat. Yuk personalisasi profilmu.");
        navigate({ to: "/onboarding" });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setBusy(false);
    }
  }

  async function signInGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(
          result.error instanceof Error ? result.error.message : "Gagal masuk dengan Google",
        );
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-2">
        {/* Left: brand narrative */}
        <div className="relative hidden flex-col justify-between overflow-hidden p-12 md:flex">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B2A4A] text-white shadow-md">
                <GraduationCap className="h-6 w-6" />
              </span>
              <span
                className="text-[1.35rem] font-bold text-[#1B2A4A]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Numu AI
              </span>
            </div>
            <h1
              className="mt-16 text-4xl font-semibold leading-tight text-[#1B2A4A] lg:text-[2.7rem]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Selamat datang di
              <br />
              Numu AI
            </h1>
            <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-[#55524C]">
              Ruang kerja akademik untuk menyelesaikan tugas kuliahmu.
            </p>
            <ul className="mt-8 space-y-4 text-[#1B2A4A]">
              {[
                { icon: <CheckCircle2 className="h-4 w-4" />, text: "Kelola tugas dengan mudah" },
                { icon: <Users2 className="h-4 w-4" />, text: "Susun makalah & presentasi otomatis" },
                { icon: <LayoutList className="h-4 w-4" />, text: "Pantau progres akademik" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C9A44C]/15 text-[#C9A44C]">
                    {f.icon}
                  </span>
                  <span className="text-sm font-medium">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pointer-events-none relative h-56">
            <svg viewBox="0 0 400 220" className="absolute inset-x-0 bottom-0 w-full opacity-90" aria-hidden>
              <ellipse cx="200" cy="205" rx="150" ry="10" fill="#1B2A4A" opacity="0.08" />
              <rect x="130" y="150" width="180" height="34" rx="3" fill="#1B2A4A" />
              <rect x="140" y="155" width="160" height="4" fill="#C9A44C" opacity="0.75" />
              <rect x="120" y="120" width="200" height="32" rx="3" fill="#C9A44C" />
              <rect x="130" y="125" width="180" height="3" fill="#1B2A4A" opacity="0.4" />
              <rect x="145" y="90" width="160" height="32" rx="3" fill="#E8DFC8" stroke="#1B2A4A" strokeWidth="1.5" />
              <text x="225" y="112" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="14" fill="#1B2A4A" fontStyle="italic">
                tugas
              </text>
              <rect x="60" y="150" width="34" height="34" rx="4" fill="#1B2A4A" opacity="0.85" />
              <path
                d="M77 150 Q70 130 62 140 Q68 138 72 145 M77 150 Q84 128 94 138 Q86 138 82 148"
                stroke="#C9A44C"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-xs text-[#55524C]/70">© {new Date().getFullYear()} Numu AI</span>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center bg-white px-6 py-12 md:px-12 md:py-14 md:shadow-[0_0_60px_-15px_rgba(27,42,74,0.15)]">
          <div className="w-full max-w-sm">
            <div className="mb-6 flex items-center gap-2 md:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B2A4A] text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span
                className="text-lg font-bold text-[#1B2A4A]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Numu AI
              </span>
            </div>

            <div className="mb-6 flex rounded-xl border border-[#1B2A4A]/10 bg-[#FAF6EC] p-1 text-sm font-semibold">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg px-3 py-2 transition-all ${
                    mode === m
                      ? "bg-[#1B2A4A] text-white shadow-sm"
                      : "text-[#55524C] hover:text-[#1B2A4A]"
                  }`}
                >
                  {m === "login" ? "Masuk" : "Daftar"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={signInGoogle}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1B2A4A]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#1B2A4A] transition-all hover:border-[#1B2A4A]/40 hover:shadow-sm disabled:opacity-50"
            >
              <GoogleIcon />
              Lanjutkan dengan Google
            </button>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-[#55524C]/60">
              <span className="h-px flex-1 bg-[#1B2A4A]/10" />
              atau
              <span className="h-px flex-1 bg-[#1B2A4A]/10" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <Field
                  label="Nama lengkap"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Nama kamu"
                />
              )}
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="nama@email.com"
                required
              />
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1B2A4A]/70">
                  Kata sandi
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border-2 border-[#1B2A4A]/15 bg-white px-4 py-2.5 pr-11 text-sm text-[#1B2A4A] placeholder:text-[#55524C]/50 focus:border-[#1B2A4A] focus:outline-none focus:ring-4 focus:ring-[#1B2A4A]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#55524C] hover:text-[#1B2A4A]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Masuk" : "Buat akun & personalisasi"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-[#55524C]">
              {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-semibold text-[#C9A44C] underline-offset-2 hover:underline"
              >
                {mode === "login" ? "Daftar akun" : "Masuk"}
              </button>
            </p>

            <p className="mt-8 text-center text-[11px] text-[#55524C]/70">
              Dengan melanjutkan kamu menyetujui Ketentuan Layanan dan Kebijakan Privasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1B2A4A]/70">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border-2 border-[#1B2A4A]/15 bg-white px-4 py-2.5 text-sm text-[#1B2A4A] placeholder:text-[#55524C]/50 focus:border-[#1B2A4A] focus:outline-none focus:ring-4 focus:ring-[#1B2A4A]/10"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5.4 0 10.3-2.1 13.9-5.4l-6.4-5.3C29.5 34.4 26.9 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 38.9 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.4 5.3C41.6 35.6 43.5 30.2 43.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import numuLogo from "@/assets/numu-logo.svg.asset.json";

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
    <div className="min-h-screen bg-surface-container-lowest">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-2">
        {/* Left: brand narrative */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary p-12 text-on-primary md:flex">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-fixed/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-tertiary/30 blur-3xl" />

          <div className="relative">
            <Link to="/" aria-label="Numu AI" className="flex items-center">
              <img src={numuLogo.url} alt="Numu AI" className="h-10 w-auto" />
            </Link>
            <span className="eyebrow mt-14 block text-primary-fixed">Ruang kerja akademik</span>
            <h1 className="mt-3 font-display text-4xl font-black leading-tight lg:text-[2.75rem]">
              Selesaikan tugas kuliah
              <br />
              dengan Numu AI.
            </h1>
            <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-primary-fixed/90">
              Susun makalah dan presentasi otomatis, kelola proyek, dan pantau progres akademikmu — semua di satu tempat.
            </p>
            <ul className="mt-10 space-y-4">
              {[
                { icon: "task_alt", text: "Kelola tugas dengan mudah" },
                { icon: "auto_stories", text: "Susun makalah & presentasi otomatis" },
                { icon: "insights", text: "Pantau progres akademik" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-on-primary/15 text-tertiary backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {f.icon}
                    </span>
                  </span>
                  <span className="text-sm font-medium">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <span className="relative text-xs text-primary-fixed/70">
            © {new Date().getFullYear()} Numu AI — Intelligent Academic Ledger
          </span>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center bg-surface-container-lowest px-6 py-12 md:px-12 md:py-14">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center md:hidden">
              <img src={numuLogo.url} alt="Numu AI" className="h-8 w-auto" />
            </div>

            <h2 className="font-display text-2xl font-bold text-on-surface">
              {mode === "login" ? "Masuk ke akun" : "Buat akun baru"}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {mode === "login"
                ? "Lanjutkan menyelesaikan tugas kuliahmu."
                : "Mulai gratis, personalisasi profilmu setelahnya."}
            </p>

            <div className="mt-6 flex rounded-2xl border border-outline-variant bg-surface-container-low p-1 text-sm font-semibold">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-xl px-3 py-2 transition-all ${
                    mode === m
                      ? "bg-primary text-on-primary shadow-glow"
                      : "text-on-surface-variant hover:text-on-surface"
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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface transition-all hover:border-primary hover:bg-primary-fixed disabled:opacity-50"
            >
              <GoogleIcon />
              Lanjutkan dengan Google
            </button>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-on-surface-variant">
              <span className="h-px flex-1 bg-outline-variant" />
              atau
              <span className="h-px flex-1 bg-outline-variant" />
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
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Kata sandi
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 pr-11 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-on-surface-variant hover:text-on-surface"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-glow transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Masuk" : "Buat akun & personalisasi"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-on-surface-variant">
              {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {mode === "login" ? "Daftar akun" : "Masuk"}
              </button>
            </p>

            <p className="mt-8 text-center text-[11px] text-on-surface-variant">
              Dengan melanjutkan kamu menyetujui{" "}
              <Link to="/terms" className="underline hover:text-primary">
                Ketentuan Layanan
              </Link>{" "}
              dan{" "}
              <Link to="/privacy" className="underline hover:text-primary">
                Kebijakan Privasi
              </Link>
              .
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
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
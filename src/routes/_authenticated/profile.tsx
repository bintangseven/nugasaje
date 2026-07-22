import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Loader2, Sparkles, Crown, Receipt, ExternalLink, Upload, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  getProfile,
  updateProfile,
  BASIC_DAILY_LIMIT,
  PRO_DAILY_LIMIT,
  PRO_PRICE_IDR,
} from "@/lib/projects.functions";
import { dummyAvatars } from "@/lib/avatars";
import { createProUpgradeInvoice, listMyPayments } from "@/lib/payments.functions";
import { useCurrentUser } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil — Numu AI" },
      {
        name: "description",
        content:
          "Kelola informasi profil, status langganan PRO, dan riwayat penggunaan kuota harian di Numu AI.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Profil — Numu AI" },
      {
        property: "og:description",
        content: "Halaman profil akun Numu AI: langganan, kuota harian, dan riwayat pembayaran.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const getFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);
  const upgradeFn = useServerFn(createProUpgradeInvoice);
  const paymentsFn = useServerFn(listMyPayments);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getFn(),
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentsFn(),
  });

  const [form, setForm] = useState({ name: "", university: "", major: "", semester: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        university: profile.university ?? "",
        major: profile.major ?? "",
        semester: profile.semester ?? "",
      });
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => updateFn({ data: { ...form, avatar_url: avatarUrl } }),
    onSuccess: () => {
      toast.success("Profil disimpan");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Gagal menyimpan"),
  });

  async function handleFile(file: File) {
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran maksimum 3MB");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
          img.onload = () => {
            const size = 256;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d")!;
            const min = Math.min(img.width, img.height);
            const sx = (img.width - min) / 2;
            const sy = (img.height - min) / 2;
            ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
            resolve(canvas.toDataURL("image/jpeg", 0.82));
          };
          img.onerror = reject;
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setAvatarUrl(dataUrl);
      toast.success("Foto siap disimpan. Klik 'Simpan perubahan'.");
    } catch {
      toast.error("Gagal memproses foto");
    } finally {
      setUploading(false);
    }
  }

  const upgrade = useMutation({
    mutationFn: () => upgradeFn(),
    onSuccess: (res) => {
      if (res?.invoice_url) {
        window.location.href = res.invoice_url;
      } else {
        toast.error("Invoice tidak tersedia");
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Gagal upgrade"),
  });

  const isProActive =
    profile?.plan === "pro" &&
    (!profile.pro_until || new Date(profile.pro_until).getTime() > Date.now());
  const dailyLimit = isProActive ? PRO_DAILY_LIMIT : BASIC_DAILY_LIMIT;
  const today = new Date().toISOString().slice(0, 10);
  const usedToday =
    profile?.generations_date === today ? profile?.generations_used ?? 0 : 0;
  const remaining = Math.max(0, dailyLimit - usedToday);
  const usedPct = Math.min(100, Math.round((usedToday / dailyLimit) * 100));
  const priceLabel = `Rp${PRO_PRICE_IDR.toLocaleString("id-ID")}/bulan`;

  const displayName = form.name || profile?.name || user?.email?.split("@")[0] || "Mahasiswa";
  const initials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 pb-24 pt-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Profil</h1>

        {/* Langganan */}
        <div
          className={`mt-8 overflow-hidden rounded-2xl border-2 p-6 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.15)] ${
            isProActive
              ? "border-amber-400/70 bg-gradient-to-br from-amber-50 to-orange-50"
              : "border-foreground/15 bg-card"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {isProActive ? (
                  <Crown className="h-4 w-4 text-amber-600" />
                ) : (
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                )}
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isProActive ? "Paket PRO" : "Paket Basic"}
              </span>
              </div>
            <p className="mt-2 text-lg font-semibold text-foreground">
              Kuota hari ini: {usedToday} / {dailyLimit} generate
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isProActive
                ? `Paket PRO aktif sampai ${profile?.pro_until ? new Date(profile.pro_until).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}. Kuota reset otomatis tiap hari.`
                : `Paket Basic dibatasi ${BASIC_DAILY_LIMIT} generate per hari. Upgrade ke PRO untuk ${PRO_DAILY_LIMIT} generate/hari — promo dari Rp100.000 jadi ${priceLabel}.`}
            </p>
            </div>
            {!isProActive && (
              <button
                type="button"
                onClick={() => upgrade.mutate()}
                disabled={upgrade.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {upgrade.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="h-4 w-4" />
                )}
              Upgrade PRO • {priceLabel}
              </button>
            )}
          </div>
          {/* Visual progress bar */}
          <div className="mt-5">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className={`h-full rounded-full transition-all ${
                  remaining === 0
                    ? "bg-rose-500"
                    : isProActive
                      ? "bg-amber-500"
                      : "bg-foreground"
                }`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>Terpakai {usedToday}</span>
              <span>Sisa {remaining} · reset besok</span>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary text-lg font-semibold text-foreground">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">
                {profile?.email ?? user?.email ?? "—"}
              </p>
            </div>
          </div>

          {/* Avatar picker */}
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Foto profil
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pilih avatar bawaan atau unggah foto pribadimu.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {dummyAvatars.map((a) => {
                const active = avatarUrl === a.url;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAvatarUrl(a.url)}
                    aria-label={a.label}
                    className={`relative h-14 w-14 overflow-hidden rounded-full transition-all ${
                      active
                        ? "scale-110 ring-[3px] ring-foreground ring-offset-2 ring-offset-card"
                        : "ring-1 ring-border hover:ring-foreground/40"
                    }`}
                  >
                    <img src={a.url} alt={a.label} className="h-full w-full object-cover" />
                    {active && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-md ring-2 ring-card">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-dashed border-foreground/30 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                aria-label="Unggah foto"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="text-[9px] font-medium">Unggah</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-border pt-6">
            <Field
              label="Nama tampilan"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <Field
              label="Universitas"
              value={form.university}
              onChange={(v) => setForm((f) => ({ ...f, university: v }))}
            />
            <Field
              label="Jurusan"
              value={form.major}
              onChange={(v) => setForm((f) => ({ ...f, major: v }))}
            />
            <Field
              label="Semester"
              value={form.semester}
              onChange={(v) => setForm((f) => ({ ...f, semester: v }))}
              placeholder="Contoh: 5"
            />
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan perubahan
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>

        {/* Riwayat pembayaran */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Riwayat pembayaran
            </h2>
          </div>

          <div className="mt-4">
            {paymentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat…
              </div>
            ) : !payments || payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada transaksi. Upgrade PRO untuk mulai berlangganan.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {payments.map((p) => {
                  const status = String(p.status).toUpperCase();
                  const badge =
                    status === "PAID" || status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700";
                  const when = p.paid_at ?? p.created_at;
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {p.purpose === "pro_upgrade" ? "Upgrade PRO" : p.purpose}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {when
                            ? new Date(when).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}{" "}
                          • {p.external_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">
                          {p.currency === "IDR" ? "Rp" : `${p.currency} `}
                          {p.amount.toLocaleString("id-ID")}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}
                        >
                          {status}
                        </span>
                        {status === "PENDING" && p.invoice_url && (
                          <a
                            href={p.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            Bayar <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground/70">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border-2 border-foreground/15 bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none focus:ring-4 focus:ring-foreground/10"
      />
    </label>
  );
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Loader2, Sparkles, Crown, Receipt, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
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
import { createProUpgradeInvoice, listMyPayments } from "@/lib/payments.functions";
import { useCurrentUser } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil — Nugasinaje" },
      {
        name: "description",
        content:
          "Kelola informasi profil, status langganan PRO, dan riwayat penggunaan kuota harian di Nugasinaje.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Profil — Nugasinaje" },
      {
        property: "og:description",
        content: "Halaman profil akun Nugasinaje: langganan, kuota harian, dan riwayat pembayaran.",
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
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        university: profile.university ?? "",
        major: profile.major ?? "",
        semester: profile.semester ?? "",
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => updateFn({ data: form }),
    onSuccess: () => {
      toast.success("Profil disimpan");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Gagal menyimpan"),
  });

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
          className={`mt-8 overflow-hidden rounded-2xl border p-6 ${
            isProActive
              ? "border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50"
              : "border-border bg-card"
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
              Sisa kuota hari ini: {remaining} dari {dailyLimit} generate
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
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-foreground">
              {initials}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">
                {profile?.email ?? user?.email ?? "—"}
              </p>
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
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/10"
      />
    </label>
  );
}
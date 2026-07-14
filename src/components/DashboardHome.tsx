import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Presentation, Plus, ArrowRight, Crown, Sparkles, Zap } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ProjectCard } from "@/components/ProjectCard";
import {
  BASIC_DAILY_LIMIT,
  PRO_DAILY_LIMIT,
  createProject,
  getProfile,
  listProjects,
} from "@/lib/projects.functions";
import { MAX_PROJECTS, dummyAvatars } from "@/lib/avatars";
import { defaultProjectName, type MissionType, type ProjectRow } from "@/lib/mock-data";

export function DashboardHome({ user }: { user: User }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listProjects);
  const profileFn = useServerFn(getProfile);
  const createFn = useServerFn(createProject);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => listFn(),
  });
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileFn(),
  });

  const projects = (projectsQuery.data ?? []) as ProjectRow[];
  const projectCount = projects.length;
  const atCap = projectCount >= MAX_PROJECTS;
  const recent = projects.slice(0, 6);
  const activeCount = projects.filter((p) => p.progress < 100).length;
  const doneCount = projects.filter((p) => p.progress >= 100).length;

  const profile = profileQuery.data;

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("onboarding_skipped") === "1") {
      return;
    }
    if (profile && profile.onboarded === false) {
      navigate({ to: "/onboarding" });
    }
  }, [profile, navigate]);

  const isProActive =
    profile?.plan === "pro" &&
    (!profile.pro_until || new Date(profile.pro_until).getTime() > Date.now());
  const dailyLimit = isProActive ? PRO_DAILY_LIMIT : BASIC_DAILY_LIMIT;
  const today = new Date().toISOString().slice(0, 10);
  const usedToday =
    profile?.generations_date === today ? profile?.generations_used ?? 0 : 0;
  const remaining = Math.max(0, dailyLimit - usedToday);
  const dailyPct = Math.min(100, Math.round((usedToday / dailyLimit) * 100));
  const projectPct = Math.min(100, Math.round((projectCount / MAX_PROJECTS) * 100));

  const displayName =
    profile?.name ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Mahasiswa";

  const avatarUrl =
    profile?.avatar_url ||
    dummyAvatars.find((a) => a.id === "cool")?.url ||
    "";

  const create = useMutation({
    mutationFn: (mission: MissionType) =>
      createFn({ data: { mission, name: defaultProjectName(mission) } }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      if (row?.id) navigate({ to: "/mission/$id", params: { id: row.id } });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Gagal membuat proyek"),
  });

  function handleStart(mission: MissionType) {
    if (atCap) {
      toast.error(
        `Batas ${MAX_PROJECTS} proyek tercapai. Hapus proyek lama dulu.`,
      );
      return;
    }
    create.mutate(mission);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        {/* Greeting */}
        <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-border bg-secondary transition-transform hover:scale-105"
              aria-label="Buka profil"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-foreground">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </Link>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Halo lagi
              </span>
              <h1 className="mt-1 font-display text-2xl font-semibold text-foreground md:text-3xl">
                {displayName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isProActive ? "Paket PRO aktif" : "Paket Basic"} · {profile?.email ?? user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={create.isPending || atCap}
              onClick={() => handleStart("paper")}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              Paper baru
            </button>
            <button
              type="button"
              disabled={create.isPending || atCap}
              onClick={() => handleStart("presentation")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <Presentation className="h-4 w-4" />
              PPT baru
            </button>
          </div>
        </section>

        {/* Stat cards */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<Zap className="h-4 w-4" />}
            label="Kuota hari ini"
            value={`${usedToday} / ${dailyLimit}`}
            sub={
              remaining > 0
                ? `Sisa ${remaining} generate. Reset otomatis besok.`
                : "Kuota habis. Upgrade PRO untuk 10 generate/hari."
            }
            progress={dailyPct}
            tone={remaining === 0 ? "warn" : "default"}
          />
          <StatCard
            icon={<FileText className="h-4 w-4" />}
            label="Proyek tersimpan"
            value={`${projectCount} / ${MAX_PROJECTS}`}
            sub={
              atCap
                ? "Batas maksimum tercapai. Hapus proyek lama untuk membuat yang baru."
                : `${activeCount} berjalan · ${doneCount} selesai`
            }
            progress={projectPct}
            tone={atCap ? "warn" : "default"}
          />
          <div
            className={`rounded-2xl border p-5 ${
              isProActive
                ? "border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isProActive ? <Crown className="h-4 w-4 text-amber-600" /> : <Sparkles className="h-4 w-4" />}
              {isProActive ? "Paket PRO" : "Paket Basic"}
            </div>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {isProActive ? "Terima kasih!" : "Upgrade ke PRO"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isProActive
                ? `Aktif sampai ${profile?.pro_until ? new Date(profile.pro_until).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}.`
                : "10 generate/hari, prioritas antrian, template premium. Rp50rb/bulan."}
            </p>
            <Link
              to="/profile"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
            >
              {isProActive ? "Kelola profil" : "Upgrade sekarang"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Recent projects */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Proyek kamu
              </span>
              <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
                Lanjutkan yang tertunda
              </h2>
            </div>
            <Link
              to="/projects"
              className="text-sm font-medium text-foreground hover:underline"
            >
              Lihat semua →
            </Link>
          </div>

          {projectsQuery.isLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada proyek. Mulai dari tombol{" "}
                <span className="font-medium text-foreground">Paper baru</span> atau{" "}
                <span className="font-medium text-foreground">PPT baru</span> di atas.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recent.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
              {!atCap && (
                <button
                  type="button"
                  onClick={() => handleStart("paper")}
                  className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-5 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-sm font-medium">Tambah proyek</span>
                  <span className="text-xs">{MAX_PROJECTS - projectCount} slot tersisa</span>
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  progress,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  progress: number;
  tone?: "default" | "warn";
}) {
  const barColor = tone === "warn" ? "bg-rose-500" : "bg-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
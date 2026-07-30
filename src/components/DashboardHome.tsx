import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  FileText,
  Presentation,
  Plus,
  ArrowRight,
  Crown,
  Sparkles,
  Zap,
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  CheckCircle2,
  Clock,
  Pin,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Footer } from "@/components/Footer";
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
import { defaultProjectName, formatRelativeTime, type MissionType, type ProjectRow } from "@/lib/mock-data";

type MissionFilter = "all" | "paper" | "presentation";
type StatusFilter = "all" | "active" | "done";
type SortKey = "recent" | "progress" | "name";
type ViewMode = "grid" | "list";

const PIN_STORAGE_KEY = "numu:pinned-projects";

function readPinned(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

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
  const activeCount = projects.filter((p) => p.progress < 100).length;
  const doneCount = projects.filter((p) => p.progress >= 100).length;

  const profile = profileQuery.data;

  // ── UI state ──────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [mission, setMission] = useState<MissionFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [pinned, setPinned] = useState<string[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  function slide(dir: 1 | -1) {
    const el = sliderRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  useEffect(() => {
    setPinned(readPinned());
  }, []);

  function togglePin(id: string) {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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

  // ── Insights ──────────────────────────────────────────
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const createdThisWeek = projects.filter((p) => new Date(p.created_at).getTime() >= weekAgo).length;
  const updatedThisWeek = projects.filter((p) => new Date(p.updated_at).getTime() >= weekAgo).length;
  const avgProgress =
    projects.length === 0
      ? 0
      : Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length);
  const nearestActive = projects
    .filter((p) => p.progress > 0 && p.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0];

  // ── Filter + sort ─────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filteredList = projects.filter((p) => {
      if (mission !== "all" && p.mission !== mission) return false;
      if (status === "active" && p.progress >= 100) return false;
      if (status === "done" && p.progress < 100) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...filteredList].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "progress") return b.progress - a.progress;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    // Pinned always float to top (within current filter)
    return sorted.sort((a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)));
  }, [projects, search, mission, status, sortBy, pinned]);

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
        {/* Hero greeting with gradient */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/profile"
                className={`relative block h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/10 transition-transform hover:scale-105 ${
                  isProActive
                    ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900 shadow-[0_0_18px_rgba(251,191,36,0.55)] border-2 border-amber-300"
                    : "border-2 border-white/40"
                }`}
              aria-label="Buka profil"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </Link>
              <div className="min-w-0">
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-white/60">
                  Selamat Datang Kembali,
                </span>
                <h1 className="mt-1 truncate font-display text-2xl font-semibold md:text-3xl">
                  {displayName}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${isProActive ? "bg-amber-400/90 text-slate-900" : "bg-white/15 text-white"}`}>
                    {isProActive ? <Crown className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    {isProActive ? "PRO" : "Basic"}
                  </span>
                  <span className="truncate">{profile?.email ?? user.email}</span>
                </div>
              </div>
          </div>

            <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={create.isPending || atCap}
              onClick={() => handleStart("paper")}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              Paper baru
            </button>
            <button
              type="button"
              disabled={create.isPending || atCap}
              onClick={() => handleStart("presentation")}
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              <Presentation className="h-4 w-4" />
              PPT baru
            </button>
              {!isProActive && (
                <Link
                  to="/harga"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition-transform hover:scale-[1.02]"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Pro
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Stat cards */}
        <section className="mt-6 grid gap-4 md:grid-cols-4">
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
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Rata-rata progres"
            value={`${avgProgress}%`}
            sub={
              nearestActive
                ? `Paling dekat selesai: “${nearestActive.name}” (${nearestActive.progress}%)`
                : projectCount === 0
                  ? "Mulai proyek pertama untuk melihat progres."
                  : "Semua proyek belum dimulai."
            }
            progress={avgProgress}
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
                : "10 generate/hari, prioritas antrian. Rp50rb/bulan."}
            </p>
            <Link
              to={isProActive ? "/profile" : "/harga"}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
            >
              {isProActive ? "Kelola profil" : "Upgrade sekarang"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Activity insight strip */}
        <section className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
          <InsightPill
            icon={<Sparkles className="h-4 w-4 text-indigo-500" />}
            label="Dibuat 7 hari terakhir"
            value={createdThisWeek}
          />
          <InsightPill
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            label="Diperbarui 7 hari terakhir"
            value={updatedThisWeek}
          />
          <InsightPill
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            label="Selesai total"
            value={doneCount}
          />
        </section>

        {/* Projects toolbar */}
        <section className="mt-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
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

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama proyek…"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                value={mission}
                onChange={(v) => setMission(v as MissionFilter)}
                options={[
                  { id: "all", label: "Semua" },
                  { id: "paper", label: "Paper" },
                  { id: "presentation", label: "PPT" },
                ]}
              />
              <Segmented
                value={status}
                onChange={(v) => setStatus(v as StatusFilter)}
                options={[
                  { id: "all", label: "Status" },
                  { id: "active", label: "Aktif" },
                  { id: "done", label: "Selesai" },
                ]}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground/40"
              >
                <option value="recent">Terbaru</option>
                <option value="progress">Progres</option>
                <option value="name">Nama A-Z</option>
              </select>
              <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-label="Grid"
                  className={`rounded-md p-1.5 ${view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="List"
                  className={`rounded-md p-1.5 ${view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
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
          ) : projects.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada proyek. Mulai dari tombol{" "}
                <span className="font-medium text-foreground">Paper baru</span> atau{" "}
                <span className="font-medium text-foreground">PPT baru</span> di atas.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">Tidak ada proyek yang cocok dengan filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setMission("all");
                  setStatus("all");
                }}
                className="mt-3 text-sm font-medium text-foreground hover:underline"
              >
                Reset filter
              </button>
            </div>
          ) : view === "list" ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
              <ul className="divide-y divide-border">
                {filtered.slice(0, 6).map((p) => (
                  <ProjectRowItem
                    key={p.id}
                    project={p}
                    pinned={pinned.includes(p.id)}
                    onTogglePin={togglePin}
                  />
                ))}
              </ul>
              {filtered.length > 6 && (
                <Link
                  to="/projects"
                  className="flex items-center justify-center gap-1 border-t border-border bg-secondary/30 py-2.5 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  Lihat {filtered.length - 6} proyek lainnya <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <div className="relative mt-5">
              <div
                ref={sliderRef}
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin]"
              >
                {filtered.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="w-[85%] shrink-0 snap-start sm:w-[48%] lg:w-[32%]"
                  >
                    <ProjectCard
                      project={p}
                      pinned={pinned.includes(p.id)}
                      onTogglePin={togglePin}
                    />
                  </div>
                ))}
                {filtered.length > 6 ? (
                  <Link
                    to="/projects"
                    className="flex w-[85%] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-5 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/40 hover:text-foreground sm:w-[48%] lg:w-[32%]"
                  >
                    <ChevronRight className="h-6 w-6" />
                    <span className="text-sm font-medium">
                      Lihat {filtered.length - 6} lainnya
                    </span>
                    <span className="text-xs">Buka semua proyek</span>
                  </Link>
                ) : (
                  !atCap && (
                    <button
                      type="button"
                      onClick={() => handleStart("paper")}
                      className="flex w-[85%] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-5 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/40 hover:text-foreground sm:w-[48%] lg:w-[32%]"
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-sm font-medium">Tambah proyek</span>
                      <span className="text-xs">{MAX_PROJECTS - projectCount} slot tersisa</span>
                    </button>
                  )
                )}
              </div>
              {filtered.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => slide(-1)}
                    aria-label="Sebelumnya"
                    className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-border bg-background/95 p-2 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-secondary md:inline-flex"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => slide(1)}
                    aria-label="Selanjutnya"
                    className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-border bg-background/95 p-2 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-secondary md:inline-flex"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
            value === o.id ? "bg-secondary text-on-secondary shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function InsightPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ProjectRowItem({
  project,
  pinned,
  onTogglePin,
}: {
  project: ProjectRow;
  pinned: boolean;
  onTogglePin: (id: string) => void;
}) {
  const completed = project.progress >= 100;
  const Icon = project.mission === "paper" ? FileText : Presentation;
  return (
    <li className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/40">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-on-secondary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            to="/mission/$id"
            params={{ id: project.id }}
            className="truncate text-sm font-semibold text-foreground hover:underline"
          >
            {project.name}
          </Link>
          {pinned && <Pin className="h-3 w-3 text-amber-500" />}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {project.mission === "paper" ? "Paper" : "Presentasi"} · {formatRelativeTime(project.updated_at)}
        </p>
      </div>
      <div className="hidden w-40 items-center gap-2 sm:flex">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full ${completed ? "bg-emerald-500" : "bg-primary"}`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="w-9 text-right text-xs font-medium">{project.progress}%</span>
      </div>
      <button
        type="button"
        onClick={() => onTogglePin(project.id)}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
        aria-label={pinned ? "Lepas pin" : "Sematkan"}
      >
        <Pin className={`h-3.5 w-3.5 ${pinned ? "fill-amber-400 text-amber-500" : ""}`} />
      </button>
      <Link
        to="/mission/$id"
        params={{ id: project.id }}
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
      >
        Buka <ArrowRight className="h-3 w-3" />
      </Link>
    </li>
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
  const barColor = tone === "warn" ? "bg-rose-500" : "bg-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
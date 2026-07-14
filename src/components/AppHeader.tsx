import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User as UserIcon, LayoutDashboard, FolderKanban } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getProfile } from "@/lib/projects.functions";

export function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const profileFn = useServerFn(getProfile);
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileFn(),
    enabled: !!user,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const displayName =
    profile?.name ??
    (user?.user_metadata?.name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "S";

  const initials = displayName
        .split(" ")
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

  const avatarUrl = profile?.avatar_url ?? null;

  async function handleSignOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-foreground font-display text-[1.25rem] font-bold tracking-tight">
          Nugasin<span style={{ color: "var(--stamp)" }}>aje</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex text-[0.92rem] font-semibold" style={{ color: "var(--ink-soft)" }}>
          {user ? (
            <>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className="relative transition-colors hover:text-foreground data-[status=active]:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                to="/projects"
                className="transition-colors hover:text-foreground data-[status=active]:text-foreground"
              >
                Proyek
              </Link>
              <Link
                to="/harga"
                className="transition-colors hover:text-foreground data-[status=active]:text-foreground"
              >
                Harga
              </Link>
              <Link
                to="/faq"
                className="transition-colors hover:text-foreground data-[status=active]:text-foreground"
              >
                FAQ
              </Link>
              <Link
                to="/profile"
                className="transition-colors hover:text-foreground data-[status=active]:text-foreground"
              >
                Profil
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className="relative transition-colors hover:text-foreground data-[status=active]:text-foreground"
              >
                Beranda
              </Link>
              <Link to="/harga" className="transition-colors hover:text-foreground">
                Harga
              </Link>
              <Link to="/faq" className="transition-colors hover:text-foreground">
                FAQ
              </Link>
            </>
          )}
        </nav>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="group flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 transition-all hover:border-foreground/30 hover:shadow-sm"
              aria-label="Menu profil"
              aria-expanded={menuOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-foreground text-xs font-bold text-background">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]">
                <div className="flex items-center gap-3 border-b border-border bg-secondary/40 px-4 py-3">
                  <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-foreground text-sm font-bold text-background">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <dl className="grid gap-2 px-4 py-3 text-xs">
                  <MenuRow label="Universitas" value={profile?.university} />
                  <MenuRow label="Jurusan" value={profile?.major} />
                  <MenuRow label="Semester" value={profile?.semester} />
                </dl>
                <div className="border-t border-border p-1.5">
                  <MenuLink
                    to="/"
                    icon={<LayoutDashboard className="h-3.5 w-3.5" />}
                    label="Dashboard"
                    onSelect={() => setMenuOpen(false)}
                  />
                  <MenuLink
                    to="/projects"
                    icon={<FolderKanban className="h-3.5 w-3.5" />}
                    label="Proyek saya"
                    onSelect={() => setMenuOpen(false)}
                  />
                  <MenuLink
                    to="/profile"
                    icon={<UserIcon className="h-3.5 w-3.5" />}
                    label="Edit profil"
                    onSelect={() => setMenuOpen(false)}
                  />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/auth"
            className="rounded-md bg-foreground px-5 py-2.5 text-[0.88rem] font-bold text-background transition-all hover:-translate-y-0.5"
            style={{ transition: "background .18s ease, transform .18s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--stamp)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
          >
            Coba gratis
          </Link>
        )}
      </div>
      <div
        aria-hidden
        className="h-[2px] w-full"
        style={{ background: "transparent" }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, var(--stamp), var(--highlighter))",
            transition: "width 120ms linear",
          }}
        />
      </div>
    </header>
  );
}

function MenuRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate text-right text-xs font-medium text-foreground">
        {value?.trim() ? value : <span className="text-muted-foreground/60">Belum diisi</span>}
      </dd>
    </div>
  );
}

function MenuLink({
  to,
  icon,
  label,
  onSelect,
}: {
  to: "/" | "/projects" | "/profile";
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onSelect}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
    >
      {icon}
      {label}
    </Link>
  );
}
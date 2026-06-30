import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const displayName =
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

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-foreground font-display text-[1.25rem] font-bold tracking-tight">
          Nugasin<span style={{ color: "var(--stamp)" }}>aje</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex text-[0.92rem] font-semibold" style={{ color: "var(--ink-soft)" }}>
          {[
            { to: "/", label: "Beranda" },
            { to: "/projects", label: "Proyek" },
            { to: "/profile", label: "Profil" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="transition-colors hover:text-foreground data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <button
            type="button"
            onClick={() => navigate({ to: "/profile" })}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background transition-transform hover:scale-105"
            aria-label="Profil"
          >
            {initials}
          </button>
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
    </header>
  );
}
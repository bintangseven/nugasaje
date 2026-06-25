import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { getMockUser, type MockUser } from "@/lib/auth-mock";

export function AppHeader() {
  const [user, setUser] = useState<MockUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getMockUser());
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "S";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Student OS</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { to: "/", label: "Beranda" },
            { to: "/projects", label: "Proyek" },
            { to: "/profile", label: "Profil" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          aria-label="Profil"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
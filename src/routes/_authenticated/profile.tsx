import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { clearMockUser, getMockUser, type MockUser } from "@/lib/auth-mock";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil — Student OS" },
      { name: "description", content: "Profil akun Student OS." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    setUser(getMockUser());
  }, []);

  const display = user ?? { name: "Mahasiswa", email: "demo@studentos.id" };
  const initials = display.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSignOut() {
    clearMockUser();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-6 pb-24 pt-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Profil</h1>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-foreground">
              {initials}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">{display.name}</p>
              <p className="text-sm text-muted-foreground">{display.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-border pt-6 text-sm">
            <Row label="Universitas" value="Belum diatur" />
            <Row label="Jurusan" value="Belum diatur" />
            <Row label="Semester" value="Belum diatur" />
            <Row label="Bahasa default" value="Bahasa Indonesia" />
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
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
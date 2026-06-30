import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/payment/failed")({
  head: () => ({ meta: [{ title: "Pembayaran gagal — Nugasinaje" }] }),
  component: FailedPage,
});

function FailedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <XCircle className="h-14 w-14 text-red-500" />
      <h1 className="mt-4 text-2xl font-semibold">Pembayaran gagal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pembayaran tidak berhasil atau dibatalkan. Kamu bisa coba lagi dari halaman
        Profil.
      </p>
      <Link
        to="/profile"
        className="mt-6 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Coba lagi
      </Link>
    </main>
  );
}
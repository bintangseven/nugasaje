import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/payment/success")({
  head: () => ({
    meta: [
      { title: "Pembayaran berhasil — Nugasinaje" },
      {
        name: "description",
        content:
          "Pembayaran langganan PRO Nugasinaje berhasil diproses. Akunmu sedang diaktifkan ke paket PRO.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Pembayaran berhasil — Nugasinaje" },
      {
        property: "og:description",
        content: "Konfirmasi pembayaran langganan PRO Nugasinaje berhasil.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <CheckCircle2 className="h-14 w-14 text-emerald-500" />
      <h1 className="mt-4 text-2xl font-semibold">Pembayaran berhasil</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Akun kamu sedang diaktifkan ke PRO. Status akan update otomatis dalam beberapa
        detik setelah Xendit mengirim notifikasi.
      </p>
      <Link
        to="/profile"
        className="mt-6 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Kembali ke Profil
      </Link>
    </main>
  );
}
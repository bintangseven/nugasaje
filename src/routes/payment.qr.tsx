import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { z } from "zod";
import {
  createProUpgradePakasirQris,
  getPaymentStatus,
} from "@/lib/pakasir.functions";

const searchSchema = z.object({ order_id: z.string().optional() });

export const Route = createFileRoute("/payment/qr")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Pembayaran QRIS — Nugasinaje" }] }),
  component: QrPage,
});

function QrPage() {
  const navigate = useNavigate();
  const { order_id: initialOrderId } = Route.useSearch();
  const createFn = useServerFn(createProUpgradePakasirQris);
  const statusFn = useServerFn(getPaymentStatus);

  const [orderId, setOrderId] = useState<string | null>(initialOrderId ?? null);
  const [qr, setQr] = useState<{
    payment_number: string | null;
    qr_url: string | null;
    amount: number;
  } | null>(null);

  const create = useMutation({
    mutationFn: () => createFn(),
    onSuccess: (res) => {
      setOrderId(res.order_id);
      setQr({
        payment_number: res.payment_number,
        qr_url: res.qr_url,
        amount: res.amount,
      });
      navigate({
        to: "/payment/qr",
        search: { order_id: res.order_id },
        replace: true,
      });
    },
  });

  useEffect(() => {
    if (!orderId && !create.isPending) create.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = useQuery({
    queryKey: ["payment-status", orderId],
    queryFn: () => statusFn({ data: { order_id: orderId! } }),
    enabled: !!orderId,
    refetchInterval: 4000,
  });

  const isPaid = status.data?.status === "PAID";
  useEffect(() => {
    if (isPaid) {
      const t = setTimeout(() => navigate({ to: "/payment/success" }), 1500);
      return () => clearTimeout(t);
    }
  }, [isPaid, navigate]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Bayar via QRIS</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Scan QR di bawah pakai aplikasi bank/e-wallet kamu. Status akan otomatis
        terupdate setelah pembayaran diterima.
      </p>

      <div className="mt-8 flex min-h-[280px] w-full items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
        {create.isPending || !qr ? (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Membuat QR...
          </div>
        ) : isPaid ? (
          <div className="flex flex-col items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
            <p className="font-medium">Pembayaran diterima</p>
          </div>
        ) : qr.qr_url ? (
          <img src={qr.qr_url} alt="QRIS" className="h-64 w-64 object-contain" />
        ) : qr.payment_number ? (
          <QRCodeSVG value={qr.payment_number} size={256} level="M" />
        ) : (
          <p className="text-sm text-red-600">QR tidak tersedia</p>
        )}
      </div>

      {qr && !isPaid && (
        <p className="mt-4 text-lg font-semibold text-foreground">
          Rp{qr.amount.toLocaleString("id-ID")}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => status.refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          <RefreshCw className="h-4 w-4" />
          Cek status
        </button>
        <Link
          to="/profile"
          className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Kembali
        </Link>
      </div>

      {create.isError && (
        <p className="mt-4 text-sm text-red-600">
          {create.error instanceof Error ? create.error.message : "Gagal"}
        </p>
      )}
    </main>
  );
}
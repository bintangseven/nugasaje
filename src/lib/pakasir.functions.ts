import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRO_PRICE_IDR } from "@/lib/projects.functions";

const PAKASIR_PROJECT = "nugasinaje";
const PAKASIR_BASE = "https://app.pakasir.com";

/**
 * Buat transaksi QRIS di Pakasir untuk upgrade PRO.
 * Response Pakasir umumnya berisi payment_number (string QR) dan/atau qr_url.
 */
export const createProUpgradePakasirQris = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env.PAKASIR_API_KEY;
    if (!apiKey) throw new Error("PAKASIR_API_KEY belum dikonfigurasi");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const orderId = `pro_${context.userId}_${Date.now()}`;

    const body = {
      project: PAKASIR_PROJECT,
      amount: PRO_PRICE_IDR,
      order_id: orderId,
      api_key: apiKey,
    };

    const res = await fetch(`${PAKASIR_BASE}/api/transactioncreate/qris`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      throw new Error(`Respon Pakasir tidak valid: ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      const msg =
        (typeof json.message === "string" && json.message) ||
        (typeof json.error === "string" && json.error) ||
        `Pakasir error (${res.status})`;
      throw new Error(msg);
    }

    // Pakasir bisa mengembalikan field bernama berbeda. Ambil yang tersedia.
    const paymentNumber =
      (typeof json.payment_number === "string" && json.payment_number) ||
      (typeof json.qr_string === "string" && json.qr_string) ||
      (typeof json.qris === "string" && json.qris) ||
      null;
    const qrUrl =
      (typeof json.qr_url === "string" && json.qr_url) ||
      (typeof json.qris_url === "string" && json.qris_url) ||
      null;

    if (!paymentNumber && !qrUrl) {
      throw new Error("Pakasir tidak mengembalikan payment_number/qr_url");
    }

    const { error: insErr } = await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      provider: "pakasir",
      external_id: orderId,
      invoice_url: qrUrl,
      amount: PRO_PRICE_IDR,
      currency: "IDR",
      status: "PENDING",
      purpose: "pro_upgrade",
      raw: json as never,
    });
    if (insErr) throw new Error(insErr.message);

    return {
      order_id: orderId,
      amount: PRO_PRICE_IDR,
      payment_number: paymentNumber,
      qr_url: qrUrl,
    };
  });

/** Polling status pembayaran dari tabel payments (diupdate oleh webhook). */
export const getPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: pay, error } = await context.supabase
      .from("payments")
      .select("status,paid_at,amount")
      .eq("external_id", data.order_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return pay ?? { status: "NOT_FOUND", paid_at: null, amount: 0 };
  });
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRO_PRICE_IDR } from "@/lib/projects.functions";

/**
 * Membuat Xendit Invoice untuk upgrade PRO.
 * Mengembalikan invoice_url agar frontend bisa redirect user ke halaman bayar.
 */
export const createProUpgradeInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env.XENDIT_SECRET_KEY;
    if (!apiKey) throw new Error("XENDIT_SECRET_KEY belum dikonfigurasi");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Ambil email user untuk invoice
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("email,name")
      .eq("id", context.userId)
      .maybeSingle();

    const externalId = `pro_${context.userId}_${Date.now()}`;
    const origin =
      process.env.PUBLIC_SITE_URL ?? "https://nugasaje.lovable.app";

    const body = {
      external_id: externalId,
      amount: PRO_PRICE_IDR,
      currency: "IDR",
      description: "Upgrade Nugasinaje PRO (30 hari)",
      payer_email: profile?.email ?? undefined,
      customer: profile?.name ? { given_names: profile.name } : undefined,
      success_redirect_url: `${origin}/payment/success`,
      failure_redirect_url: `${origin}/payment/failed`,
      invoice_duration: 86400, // 24 jam
      items: [
        {
          name: "Nugasinaje PRO - 1 bulan",
          quantity: 1,
          price: PRO_PRICE_IDR,
          category: "Digital Service",
        },
      ],
    };

    const auth = Buffer.from(`${apiKey}:`).toString("base64");
    const res = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const msg = typeof json.message === "string" ? json.message : "Gagal membuat invoice";
      throw new Error(msg);
    }

    const invoiceUrl = typeof json.invoice_url === "string" ? json.invoice_url : null;
    const invoiceId = typeof json.id === "string" ? json.id : externalId;
    if (!invoiceUrl) throw new Error("Invoice URL tidak ditemukan");

    // Catat di tabel payments
    const { error: insErr } = await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      provider: "xendit",
      external_id: invoiceId,
      invoice_url: invoiceUrl,
      amount: PRO_PRICE_IDR,
      currency: "IDR",
      status: "PENDING",
      purpose: "pro_upgrade",
      raw: json as never,
    });
    if (insErr) throw new Error(insErr.message);

    return { invoice_url: invoiceUrl, external_id: invoiceId };
  });
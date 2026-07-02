import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRO_PRICE_IDR } from "@/lib/projects.functions";

/**
 * Membuat link pembayaran Pakasir untuk upgrade PRO.
 * Menyimpan record payments (status PENDING) lalu mengembalikan URL Pakasir
 * agar frontend bisa redirect user ke halaman bayar (QRIS/VA).
 */
export const createProUpgradeInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const slug = process.env.PAKASIR_PROJECT_SLUG;
    if (!slug) throw new Error("PAKASIR_PROJECT_SLUG belum dikonfigurasi");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const orderId = `pro_${context.userId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;
    const origin = process.env.PUBLIC_SITE_URL ?? "https://nugasaje.lovable.app";

    const url = new URL(`https://app.pakasir.com/pay/${slug}/${PRO_PRICE_IDR}`);
    url.searchParams.set("order_id", orderId);
    url.searchParams.set("redirect", `${origin}/payment/success`);
    const invoiceUrl = url.toString();

    const { error: insErr } = await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      provider: "pakasir",
      external_id: orderId,
      invoice_url: invoiceUrl,
      amount: PRO_PRICE_IDR,
      currency: "IDR",
      status: "PENDING",
      purpose: "pro_upgrade",
      raw: { slug, order_id: orderId } as never,
    });
    if (insErr) throw new Error(insErr.message);

    return { invoice_url: invoiceUrl, external_id: orderId };
  });
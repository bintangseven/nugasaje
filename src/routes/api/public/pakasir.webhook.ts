import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook dari Pakasir. Verifikasi sederhana: cocokkan `api_key` di body
 * dengan PAKASIR_API_KEY. (Pakasir belum menyediakan HMAC signature.)
 */
export const Route = createFileRoute("/api/public/pakasir/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.PAKASIR_API_KEY;
        if (!apiKey) return new Response("Not configured", { status: 500 });

        const raw = await request.text();
        let payload: Record<string, unknown> = {};
        try {
          payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        // Verifikasi api_key: bisa ada di body atau query
        const url = new URL(request.url);
        const tokenIn =
          (typeof payload.api_key === "string" ? payload.api_key : null) ||
          url.searchParams.get("api_key");
        if (tokenIn !== apiKey) {
          return new Response("Unauthorized", { status: 401 });
        }

        const orderId = String(payload.order_id ?? "");
        const statusRaw = String(payload.status ?? "").toLowerCase();
        if (!orderId) return new Response("Missing order_id", { status: 400 });

        // Normalisasi status Pakasir → status internal
        const isPaid =
          statusRaw === "completed" ||
          statusRaw === "paid" ||
          statusRaw === "success" ||
          statusRaw === "settled";
        const status = isPaid ? "PAID" : statusRaw.toUpperCase() || "PENDING";

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const { data: pay } = await supabaseAdmin
          .from("payments")
          .select("id,user_id,status")
          .eq("external_id", orderId)
          .maybeSingle();

        if (!pay) return new Response("Payment not found", { status: 404 });
        if (pay.status === "PAID") return new Response("ok");

        await supabaseAdmin
          .from("payments")
          .update({
            status,
            raw: payload as never,
            paid_at: isPaid ? new Date().toISOString() : null,
          })
          .eq("id", pay.id);

        if (isPaid) {
          const until = new Date();
          until.setDate(until.getDate() + 30);
          await supabaseAdmin
            .from("profiles")
            .update({ plan: "pro", pro_until: until.toISOString() })
            .eq("id", pay.user_id);
        }

        return new Response("ok");
      },
    },
  },
});
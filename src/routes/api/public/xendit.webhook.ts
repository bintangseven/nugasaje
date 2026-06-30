import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/xendit/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-callback-token");
        const expected = process.env.XENDIT_CALLBACK_TOKEN;
        if (!expected || token !== expected) {
          return new Response("Invalid token", { status: 401 });
        }

        const payload = (await request.json()) as Record<string, unknown>;
        const status = String(payload.status ?? "");
        const invoiceId = String(payload.id ?? "");
        const externalId = String(payload.external_id ?? "");
        if (!invoiceId && !externalId) {
          return new Response("Missing invoice id", { status: 400 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // Cari payment berdasarkan id Xendit atau external_id fallback
        const { data: pay } = await supabaseAdmin
          .from("payments")
          .select("id,user_id,status")
          .or(`external_id.eq.${invoiceId},external_id.eq.${externalId}`)
          .maybeSingle();

        if (!pay) return new Response("Payment not found", { status: 404 });

        // Idempotent: jangan proses dua kali
        if (pay.status === "PAID") return new Response("ok");

        await supabaseAdmin
          .from("payments")
          .update({
            status,
            raw: payload as never,
            paid_at: status === "PAID" ? new Date().toISOString() : null,
          })
          .eq("id", pay.id);

        if (status === "PAID") {
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
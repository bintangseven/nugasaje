import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pakasir/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json()) as Record<string, unknown>;
        const orderId = String(payload.order_id ?? "");
        const amount = Number(payload.amount ?? 0);
        const project = String(payload.project ?? "");
        const status = String(payload.status ?? "");
        if (!orderId) return new Response("Missing order_id", { status: 400 });

        const slug = process.env.PAKASIR_PROJECT_SLUG;
        const apiKey = process.env.PAKASIR_API_KEY;
        if (!slug || !apiKey) {
          return new Response("Pakasir not configured", { status: 500 });
        }

        // Verifikasi ke Pakasir agar tidak bisa dipalsukan
        const verifyUrl = new URL("https://app.pakasir.com/api/transactiondetail");
        verifyUrl.searchParams.set("project", slug);
        verifyUrl.searchParams.set("amount", String(amount));
        verifyUrl.searchParams.set("order_id", orderId);
        verifyUrl.searchParams.set("api_key", apiKey);
        const vres = await fetch(verifyUrl.toString());
        if (!vres.ok) return new Response("Verify failed", { status: 401 });
        const vjson = (await vres.json()) as {
          transaction?: { status?: string; amount?: number; project?: string };
        };
        const tx = vjson.transaction;
        if (
          !tx ||
          tx.status !== "completed" ||
          tx.project !== slug ||
          Number(tx.amount) !== amount ||
          status !== "completed"
        ) {
          return new Response("Not verified", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: pay } = await supabaseAdmin
          .from("payments")
          .select("id,user_id,status,amount")
          .eq("external_id", orderId)
          .maybeSingle();
        if (!pay) return new Response("Payment not found", { status: 404 });
        if (pay.status === "PAID") return new Response("ok");
        if (Number(pay.amount) !== amount) {
          return new Response("Amount mismatch", { status: 400 });
        }

        await supabaseAdmin
          .from("payments")
          .update({
            status: "PAID",
            raw: payload as never,
            paid_at: new Date().toISOString(),
          })
          .eq("id", pay.id);

        const until = new Date();
        until.setDate(until.getDate() + 30);
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "pro", pro_until: until.toISOString() })
          .eq("id", pay.user_id);

        return new Response("ok");
      },
    },
  },
});
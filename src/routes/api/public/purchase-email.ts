import { createFileRoute } from "@tanstack/react-router";

/**
 * Supabase Database Webhook target.
 *
 * Configure in the Supabase dashboard:
 *   Database → Webhooks → Create
 *   Table: public.purchases
 *   Events: INSERT
 *   URL: https://<your-domain>/api/public/purchase-email
 *   HTTP Headers: x-webhook-secret: <PURCHASE_EMAIL_WEBHOOK_SECRET>
 *
 * Required env vars:
 *   RESEND_API_KEY
 *   PURCHASE_EMAIL_WEBHOOK_SECRET
 *   RESEND_FROM   (optional, defaults to "Elite Visuals <hello@elitevisuals.ai>")
 */
export const Route = createFileRoute("/api/public/purchase-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.PURCHASE_EMAIL_WEBHOOK_SECRET;
        if (!expected) return new Response("Not configured", { status: 500 });
        if (request.headers.get("x-webhook-secret") !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) return new Response("Missing RESEND_API_KEY", { status: 500 });

        let payload: {
          type?: string;
          record?: {
            user_id: string;
            pack_id: string | null;
            is_membership: boolean;
            stripe_session_id?: string;
          };
        };
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (payload.type !== "INSERT" || !payload.record) {
          return new Response("ok", { status: 200 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(payload.record.user_id);
        const email = userData?.user?.email;
        if (!email) return new Response("ok", { status: 200 });

        let productName = "Elite Visuals All-Access";
        let subject = "You're in — Elite Visuals";
        if (payload.record.pack_id) {
          const { data: pack } = await supabaseAdmin
            .from("packs")
            .select("title")
            .eq("id", payload.record.pack_id)
            .maybeSingle();
          if (pack?.title) productName = pack.title;
          subject = `You're in — ${productName}`;
        }

        const html = `
          <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:540px;margin:0 auto;color:#1a1a2e">
            <h1 style="color:#7c5cfc;margin:0 0 8px">You're in.</h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
              Your purchase of <strong>${productName}</strong> is confirmed.
            </p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.5">
              Head to your library to start using your prompts.
            </p>
            <a href="https://elitevisuals.ai/library"
               style="display:inline-block;background:#7c5cfc;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
              Open Library
            </a>
            <p style="margin-top:32px;font-size:12px;color:#666">
              Questions? Just reply to this email.<br/>
              Elite Visuals · elitevisuals.ai
            </p>
          </div>
        `;

        const from = process.env.RESEND_FROM ?? "Elite Visuals <hello@elitevisuals.ai>";
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from, to: [email], subject, html }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error(JSON.stringify({
            event: "purchase_email_failure",
            sessionId: payload.record.stripe_session_id,
            status: res.status,
            error: text.slice(0, 500),
          }));
          return new Response("Email send failed", { status: 502 });
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { grantStripePurchase, type StripeCheckoutSession } from "@/lib/stripe-purchase.server";

// Verify a Stripe webhook signature header (t=...,v1=...).
async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  ) as Record<string, string>;
  const ts = parts.t;
  const sig = parts.v1;
  if (!ts || !sig) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > toleranceSeconds) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const macBuf = await crypto.subtle.sign("HMAC", key, enc.encode(`${ts}.${payload}`));
  const macHex = Array.from(new Uint8Array(macBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (macHex.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < macHex.length; i++) diff |= macHex.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const payload = await request.text();
        const sig = request.headers.get("stripe-signature");
        const ok = await verifyStripeSignature(payload, sig, secret);
        if (!ok) return new Response("Invalid signature", { status: 401 });

        let event: { type: string; data: { object: Record<string, unknown> } };
        try {
          event = JSON.parse(payload);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (
          event.type !== "checkout.session.completed" &&
          event.type !== "checkout.session.async_payment_succeeded"
        ) {
          return new Response("ok", { status: 200 });
        }

        const session = event.data.object as StripeCheckoutSession;
        if (session.payment_status && session.payment_status !== "paid") {
          return new Response("ok", { status: 200 });
        }

        try {
          await grantStripePurchase(session);
        } catch (error) {
          console.error(
            JSON.stringify({
              event: "webhook_purchase_grant_failure",
              sessionId: session.id,
              error: error instanceof Error ? error.message : String(error),
            }),
          );
          return new Response("DB error", { status: 500 });
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});

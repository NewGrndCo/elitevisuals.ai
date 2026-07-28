import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe webhook receiver.
 *
 * Everything on the site is free and Stripe is used only for optional
 * donations, so there are no entitlements to grant. This endpoint verifies
 * the signature and acknowledges the event.
 *
 * It previously called grantStripePurchase() on every completed session.
 * Donation sessions carry no metadata.user_id and no client_reference_id, so
 * that threw "Checkout session does not belong to this account" and returned
 * 500 for every successful donation — Stripe would retry for three days and
 * then disable the endpoint.
 *
 * Optional env: STRIPE_WEBHOOK_SECRET. If the endpoint is unregistered in
 * Stripe this route can be deleted outright.
 */

type StripeEvent = {
  id?: string;
  type: string;
  data: { object: Record<string, unknown> };
};

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
        if (!(await verifyStripeSignature(payload, sig, secret))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: StripeEvent;
        try {
          event = JSON.parse(payload);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as { id?: string; amount_total?: number };
          // Observability only — no database writes, nothing to unlock.
          console.info(
            JSON.stringify({
              event: "donation_completed",
              sessionId: session.id,
              amountTotal: session.amount_total,
            }),
          );
        }

        // Acknowledge everything else so Stripe never retries or disables us.
        return new Response("ok", { status: 200 });
      },
    },
  },
});

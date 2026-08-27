import { createServerFn } from "@tanstack/react-start";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";

function originFromRequest(): string {
  const proto = getRequestHeader("x-forwarded-proto") ?? "https";
  const host = getRequestHost();
  return `${proto}://${host}`;
}

/**
 * Donation checkout.
 *
 * Everything on the site is free — Stripe is only used for optional support.
 * The session is priced in $1 units with an adjustable quantity so the donor
 * picks their own amount on Stripe's hosted page.
 */
export const createDonationCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { amountDollars?: number } | undefined) => {
    const raw = Math.floor(Number(input?.amountDollars ?? 10));
    const amountDollars = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 5000) : 10;
    return { amountDollars };
  })
  .handler(async ({ data }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("Stripe is not configured");

    const origin = originFromRequest();
    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("submit_type", "donate");
    form.set("success_url", `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/`);
    form.set("integration_identifier", "elitevisuals_donate_jvkrpcta");

    form.set("line_items[0][quantity]", String(data.amountDollars));
    form.set("line_items[0][price_data][currency]", "usd");
    form.set("line_items[0][price_data][unit_amount]", "100");
    form.set("line_items[0][price_data][product_data][name]", "Support Elite Visuals");
    form.set(
      "line_items[0][price_data][product_data][description]",
      "Optional donation — every prompt pack stays free.",
    );
    form.set("line_items[0][adjustable_quantity][enabled]", "true");
    form.set("line_items[0][adjustable_quantity][minimum]", "1");
    form.set("line_items[0][adjustable_quantity][maximum]", "5000");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      console.error("Stripe donation session error", json);
      throw new Error(json.error?.message ?? "Failed to create donation session");
    }
    return { url: json.url, id: json.id };
  });

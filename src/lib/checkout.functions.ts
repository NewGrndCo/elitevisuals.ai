import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";
import { fetchStripeCheckoutSession, grantStripePurchase } from "./stripe-purchase.server";

type PackRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price_cents: number;
};

function originFromRequest(): string {
  const proto = getRequestHeader("x-forwarded-proto") ?? "https";
  const host = getRequestHost();
  return `${proto}://${host}`;
}

async function postStripeSession(form: URLSearchParams, secret: string) {
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
    console.error("Stripe session error", json);
    throw new Error(json.error?.message ?? "Failed to create checkout session");
  }
  return { url: json.url, id: json.id };
}

/** Single-pack checkout (kept for direct "Buy now" shortcuts). */
export const createPackCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { packId: string }) => {
    if (!input?.packId || typeof input.packId !== "string") {
      throw new Error("packId required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("Stripe is not configured");
    const { supabase, userId } = context;

    const { data: pack, error } = await supabase
      .from("packs")
      .select("id,slug,title,description,cover_image_url,price_cents")
      .eq("id", data.packId)
      .eq("is_published", true)
      .maybeSingle<PackRow>();
    if (error) throw error;
    if (!pack) throw new Error("Pack not found");

    const { data: userResp } = await supabase.auth.getUser();
    const email = userResp.user?.email ?? undefined;
    const origin = originFromRequest();

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/pack/${encodeURIComponent(pack.slug)}`);
    form.set("client_reference_id", userId);
    if (email) form.set("customer_email", email);
    form.set("metadata[user_id]", userId);
    form.set("metadata[pack_ids]", pack.id);
    form.set("metadata[membership]", "0");
    form.set("allow_promotion_codes", "true");

    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", "usd");
    form.set("line_items[0][price_data][unit_amount]", String(pack.price_cents));
    form.set("line_items[0][price_data][product_data][name]", pack.title);
    if (pack.description) {
      form.set(
        "line_items[0][price_data][product_data][description]",
        pack.description.slice(0, 500),
      );
    }
    if (pack.cover_image_url) {
      form.set("line_items[0][price_data][product_data][images][0]", pack.cover_image_url);
    }

    return postStripeSession(form, secret);
  });

/** Multi-item cart checkout: any number of packs + optional membership. */
export const createCartCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { items: Array<{ kind: "pack" | "membership"; packId?: string }> }) => {
    if (!input || !Array.isArray(input.items) || input.items.length === 0) {
      throw new Error("items required");
    }
    if (input.items.length > 10) throw new Error("Too many items");
    return input;
  })
  .handler(async ({ data, context }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("Stripe is not configured");
    const { supabase, userId } = context;

    // Collect requested pack ids (deduped).
    const packIds = Array.from(
      new Set(
        data.items
          .filter((i) => i.kind === "pack" && typeof i.packId === "string")
          .map((i) => i.packId as string),
      ),
    );
    const hasMembership = data.items.some((i) => i.kind === "membership");

    // Resolve packs from DB (trust DB for price/title/image).
    let packs: PackRow[] = [];
    if (packIds.length > 0) {
      const { data: rows, error } = await supabase
        .from("packs")
        .select("id,slug,title,description,cover_image_url,price_cents")
        .in("id", packIds)
        .eq("is_published", true);
      if (error) throw error;
      packs = (rows ?? []) as PackRow[];
    }

    // Resolve membership pricing from site_content.
    let membershipPriceCents = 9900;
    let membershipLabel = "All-Access Membership";
    if (hasMembership) {
      const { data: row } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "pricing")
        .maybeSingle<{ value: Record<string, unknown> }>();
      const v = row?.value ?? {};
      const pc = Number(v.membership_price_cents);
      if (Number.isFinite(pc) && pc > 0) membershipPriceCents = Math.floor(pc);
      if (typeof v.membership_label === "string" && v.membership_label.trim()) {
        membershipLabel = v.membership_label.trim();
      }
    }

    if (packs.length === 0 && !hasMembership) throw new Error("No purchasable items");

    const { data: userResp } = await supabase.auth.getUser();
    const email = userResp.user?.email ?? undefined;
    const origin = originFromRequest();

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/`);
    form.set("client_reference_id", userId);
    if (email) form.set("customer_email", email);
    form.set("metadata[user_id]", userId);
    form.set("metadata[pack_ids]", packs.map((p) => p.id).join(","));
    form.set("metadata[membership]", hasMembership ? "1" : "0");
    form.set("allow_promotion_codes", "true");

    let idx = 0;
    for (const p of packs) {
      form.set(`line_items[${idx}][quantity]`, "1");
      form.set(`line_items[${idx}][price_data][currency]`, "usd");
      form.set(`line_items[${idx}][price_data][unit_amount]`, String(p.price_cents));
      form.set(`line_items[${idx}][price_data][product_data][name]`, p.title);
      if (p.description) {
        form.set(
          `line_items[${idx}][price_data][product_data][description]`,
          p.description.slice(0, 500),
        );
      }
      if (p.cover_image_url) {
        form.set(`line_items[${idx}][price_data][product_data][images][0]`, p.cover_image_url);
      }
      idx++;
    }
    if (hasMembership) {
      form.set(`line_items[${idx}][quantity]`, "1");
      form.set(`line_items[${idx}][price_data][currency]`, "usd");
      form.set(`line_items[${idx}][price_data][unit_amount]`, String(membershipPriceCents));
      form.set(`line_items[${idx}][price_data][product_data][name]`, membershipLabel);
      form.set(
        `line_items[${idx}][price_data][product_data][description]`,
        "All-access pass — unlocks every current and future pack.",
      );
      idx++;
    }

    return postStripeSession(form, secret);
  });

/**
 * Verify a completed Checkout Session directly with Stripe and grant access.
 * This is an authenticated fallback for delayed or misconfigured webhooks.
 */
export const confirmCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => {
    if (!input?.sessionId || typeof input.sessionId !== "string" || input.sessionId.length > 255) {
      throw new Error("Valid sessionId required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("Stripe is not configured");

    const session = await fetchStripeCheckoutSession(data.sessionId, secret);
    return grantStripePurchase(session, context.userId);
  });

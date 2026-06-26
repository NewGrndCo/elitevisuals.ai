import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";

type PackRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price_cents: number;
};

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

    // Resolve current user email for Checkout prefill.
    const { data: userResp } = await supabase.auth.getUser();
    const email = userResp.user?.email ?? undefined;

    // Build origin from request headers.
    const proto = getRequestHeader("x-forwarded-proto") ?? "https";
    const host = getRequestHost();
    const origin = `${proto}://${host}`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/pack/${encodeURIComponent(pack.slug)}`);
    form.set("client_reference_id", userId);
    if (email) form.set("customer_email", email);
    form.set("metadata[user_id]", userId);
    form.set("metadata[pack_id]", pack.id);
    form.set("metadata[pack_slug]", pack.slug);
    form.set("payment_intent_data[metadata][user_id]", userId);
    form.set("payment_intent_data[metadata][pack_id]", pack.id);
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
  });

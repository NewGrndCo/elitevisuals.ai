import { createServerFn } from "@tanstack/react-start";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_RE = /^cs_(?:test|live)_[A-Za-z0-9]{10,}$/;

export const finalizeSkillCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => {
    if (!SESSION_RE.test(input.sessionId)) throw new Error("Invalid checkout session");
    return input;
  })
  .handler(async ({ data, context }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("Stripe is not configured");
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(data.sessionId)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
      },
    );
    const session = (await response.json()) as {
      id?: string;
      payment_status?: string;
      client_reference_id?: string;
      metadata?: Record<string, string>;
      error?: { message?: string };
    };
    if (!response.ok) throw new Error(session.error?.message ?? "Could not verify checkout");
    const userId = session.metadata?.user_id ?? session.client_reference_id;
    const skillId = session.metadata?.skill_id;
    if (
      session.payment_status !== "paid" ||
      session.metadata?.kind !== "skill" ||
      userId !== context.userId ||
      !skillId ||
      !UUID_RE.test(skillId)
    ) {
      throw new Error("Checkout does not grant access to this account");
    }
    const { error } = await supabaseAdmin.from("skill_entitlements").upsert(
      {
        user_id: context.userId,
        skill_id: skillId,
        source: "purchase",
        stripe_session_id: session.id ?? data.sessionId,
      },
      { onConflict: "user_id,skill_id" },
    );
    if (error) throw error;
    return { ok: true, skillId };
  });

export const requestSkillDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { skillId: string; versionId: string }) => {
    if (!UUID_RE.test(input.skillId) || !UUID_RE.test(input.versionId))
      throw new Error("Invalid download request");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: skill } = await supabaseAdmin
      .from("skills")
      .select("id,slug,title,price_cents,is_published")
      .eq("id", data.skillId)
      .maybeSingle();
    const { data: version } = await supabaseAdmin
      .from("skill_versions")
      .select("id,skill_id,version,storage_path,is_published")
      .eq("id", data.versionId)
      .eq("skill_id", data.skillId)
      .maybeSingle();
    if (!skill?.is_published || !version?.is_published)
      throw new Error("Skill download is unavailable");

    const { data: entitlement } = await supabaseAdmin
      .from("skill_entitlements")
      .select("id")
      .eq("user_id", context.userId)
      .eq("skill_id", skill.id)
      .maybeSingle();
    if (!entitlement && skill.price_cents > 0) throw new Error("Purchase required");
    if (!entitlement) {
      const { error } = await supabaseAdmin
        .from("skill_entitlements")
        .insert({ user_id: context.userId, skill_id: skill.id, source: "free" });
      if (error) throw error;
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from("skill-packages")
      .createSignedUrl(version.storage_path, 60, {
        download: `${skill.slug}-${version.version}.zip`,
      });
    if (signedError || !signed?.signedUrl)
      throw signedError ?? new Error("Could not issue download");
    await supabaseAdmin
      .from("skill_downloads")
      .insert({ user_id: context.userId, skill_id: skill.id, version_id: version.id });
    return { url: signed.signedUrl };
  });

export const createSkillCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { skillId: string }) => {
    if (!UUID_RE.test(input.skillId)) throw new Error("Invalid skill");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: skill } = await supabaseAdmin
      .from("skills")
      .select("id,slug,title,summary,price_cents,is_published")
      .eq("id", data.skillId)
      .maybeSingle();
    if (!skill?.is_published || skill.price_cents <= 0) throw new Error("Skill is not purchasable");
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("Stripe is not configured");
    const origin = `${getRequestHeader("x-forwarded-proto") ?? "https"}://${getRequestHost()}`;
    const form = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/account/downloads?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/skill/${skill.slug}`,
      client_reference_id: context.userId,
    });
    form.set("metadata[kind]", "skill");
    form.set("metadata[user_id]", context.userId);
    form.set("metadata[skill_id]", skill.id);
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", "usd");
    form.set("line_items[0][price_data][unit_amount]", String(skill.price_cents));
    form.set("line_items[0][price_data][product_data][name]", skill.title);
    form.set("line_items[0][price_data][product_data][description]", skill.summary);
    form.set("integration_identifier", "elitevisuals_skills_qmxnrtaz");
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) throw new Error(json.error?.message ?? "Could not open checkout");
    return { url: json.url };
  });

// Shopify orders/paid webhook handler.
// Verifies HMAC, then grants pack access in `purchases` table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SHOPIFY_SECRET = Deno.env.get("SHOPIFY_WEBHOOK_SECRET") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function verifyHmac(rawBody: string, signature: string): Promise<boolean> {
  if (!signature || !SHOPIFY_SECRET) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SHOPIFY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  // constant-time compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  const raw = await req.text();
  const sig = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const ok = await verifyHmac(raw, sig);
  if (!ok) return new Response("Invalid signature", { status: 401, headers: cors });

  let order: { id: number | string; email?: string; customer?: { email?: string }; line_items?: { variant_id: number | string }[] };
  try { order = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400, headers: cors }); }

  const email = (order.email ?? order.customer?.email ?? "").trim().toLowerCase();
  const variantIds = (order.line_items ?? []).map((li) => String(li.variant_id)).filter(Boolean);
  if (!email || variantIds.length === 0) return new Response("ok", { headers: cors });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Find or create user
  let userId: string | null = null;
  // @ts-ignore -- supabase-js v2.45+
  const { data: existing } = await admin.auth.admin.getUserByEmail(email).catch(() => ({ data: null }));
  if (existing?.user?.id) userId = existing.user.id;
  if (!userId) {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (cErr || !created.user) return new Response(`User create failed: ${cErr?.message ?? ""}`, { status: 500, headers: cors });
    userId = created.user.id;
  }

  // Membership variant lookup
  const { data: pricing } = await admin.from("site_content").select("value").eq("key", "pricing").maybeSingle();
  const membershipVariantId = (pricing?.value as { membership_shopify_variant_id?: string } | null)?.membership_shopify_variant_id ?? "";

  const orderId = String(order.id);
  const rows: { user_id: string; pack_id: string | null; shopify_order_id: string; is_membership: boolean }[] = [];

  const isMembership = membershipVariantId && variantIds.includes(String(membershipVariantId));
  if (isMembership) {
    const { data: allPacks } = await admin.from("packs").select("id").eq("is_published", true);
    (allPacks ?? []).forEach((p) => rows.push({ user_id: userId!, pack_id: p.id, shopify_order_id: orderId, is_membership: false }));
    rows.push({ user_id: userId!, pack_id: null, shopify_order_id: orderId, is_membership: true });
  }

  // Per-variant pack grants
  for (const vid of variantIds) {
    if (membershipVariantId && vid === String(membershipVariantId)) continue;
    const { data: pack } = await admin.from("packs").select("id").eq("shopify_variant_id", vid).maybeSingle();
    if (pack?.id) rows.push({ user_id: userId!, pack_id: pack.id, shopify_order_id: orderId, is_membership: false });
  }

  if (rows.length > 0) {
    const { error: insErr } = await admin.from("purchases").insert(rows);
    if (insErr) return new Response(`Insert failed: ${insErr.message}`, { status: 500, headers: cors });
  }

  return new Response(JSON.stringify({ ok: true, granted: rows.length }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});

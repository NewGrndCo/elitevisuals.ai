export type StripeCheckoutSession = {
  id: string;
  payment_status?: string;
  status?: string;
  metadata?: {
    user_id?: string;
    pack_id?: string;
    pack_ids?: string;
    membership?: string;
  };
  client_reference_id?: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function fetchStripeCheckoutSession(
  sessionId: string,
  secret: string,
): Promise<StripeCheckoutSession> {
  if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) {
    throw new Error("Invalid checkout session");
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const json = (await response.json()) as StripeCheckoutSession & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(json.error?.message ?? "Unable to verify checkout session");
  }
  return json;
}

export async function grantStripePurchase(session: StripeCheckoutSession, expectedUserId?: string) {
  if (session.payment_status !== "paid") {
    return { confirmed: false as const, reason: "payment_pending" as const };
  }

  const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
  if (!userId || (expectedUserId && userId !== expectedUserId)) {
    throw new Error("Checkout session does not belong to this account");
  }

  const packIds = Array.from(
    new Set(
      (session.metadata?.pack_ids ?? session.metadata?.pack_id ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
  if (packIds.some((packId) => !UUID_RE.test(packId))) {
    throw new Error("Checkout session contains an invalid pack");
  }

  const hasMembership = session.metadata?.membership === "1";
  if (packIds.length === 0 && !hasMembership) {
    throw new Error("Checkout session contains no purchasable items");
  }

  const rows: Array<{
    user_id: string;
    pack_id: string | null;
    stripe_session_id: string;
    is_membership: boolean;
  }> = packIds.map((packId) => ({
    user_id: userId,
    pack_id: packId,
    stripe_session_id: session.id,
    is_membership: false,
  }));

  if (hasMembership) {
    rows.push({
      user_id: userId,
      pack_id: null,
      stripe_session_id: session.id,
      is_membership: true,
    });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("purchases")
    .upsert(rows, { onConflict: "stripe_session_id,item_key" });
  if (error) throw error;

  return {
    confirmed: true as const,
    packIds,
    hasMembership,
  };
}

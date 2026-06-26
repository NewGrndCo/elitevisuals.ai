import { supabase } from "@/integrations/supabase/client";
import { createPackCheckout } from "./checkout.functions";

/**
 * Starts a Stripe Checkout session for the given pack and redirects
 * the browser to the Stripe-hosted checkout page.
 * Returns false if the user must sign in first.
 */
export async function startPackCheckout(packId: string): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const next = typeof window !== "undefined" ? window.location.pathname : "/";
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
    return false;
  }
  const result = await createPackCheckout({ data: { packId } });
  if (result?.url) {
    window.location.href = result.url;
    return true;
  }
  throw new Error("No checkout URL returned");
}

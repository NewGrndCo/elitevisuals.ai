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
    // Break out of preview iframe; Stripe Checkout refuses to render framed.
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = result.url;
        return true;
      }
    } catch {
      // Cross-origin parent — fall through to opening in a new tab.
      const w = window.open(result.url, "_blank", "noopener,noreferrer");
      if (w) return true;
    }
    window.location.href = result.url;
    return true;
  }
  throw new Error("No checkout URL returned");
}

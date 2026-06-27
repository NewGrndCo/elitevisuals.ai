import { supabase } from "@/integrations/supabase/client";
import { createPackCheckout, createCartCheckout } from "./checkout.functions";
import type { CartItem } from "./cart-context";

async function redirectTo(url: string) {
  // Break out of preview iframe; Stripe Checkout refuses to render framed.
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return;
    }
  } catch {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) return;
  }
  window.location.href = url;
}

async function requireSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const next = typeof window !== "undefined" ? window.location.pathname : "/";
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
    return false;
  }
  return true;
}

/** Single-pack checkout (used by "Buy now" shortcuts). */
export async function startPackCheckout(packId: string): Promise<boolean> {
  if (!(await requireSession())) return false;
  const result = await createPackCheckout({ data: { packId } });
  if (result?.url) {
    await redirectTo(result.url);
    return true;
  }
  throw new Error("No checkout URL returned");
}

/** Multi-item cart checkout (packs + optional membership). */
export async function startCartCheckout(items: CartItem[]): Promise<boolean> {
  if (!(await requireSession())) return false;
  const payload = items.map((i) => ({ kind: i.kind, packId: i.packId }));
  const result = await createCartCheckout({ data: { items: payload } });
  if (result?.url) {
    await redirectTo(result.url);
    return true;
  }
  throw new Error("No checkout URL returned");
}

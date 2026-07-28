import { createDonationCheckout } from "./checkout.functions";

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

/** Open Stripe Checkout for an optional donation. */
export async function startDonation(amountDollars = 10): Promise<boolean> {
  const result = await createDonationCheckout({ data: { amountDollars } });
  if (result?.url) {
    await redirectTo(result.url);
    return true;
  }
  throw new Error("No checkout URL returned");
}

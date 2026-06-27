import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useUserPurchases } from "@/lib/queries";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : "",
  }),
  head: () => ({
    meta: [
      { title: "Purchase complete — Elite Visuals" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  const qc = useQueryClient();
  const { session_id } = Route.useSearch();
  const { data: purchases, isLoading: purchasesLoading } = useUserPurchases();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const max = 6;
    const poll = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["user_purchases"] });
      attempts++;
      if (attempts >= max) {
        clearInterval(poll);
        setTimedOut(true);
      }
    }, 1500);
    return () => clearInterval(poll);
  }, [qc]);

  const hasPurchase =
    !!purchases && (purchases.packIds.size > 0 || purchases.hasMembership);

  return (
    <>
      <SiteHeader />
      <main className="grid min-h-[70vh] place-items-center px-6 pt-28">
        <div className="glass-card mx-auto max-w-lg rounded-3xl p-10 text-center">
          {hasPurchase ? (
            <>
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[rgba(124,92,252,0.15)]">
                <CheckCircle2 className="h-7 w-7 text-[#a78bfa]" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">You're in.</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Payment confirmed. Your access is unlocked — open the library to get started.
              </p>
              <Link
                to="/library"
                className="ring-glow mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Open the library <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : timedOut ? (
            <>
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[rgba(124,92,252,0.15)]">
                <CheckCircle2 className="h-7 w-7 text-[#a78bfa]" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Almost there.</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Your receipt is processing — it can take a moment. Check your email or visit the library.
              </p>
              <Link
                to="/library"
                className="ring-glow mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Go to library <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[rgba(124,92,252,0.15)]">
                <Loader2 className="h-7 w-7 animate-spin text-[#a78bfa]" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">
                Verifying your purchase…
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {session_id
                  ? "Hang tight while we confirm your payment with Stripe."
                  : "Checking your account for new access."}
              </p>
              {purchasesLoading && (
                <p className="mt-2 text-xs text-muted-foreground/60">Loading…</p>
              )}
            </>
          )}
        </div>
        <SiteFooter />
      </main>
    </>
  );
}

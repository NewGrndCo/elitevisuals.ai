import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
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
  useEffect(() => {
    // Give the webhook a moment, then poll a few times.
    let cancelled = false;
    const tick = (n: number) => {
      if (cancelled) return;
      qc.invalidateQueries({ queryKey: ["user_purchases"] });
      if (n > 0) setTimeout(() => tick(n - 1), 1500);
    };
    tick(4);
    return () => {
      cancelled = true;
    };
  }, [qc]);

  return (
    <>
      <SiteHeader />
      <main className="grid min-h-[70vh] place-items-center px-6 pt-28">
        <div className="glass-card mx-auto max-w-lg rounded-3xl p-10 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[rgba(124,92,252,0.15)]">
            <CheckCircle2 className="h-7 w-7 text-[#a78bfa]" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">You're in.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Payment confirmed. Your pack is unlocking now — it can take a few seconds
            for the receipt to land.
          </p>
          <Link
            to="/library"
            className="ring-glow mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Open the library <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}

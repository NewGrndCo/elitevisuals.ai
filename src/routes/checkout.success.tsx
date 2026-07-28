import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Heart, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : "",
  }),
  head: () => ({
    meta: [
      { title: "Thank you — Elite Visuals" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DonationSuccess,
});

function DonationSuccess() {
  return (
    <>
      <SiteHeader />
      <main className="grid min-h-[70vh] place-items-center px-6 pt-28">
        <div className="glass-card mx-auto max-w-lg rounded-3xl p-10 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[rgba(124,92,252,0.15)]">
            <Heart className="h-7 w-7 text-[#a78bfa]" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Thank you.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your support keeps every prompt pack free for everyone. A receipt is on its way to your inbox.
          </p>
          <Link
            to="/library"
            className="ring-glow mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Back to the library <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}

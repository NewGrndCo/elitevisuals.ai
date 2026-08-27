import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";
import { useSiteContent, sc } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_TAP_COUNT = 4;
const ADMIN_TAP_WINDOW_MS = 1500;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const tapsRef = useRef<number[]>([]);
  const [donating, setDonating] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  const handleDonate = async () => {
    if (donating) return;
    setDonating(true);
    try {
      const { startDonation } = await import("@/lib/checkout-client");
      await startDonation(10);
    } catch {
      toast.error("Couldn't open the donation page. Please try again.");
    } finally {
      setDonating(false);
    }
  };

  const handleLogoTap = (e: React.MouseEvent) => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < ADMIN_TAP_WINDOW_MS), now];
    if (tapsRef.current.length >= ADMIN_TAP_COUNT) {
      e.preventDefault();
      tapsRef.current = [];
      navigate({ to: "/admin" });
    }
  };

  const nav = [
    { to: "/", label: "Home" },
    { to: "/library", label: "Library" },
    { to: "/skills", label: "Skills" },
    { to: "/waitlist", label: "Waitlist" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="flex w-full max-w-[920px] items-center justify-between rounded-full border border-black/[0.07] bg-white/90 px-3 py-2 shadow-[0_12px_40px_rgba(38,18,75,0.10)] backdrop-blur-xl sm:px-5">
        <Link
          to="/"
          onClick={handleLogoTap}
          className="flex items-center gap-2 font-display text-base font-semibold sm:text-lg"
        >
          <img
            src={logoUrl}
            alt="ELITEVISUALS.AI logo"
            width={36}
            height={36}
            loading="eager"
            fetchPriority="high"
            className="h-8 w-8 select-none object-contain sm:h-9 sm:w-9"
            draggable={false}
          />
          <span className="hidden tracking-[-0.025em] text-foreground sm:inline">
            ELITEVISUALS.AI
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-full px-2.5 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${active ? "bg-[#f1ebff] text-primary" : "text-muted-foreground hover:text-foreground"} ${n.to === "/waitlist" ? "hidden md:inline-flex" : ""}`}
              >
                {n.label}
              </Link>
            );
          })}
          {signedIn ? (
            <Link
              to="/account/downloads"
              className="ml-1 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-white sm:text-sm"
            >
              Account
            </Link>
          ) : (
            <Link
              to="/login"
              search={{ next: "/account/downloads" }}
              className="ml-1 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-white sm:text-sm"
            >
              Sign in
            </Link>
          )}
          <button
            onClick={handleDonate}
            disabled={donating}
            aria-label="Donate to support Elite Visuals"
            className="ml-1 hidden items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 disabled:opacity-60 lg:inline-flex"
          >
            {donating ? (
              <Loader2 className="h-[15px] w-[15px] animate-spin" />
            ) : (
              <Heart className="h-[15px] w-[15px]" />
            )}
            <span className="hidden sm:inline">Donate</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { data: site } = useSiteContent();
  const year = new Date().getFullYear();
  const copyright = sc(site, "footer", "copyright", `© ${year} Elite Visuals.`);
  const tagline = sc(site, "footer", "tagline", "Ideas, engineered visually.");

  const cmsLinks = [1, 2, 3, 4]
    .map((i) => ({
      label: sc(site, "footer", `link${i}_label`, ""),
      url: sc(site, "footer", `link${i}_url`, ""),
    }))
    .filter((l) => l.label && l.url);

  const links =
    cmsLinks.length > 0
      ? cmsLinks
      : [
          { label: "Library", url: "/library" },
          { label: "Discord", url: "#" },
          { label: "Twitter", url: "#" },
        ];

  return (
    <footer className="mt-20 border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          {copyright} {tagline}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {links.map((l) =>
            l.url.startsWith("/") ? (
              <Link key={l.label} to={l.url} className="hover:text-foreground">
                {l.label}
              </Link>
            ) : (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                {l.label}
              </a>
            ),
          )}
        </div>
      </div>
    </footer>
  );
}

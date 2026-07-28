import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";
import { useSiteContent, sc } from "@/lib/queries";

const ADMIN_TAP_COUNT = 4;
const ADMIN_TAP_WINDOW_MS = 1500;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const tapsRef = useRef<number[]>([]);
  const [donating, setDonating] = useState(false);

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
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="glass flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 sm:px-6">
        <Link to="/" onClick={handleLogoTap} className="flex items-center gap-2 font-display text-base font-semibold sm:text-lg">
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
          <span className="tracking-[0.18em] text-white">ELITEVISUALS.AI</span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {n.label}
              </Link>
            );
          })}
          <button
            onClick={handleDonate}
            disabled={donating}
            aria-label="Donate to support Elite Visuals"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-[rgba(124,92,252,0.35)] bg-[rgba(124,92,252,0.12)] px-3.5 py-1.5 text-sm font-semibold text-[#c4b5fd] transition-all hover:bg-[rgba(124,92,252,0.2)] hover:shadow-[0_0_20px_rgba(124,92,252,0.3)] disabled:opacity-60"
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
  const tagline = sc(site, "footer", "tagline", "All prompts crafted in the dark.");

  const cmsLinks = [1, 2, 3, 4]
    .map((i) => ({
      label: sc(site, "footer", `link${i}_label`, ""),
      url: sc(site, "footer", `link${i}_url`, ""),
    }))
    .filter((l) => l.label && l.url);

  const links = cmsLinks.length > 0
    ? cmsLinks
    : [
        { label: "Library", url: "/library" },
        { label: "Discord", url: "#" },
        { label: "Twitter", url: "#" },
      ];

  return (
    <footer className="mt-24 border-t border-border/40 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          {copyright} {tagline}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {links.map((l) =>
            l.url.startsWith("/") ? (
              <Link key={l.label} to={l.url} className="hover:text-foreground">{l.label}</Link>
            ) : (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="hover:text-foreground">{l.label}</a>
            )
          )}
        </div>
      </div>
    </footer>
  );
}

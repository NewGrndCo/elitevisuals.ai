"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { Menu } from "lucide-react";
import eliteVisualsLogo from "@/assets/logo.png";
import { ThemeToggle } from "./theme-toggle";
import { MemberButton } from "./member-button";

const links = [
  { href: "/promptbox", label: "Prompts" },
  { href: "/skills", label: "Skills" },
  { href: "/resources", label: "Resources" },
];

export function SiteHeader() {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);
  const logoClicks = useRef<number[]>([]);
  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now();
    logoClicks.current = [...logoClicks.current.filter((time) => now - time < 1800), now];
    if (logoClicks.current.length < 4) return;
    event.preventDefault();
    logoClicks.current = [];
    router.push("/admin");
  };
  return (
    <header
      className="site-header"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setMenuOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="nav-pill">
        <button
          ref={menuButton}
          className="menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="brand" onClick={handleLogoClick}>
          <Image className="brand-logo" src={eliteVisualsLogo} alt="EliteVisuals.ai" priority />
          <span>elitevisuals.ai</span>
        </Link>
        <nav aria-label="Main navigation" id="site-navigation" className={menuOpen ? "open" : ""}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path.startsWith(l.href) ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              className={path.startsWith(l.href) ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <MemberButton />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div>
        <Link href="/" className="brand">
          <Image className="brand-logo" src={eliteVisualsLogo} alt="EliteVisuals.ai" />
          <span>elitevisuals.ai</span>
        </Link>
        <p>Ideas, engineered visually.</p>
      </div>
      <div className="footer-links">
        <Link href="/promptbox">Prompts</Link>
        <Link href="/skills">Skills</Link>
        <Link href="/resources">Resources</Link>
        <Link href="/waitlist">Waitlist</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </div>
    </footer>
  );
}

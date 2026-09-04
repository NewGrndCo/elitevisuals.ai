"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { Menu } from "lucide-react";
import eliteVisualsLogo from "@/assets/logo.png";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/promptbox", label: "Prompts" },
  { href: "/skills", label: "Skills" },
  { href: "/resources", label: "Resources" },
];

export function SiteHeader() {
  const path = usePathname();
  const router = useRouter();
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
    <header className="site-header">
      <div className="nav-pill">
        <button className="menu-button" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <Link href="/" className="brand" onClick={handleLogoClick}>
          <Image className="brand-logo" src={eliteVisualsLogo} alt="EliteVisuals.ai" priority />
          <span>elitevisuals.ai</span>
        </Link>
        <nav>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={path.startsWith(l.href) ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
        <Link href="/login" className="button button-solid nav-signin">
          Sign In
        </Link>
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
      </div>
    </footer>
  );
}

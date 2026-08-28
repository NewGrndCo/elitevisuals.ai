"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import eliteVisualsLogo from "@/assets/logo.png";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/promptbox", label: "Prompt Packs" },
  { href: "/skills", label: "Skills" },
  { href: "/resources", label: "Resources" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="nav-pill">
        <button className="menu-button" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <Link href="/" className="brand">
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
        <Link href="/promptbox">Prompt Packs</Link>
        <Link href="/skills">Skills</Link>
        <Link href="/resources">Resources</Link>
        <Link href="/waitlist">Waitlist</Link>
      </div>
    </footer>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

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
          <span className="brand-mark">E</span>
          <span>elitevisuals.ai</span>
        </Link>
        <nav>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={path.startsWith(l.href) ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
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
          <span className="brand-mark">E</span>
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

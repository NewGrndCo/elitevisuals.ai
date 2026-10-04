"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import eliteVisualsLogo from "@/assets/logo.png";
import { ThemeToggle } from "./theme-toggle";
import { MemberButton } from "./member-button";

const links = [
  { href: "/", label: "Home" },
  { href: "/workspace", label: "Workspace" },
  { href: "/promptbox", label: "Prompts" },
  { href: "/skills", label: "Skills" },
  { href: "/resources", label: "Resources" },
];

export function SiteHeader() {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspaceVisible, setWorkspaceVisible] = useState(true);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);
  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target))
        setMenuOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [menuOpen]);
  useEffect(() => {
    fetch("/api/workspace-status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { visible: true }))
      .then((data: { visible?: boolean }) => setWorkspaceVisible(data.visible !== false))
      .catch(() => setWorkspaceVisible(true));
  }, []);
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
      ref={header}
      className="site-header"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
      }}
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
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/" className="brand" onClick={handleLogoClick}>
          <Image className="brand-logo" src={eliteVisualsLogo} alt="EliteVisuals.ai" priority />
          <span>elitevisuals.ai</span>
        </Link>
        <nav aria-label="Main navigation" id="site-navigation" className={menuOpen ? "open" : ""}>
          {links
            .filter((l) => l.href !== "/workspace" || workspaceVisible)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                prefetch={false}
                aria-current={
                  (l.href === "/" ? path === "/" : path.startsWith(l.href)) ? "page" : undefined
                }
                onClick={() => setMenuOpen(false)}
                className={
                  (l.href === "/" ? path === "/" : path.startsWith(l.href)) ? "active" : ""
                }
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

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";

const ADMIN_TAP_COUNT = 4;
const ADMIN_TAP_WINDOW_MS = 1500;
const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "elite";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      if (data.user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      } else { setIsAdmin(false); }
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const navigate = useNavigate();
  const tapsRef = useRef<number[]>([]);
  const handleLogoTap = (e: React.MouseEvent) => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < ADMIN_TAP_WINDOW_MS), now];
    if (tapsRef.current.length >= ADMIN_TAP_COUNT) {
      e.preventDefault();
      tapsRef.current = [];
      const pwd = window.prompt("Admin password");
      if (pwd == null) return;
      if (pwd === ADMIN_PASSWORD) {
        navigate({ to: "/admin" });
      } else {
        toast.error("Incorrect password");
      }
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
          <img src={logoUrl} alt="ELITEVISUALS logo" className="h-8 w-8 select-none object-contain sm:h-9 sm:w-9" draggable={false} />
          <span className="tracking-[0.18em] text-white">ELITEVISUALS</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} className={`rounded-full px-4 py-1.5 text-sm transition-colors ${active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {n.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className={`rounded-full px-4 py-1.5 text-sm transition-colors ${pathname.startsWith("/admin") ? "bg-white/10" : "text-muted-foreground hover:text-foreground"}`}>Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {email ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
              <button onClick={() => supabase.auth.signOut()} className="grid h-8 w-8 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground" aria-label="Sign out">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium hover:bg-white/15">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/40 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Elite Visuals. All prompts crafted in the dark.</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link to="/library" className="hover:text-foreground">Library</Link>
          <a href="#" className="hover:text-foreground">Discord</a>
          <a href="#" className="hover:text-foreground">Twitter</a>
        </div>
      </div>
    </footer>
  );
}

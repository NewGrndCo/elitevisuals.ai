import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lock, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/queries";
import { adminPinLogin } from "@/lib/admin-pin.functions";
import { SiteHeader } from "@/components/site-chrome";
import { ADMIN_TABS, ADMIN_TAB_GROUPS, isAdminTab, type AdminTab } from "@/components/admin/tabs";
import { ConfirmProvider, GhostButton, PrimaryButton } from "@/components/admin/primitives";
import { Overview } from "@/components/admin/overview";
import { LandingEditor, SectionOrderManager } from "@/components/admin/landing-editor";
import { PackManager } from "@/components/admin/pack-manager";
import { PromptManager } from "@/components/admin/prompt-manager";
import { CategoryManager } from "@/components/admin/category-manager";
import { AiLogoManager } from "@/components/admin/logo-manager";
import { WhitelistManager } from "@/components/admin/whitelist-manager";
import { SkillManager } from "@/components/admin/skill-manager";

export const Route = createFileRoute("/admin")({
  // The active tab lives in the URL, so refresh, back/forward and deep links
  // all work. It was previously local useState — a refresh always dumped you
  // back on Overview and you couldn't link anyone to a specific tab.
  // `tab` is optional in the type so plain links to /admin still typecheck;
  // it always resolves to a concrete tab at runtime.
  validateSearch: (s: Record<string, unknown>): { tab?: AdminTab } => ({
    tab: isAdminTab(s.tab) ? s.tab : "overview",
  }),
  head: () => ({
    meta: [{ title: "Admin — Elite Visuals" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
});

const PIN_STORAGE_KEY = "ev_admin_pin_ok";

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  useEffect(() => {
    let active = true;
    const flagged =
      typeof window !== "undefined" && sessionStorage.getItem(PIN_STORAGE_KEY) === "1";
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthed(flagged && !!data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      setAuthed(!!session && sessionStorage.getItem(PIN_STORAGE_KEY) === "1");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (checking || (authed && adminLoading)) {
    return (
      <Shell>
        <div className="glass animate-pulse rounded-3xl p-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      </Shell>
    );
  }

  if (!authed) {
    return (
      <Shell>
        <PinGate onUnlock={() => setAuthed(true)} />
      </Shell>
    );
  }

  if (isAdmin === false) {
    return (
      <Shell>
        <div className="glass rounded-3xl p-10 text-center">
          <Lock className="mx-auto mb-4 h-8 w-8 text-[#a78bfa]" />
          <h2 className="font-display text-2xl font-semibold">Access denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This account doesn't have admin privileges.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <ConfirmProvider>
      <AdminDashboard />
    </ConfirmProvider>
  );
}

function AdminDashboard() {
  const { tab = "overview" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const setTab = (next: AdminTab) => navigate({ search: { tab: next } });

  const signOut = async () => {
    sessionStorage.removeItem(PIN_STORAGE_KEY);
    await supabase.auth.signOut();
    toast.success("Locked");
  };

  const active = ADMIN_TABS.find((t) => t.key === tab) ?? ADMIN_TABS[0];

  return (
    <Shell>
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Elite Visuals · CMS
          </p>
          <h1 className="text-gradient font-display text-3xl font-semibold sm:text-4xl">
            {active.label}
          </h1>
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            PIN verified
          </span>
          <GhostButton onClick={signOut} aria-label="Lock admin">
            <LogOut className="h-3.5 w-3.5" /> Lock
          </GhostButton>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[210px_1fr]">
        <aside className="glass h-fit rounded-3xl p-3 md:sticky md:top-24">
          {/* Horizontal scroller on mobile, grouped vertical nav on desktop. */}
          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible [&::-webkit-scrollbar]:hidden">
            {ADMIN_TAB_GROUPS.map((group) => {
              const items = ADMIN_TABS.filter((t) => t.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="contents md:block">
                  <div className="hidden px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 md:block">
                    {group}
                  </div>
                  {items.map((t) => {
                    const Icon = t.icon;
                    const isActive = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-white/10 font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          {tab === "overview" && <Overview onJump={setTab} />}
          {tab === "landing" && <LandingEditor />}
          {tab === "sections" && <SectionOrderManager />}
          {tab === "packs" && <PackManager />}
          {tab === "prompts" && <PromptManager />}
          {tab === "skills" && <SkillManager />}
          {tab === "categories" && <CategoryManager />}
          {tab === "logos" && <AiLogoManager />}
          {tab === "whitelist" && <WhitelistManager />}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">{children}</main>
    </>
  );
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const pinLogin = useServerFn(adminPinLogin);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 1);
    setDigits((d) => {
      const next = [...d];
      next[i] = clean;
      return next;
    });
    if (clean && i < 3) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!txt) return;
    e.preventDefault();
    const next = ["", "", "", ""];
    txt.split("").forEach((c, idx) => {
      next[idx] = c;
    });
    setDigits(next);
    inputs.current[Math.min(txt.length, 3)]?.focus();
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pin = digits.join("");
    if (pin.length !== 4) {
      setError("Enter all 4 digits");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { token_hash } = await pinLogin({ data: { pin } });
      const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash, type: "magiclink" });
      if (otpErr) throw otpErr;
      sessionStorage.setItem(PIN_STORAGE_KEY, "1");
      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect PIN");
      setDigits(["", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center">
      <form onSubmit={submit} className="glass w-full rounded-3xl p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.72_0.20_295)] to-[oklch(0.82_0.16_200)]">
          <Lock className="h-5 w-5 text-background" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold">Admin access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your 4-digit PIN to continue.</p>

        <div className="mt-6 flex justify-center gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={onPaste}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete="off"
              type="password"
              aria-label={`PIN digit ${i + 1}`}
              className="glass h-14 w-12 rounded-2xl bg-transparent text-center font-display text-2xl outline-none focus:bg-white/5"
            />
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <PrimaryButton
          type="submit"
          loading={submitting}
          disabled={digits.join("").length !== 4}
          className="mt-6 w-full"
        >
          {submitting ? "Unlocking…" : "Unlock"}
        </PrimaryButton>
      </form>
    </div>
  );
}

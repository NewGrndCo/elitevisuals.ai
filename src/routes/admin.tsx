import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-chrome";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, usePrompts, useAiLogos, usePacks, useSiteContent, useSiteContentMutation, type Prompt, type Category, type AiLogo, type Pack, type SiteContentMap } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminPinLogin } from "@/lib/admin-pin.functions";
import { toast } from "sonner";
import {
  Plus, Trash2, Save, Upload, Mail, ArrowUp, ArrowDown,
  LayoutDashboard, FileText, FolderKanban, Image as ImageIcon, ShieldCheck,
  Eye, EyeOff, Copy, Search, ExternalLink, Type, Package, LogOut, Lock,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Elite Visuals" }] }),
  component: AdminPage,
});

type TabKey = "overview" | "landing" | "sections" | "packs" | "prompts" | "categories" | "logos" | "whitelist";

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "landing", label: "Landing page", icon: Type },
  { key: "sections", label: "Section order", icon: LayoutDashboard },
  { key: "packs", label: "Prompt Packs", icon: Package },
  { key: "prompts", label: "Prompts", icon: FileText },
  { key: "categories", label: "Categories", icon: FolderKanban },
  { key: "logos", label: "AI Models", icon: ImageIcon },
  { key: "whitelist", label: "Admins", icon: ShieldCheck },
];


const PIN_STORAGE_KEY = "ev_admin_pin_ok";

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const flagged = typeof window !== "undefined" && sessionStorage.getItem(PIN_STORAGE_KEY) === "1";
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthed(flagged && !!data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      setAuthed(!!session && sessionStorage.getItem(PIN_STORAGE_KEY) === "1");
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const onUnlock = () => {
    sessionStorage.setItem(PIN_STORAGE_KEY, "1");
    setAuthed(true);
  };

  if (checking) {
    return <Shell><div className="glass animate-pulse rounded-3xl p-10 text-center text-sm text-muted-foreground">Loading…</div></Shell>;
  }
  if (!authed) {
    return <Shell><PinGate onUnlock={onUnlock} /></Shell>;
  }
  return <AdminDashboard />;
}

function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>("overview");

  const signOut = async () => {
    sessionStorage.removeItem(PIN_STORAGE_KEY);
    await supabase.auth.signOut();
  };

  return (
    <Shell>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Elite Visuals · CMS</p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl text-gradient">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 self-start">
          <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            PIN verified
          </div>
          <button onClick={signOut} className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" aria-label="Lock admin">
            <LogOut className="h-3.5 w-3.5" /> Lock
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="glass h-fit rounded-3xl p-3 md:sticky md:top-24">
          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm transition-colors ${active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          {tab === "overview" && <Overview onJump={setTab} />}
          {tab === "landing" && <LandingEditor />}
          {tab === "sections" && <SectionOrderManager />}
          {tab === "packs" && <PackManager />}
          {tab === "prompts" && <PromptManager />}
          {tab === "categories" && <CategoryManager />}
          {tab === "logos" && <AiLogoManager />}
          {tab === "whitelist" && <WhitelistManager />}
        </div>
      </div>
    </Shell>
  );
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const pinLogin = useServerFn(adminPinLogin);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 1);
    setDigits((d) => { const next = [...d]; next[i] = clean; return next; });
    if (clean && i < 3) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (txt.length === 0) return;
    e.preventDefault();
    const next = ["", "", "", ""];
    txt.split("").forEach((c, idx) => { next[idx] = c; });
    setDigits(next);
    inputs.current[Math.min(txt.length, 3)]?.focus();
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pin = digits.join("");
    if (pin.length !== 4) { setError("Enter all 4 digits"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const { token_hash } = await pinLogin({ data: { pin } });
      const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash, type: "magiclink" });
      if (otpErr) throw otpErr;
      onUnlock();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Incorrect PIN";
      setError(msg);
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
              ref={(el) => { inputs.current[i] = el; }}
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

        <button
          type="submit"
          disabled={submitting || digits.join("").length !== 4}
          className="ring-glow mt-6 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {submitting ? "Unlocking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-28">{children}</main>
    </>
  );
}


/* ──────────────────────────── Overview ─────────────────────────── */

function Overview({ onJump }: { onJump: (t: TabKey) => void }) {
  const { data: prompts } = usePrompts();
  const { data: cats } = useCategories();
  const { data: logos } = useAiLogos();

  const totalCopies = useMemo(() => (prompts ?? []).reduce((s, p) => s + (p.copy_count ?? 0), 0), [prompts]);
  const published = (prompts ?? []).filter((p) => p.is_published).length;
  const top = useMemo(() => [...(prompts ?? [])].sort((a, b) => (b.copy_count ?? 0) - (a.copy_count ?? 0)).slice(0, 5), [prompts]);

  const stats = [
    { label: "Prompts", value: prompts?.length ?? 0, sub: `${published} live`, key: "prompts" as TabKey, icon: FileText },
    { label: "Categories", value: cats?.length ?? 0, sub: "Active styles", key: "categories" as TabKey, icon: FolderKanban },
    { label: "AI Logos", value: logos?.length ?? 0, sub: "On homepage", key: "logos" as TabKey, icon: ImageIcon },
    { label: "Total copies", value: totalCopies, sub: "All-time", key: "prompts" as TabKey, icon: Copy },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.label} onClick={() => onJump(s.key)}
              className="glass group rounded-3xl p-5 text-left transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </div>
              <div className="mt-3 font-display text-3xl font-semibold">{s.value.toLocaleString()}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
            </button>
          );
        })}
      </div>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Top performing prompts</h2>
          <button onClick={() => onJump("prompts")} className="text-xs text-muted-foreground hover:text-foreground">View all →</button>
        </div>
        {top.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No prompts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/40">
            {top.map((p, i) => (
              <li key={p.id} className="flex items-center gap-4 py-3">
                <span className="w-6 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
                <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/5">
                  {p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.categories.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{p.copy_count}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">copies</div>
                </div>
                <a href={`/prompt/${p.slug}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ──────────────────────────── Whitelist ─────────────────────────── */

function WhitelistManager() {
  const [emails, setEmails] = useState<{ email: string }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const load = async () => {
    const { data } = await supabase.from("admin_whitelist").select("email").order("email");
    setEmails(data ?? []);
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!newEmail) return;
    const { error } = await supabase.from("admin_whitelist").insert({ email: newEmail.toLowerCase().trim() });
    if (error) toast.error(error.message); else { toast.success("Added — they'll be admin on next sign-in"); setNewEmail(""); load(); }
  };
  const remove = async (email: string) => {
    if (!confirm(`Remove ${email} from admins?`)) return;
    const { error } = await supabase.from("admin_whitelist").delete().eq("email", email);
    if (error) toast.error(error.message); else load();
  };
  return (
    <section className="glass rounded-3xl p-6">
      <SectionHeader title="Admin whitelist" desc="Emails listed here become admins automatically on next sign-in." />
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="glass flex flex-1 items-center gap-2 rounded-xl px-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="email@studio.com" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        </div>
        <button onClick={add} className="ring-glow inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Add admin
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {emails.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No admins yet.</li>}
        {emails.map((e) => (
          <li key={e.email} className="glass flex items-center justify-between rounded-xl px-4 py-2.5 text-sm">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" />{e.email}</span>
            <button onClick={() => remove(e.email)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ──────────────────────────── Categories ─────────────────────────── */

function CategoryManager() {
  const { data: cats } = useCategories();
  const qc = useQueryClient();
  const [newCat, setNewCat] = useState({ slug: "", name: "", accent_color: "#a78bfa" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const add = async () => {
    if (!newCat.slug || !newCat.name) { toast.error("Slug and name required"); return; }
    const { error } = await supabase.from("categories").insert({ ...newCat, sort_order: (cats?.length ?? 0) + 1 });
    if (error) toast.error(error.message); else { setNewCat({ slug: "", name: "", accent_color: "#a78bfa" }); refresh(); toast.success("Category added"); }
  };
  const update = async (c: Category, patch: Partial<Category>) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) toast.error(error.message); else refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this category? Prompts in it will become uncategorized.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  return (
    <section className="glass rounded-3xl p-6">
      <SectionHeader title="Categories" desc="Style buckets used to group prompts on the library page." />

      <div className="glass mt-5 rounded-2xl p-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">New category</div>
        <div className="grid gap-2 sm:grid-cols-[140px_1fr_160px_auto]">
          <input value={newCat.slug} onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} placeholder="slug" className="rounded-xl bg-white/5 px-3 py-2 text-sm font-mono outline-none focus:bg-white/10" />
          <input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="Display name" className="rounded-xl bg-white/5 px-3 py-2 text-sm outline-none focus:bg-white/10" />
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3">
            <input type="color" value={newCat.accent_color} onChange={(e) => setNewCat({ ...newCat, accent_color: e.target.value })} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent" />
            <input value={newCat.accent_color} onChange={(e) => setNewCat({ ...newCat, accent_color: e.target.value })} className="w-full bg-transparent py-2 font-mono text-xs outline-none" />
          </div>
          <button onClick={add} className="ring-glow inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add</button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {cats?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No categories yet.</p>}
        {cats?.map((c) => (
          <div key={c.id} className="glass grid items-center gap-2 rounded-2xl p-3 sm:grid-cols-[140px_1fr_180px_auto]">
            <code className="rounded bg-white/5 px-2 py-1 text-xs text-muted-foreground">{c.slug}</code>
            <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && update(c, { name: e.target.value })} className="rounded-lg bg-transparent px-2 py-1.5 text-sm outline-none focus:bg-white/5" />
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
              <span className="h-5 w-5 rounded-full ring-1 ring-white/20" style={{ background: c.accent_color ?? "" }} />
              <input defaultValue={c.accent_color ?? ""} onBlur={(e) => e.target.value !== c.accent_color && update(c, { accent_color: e.target.value })} className="w-full bg-transparent font-mono text-xs outline-none" />
            </div>
            <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────── Prompts ─────────────────────────── */

function PromptManager() {
  const { data: prompts } = usePrompts();
  const { data: cats } = useCategories();
  const { data: packs } = usePacks(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("");
  const [packFilter, setPackFilter] = useState<string>("");

  const filtered = useMemo(() => (prompts ?? []).filter((p) => {
    if (catFilter && p.category_id !== catFilter) return false;
    if (packFilter && p.pack_id !== packFilter) return false;
    if (search && !`${p.title} ${p.slug}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [prompts, search, catFilter, packFilter]);

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Prompts" desc={`${prompts?.length ?? 0} total · ${filtered.length} shown`} />
        <NewPromptButton cats={cats ?? []} packs={packs ?? []} />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="glass flex flex-1 items-center gap-2 rounded-xl px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or slug…" className="w-full bg-transparent py-2 text-sm outline-none" />
        </div>
        <select value={packFilter} onChange={(e) => setPackFilter(e.target.value)} className="glass rounded-xl bg-transparent px-3 py-2 text-sm outline-none">
          <option value="" className="bg-background">All packs</option>
          {packs?.map((p) => <option key={p.id} value={p.id} className="bg-background">{p.title}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="glass rounded-xl bg-transparent px-3 py-2 text-sm outline-none">
          <option value="" className="bg-background">All categories</option>
          {cats?.map((c) => <option key={c.id} value={c.id} className="bg-background">{c.name}</option>)}
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No prompts match.</p>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="glass rounded-2xl">
            <button onClick={() => setOpenId(openId === p.id ? null : p.id)} className="flex w-full items-center justify-between p-4 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{p.title}</div>
                    {!p.is_published && <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-yellow-200">Draft</span>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    <span className="rounded-full px-2 py-0.5" style={{ background: `${p.categories.accent_color}33`, color: p.categories.accent_color ?? undefined }}>{p.categories.name}</span>
                    <span className="ml-2 font-mono">/{p.slug}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-4 text-xs text-muted-foreground">
                <span className="hidden sm:inline">{p.copy_count} copies</span>
                <span className="text-foreground">{openId === p.id ? "Close" : "Edit"}</span>
              </div>
            </button>
            {openId === p.id && <PromptEditor prompt={p} cats={cats ?? []} packs={packs ?? []} onClose={() => setOpenId(null)} />}
          </div>
        ))}
      </div>
    </section>
  );
}

function NewPromptButton({ cats, packs }: { cats: Category[]; packs: Pack[] }) {
  const qc = useQueryClient();
  const create = async () => {
    if (cats.length === 0) { toast.error("Create a category first"); return; }
    if (packs.length === 0) { toast.error("Create a pack first"); return; }
    const slug = `new-prompt-${Date.now()}`;
    const { error } = await supabase.from("prompts").insert({ slug, title: "New prompt", description: "", prompt_text: "", category_id: cats[0].id, pack_id: packs[0].id, is_published: false });
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ["prompts"] }); toast.success("Draft prompt created"); }
  };
  return (
    <button onClick={create} className="ring-glow inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
      <Plus className="h-4 w-4" /> New prompt
    </button>
  );
}

function PromptEditor({ prompt, cats, packs, onClose }: { prompt: Prompt & { categories: { slug: string; name: string; accent_color: string | null } }; cats: Category[]; packs: Pack[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Prompt>(prompt);
  const [galleryText, setGalleryText] = useState(prompt.gallery_urls.join("\n"));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const payload = { ...form, gallery_urls: galleryText.split("\n").map((s) => s.trim()).filter(Boolean) };
    const { error } = await supabase.from("prompts").update({
      title: payload.title, slug: payload.slug, description: payload.description,
      prompt_text: payload.prompt_text, category_id: payload.category_id, pack_id: payload.pack_id,
      cover_image_url: payload.cover_image_url, demo_video_url: payload.demo_video_url,
      gallery_urls: payload.gallery_urls, is_published: payload.is_published,
    }).eq("id", form.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["prompts"] }); qc.invalidateQueries({ queryKey: ["prompt", form.slug] }); }
  };
  const del = async () => {
    if (!confirm("Delete this prompt? This cannot be undone.")) return;
    const { error } = await supabase.from("prompts").delete().eq("id", form.id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ["prompts"] }); onClose(); }
  };

  const upload = async (file: File, kind: "cover" | "video") => {
    const path = `${form.slug}/${kind}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("elite-media").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("elite-media").getPublicUrl(path);
    setForm({ ...form, [kind === "cover" ? "cover_image_url" : "demo_video_url"]: data.publicUrl });
    toast.success("Uploaded");
  };

  return (
    <div className="space-y-4 border-t border-border/40 bg-white/[0.02] p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none" /></Field>
        <Field label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm font-mono outline-none" /></Field>
        <Field label="Pack">
          <select value={form.pack_id ?? ""} onChange={(e) => setForm({ ...form, pack_id: e.target.value || null })} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none">
            <option value="" className="bg-background">— unassigned —</option>
            {packs.map((p) => <option key={p.id} value={p.id} className="bg-background">{p.title}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none">
            {cats.map((c) => <option key={c.id} value={c.id} className="bg-background">{c.name}</option>)}
          </select>
        </Field>
        <Field label="Visibility">
          <button onClick={() => setForm({ ...form, is_published: !form.is_published })}
            className={`glass flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${form.is_published ? "text-emerald-300" : "text-yellow-300"}`}>
            {form.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {form.is_published ? "Published" : "Draft"}
          </button>
        </Field>
      </div>
      <Field label="Description"><textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none" /></Field>
      <Field label="Prompt text"><textarea value={form.prompt_text} onChange={(e) => setForm({ ...form, prompt_text: e.target.value })} rows={6} className="glass w-full rounded-xl bg-transparent px-3 py-2 font-mono text-sm outline-none" /></Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <MediaField label="Cover image" url={form.cover_image_url} accept="image/*" onUrl={(u) => setForm({ ...form, cover_image_url: u })} onFile={(f) => upload(f, "cover")} preview="image" />
        <MediaField label="Demo video" url={form.demo_video_url} accept="video/*" onUrl={(u) => setForm({ ...form, demo_video_url: u })} onFile={(f) => upload(f, "video")} preview="video" />
      </div>
      <Field label="Gallery URLs (one per line)"><textarea value={galleryText} onChange={(e) => setGalleryText(e.target.value)} rows={3} className="glass w-full rounded-xl bg-transparent px-3 py-2 font-mono text-xs outline-none" /></Field>

      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <button onClick={del} className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /> Delete</button>
        <div className="flex items-center gap-2">
          <a href={`/prompt/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /> Preview</a>
          <button onClick={save} disabled={saving} className="ring-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}


/* ──────────────────────────── Landing Page Editor ─────────────────────────── */

type FieldKind = "text" | "textarea" | "image";
type Block = { key: string; label: string; fields: { name: string; label: string; type: FieldKind }[] };

const LANDING_BLOCKS: Block[] = [
  { key: "hero", label: "Hero section", fields: [
    { name: "badge", label: "Badge (small uppercase tag)", type: "text" },
    { name: "badge_label", label: "Badge label", type: "text" },
    { name: "headline", label: "Headline", type: "textarea" },
    { name: "subhead", label: "Subheading", type: "textarea" },
    { name: "cta_primary", label: "Primary CTA button", type: "text" },
    { name: "cta_secondary", label: "Secondary CTA button", type: "text" },
    { name: "product_image", label: "Product preview image (pricing card)", type: "image" },
  ]},
  { key: "demo", label: "Demo Reel", fields: [
    { name: "video_url", label: "Demo reel video URL (mp4/webm)", type: "text" },
    { name: "poster_image", label: "Poster image (shown before play)", type: "image" },
    { name: "caption", label: "Caption (small label under top-left dot)", type: "text" },
  ]},
  { key: "library", label: "Library page", fields: [
    { name: "title", label: "Page title", type: "text" },
    { name: "description", label: "Page description", type: "textarea" },
    { name: "hero_image", label: "Image above page title", type: "image" },
  ]},
  { key: "footer", label: "Footer", fields: [
    { name: "copyright", label: "Copyright text", type: "text" },
    { name: "tagline", label: "Tagline (after copyright)", type: "text" },
    { name: "link1_label", label: "Link 1 label", type: "text" },
    { name: "link1_url", label: "Link 1 URL", type: "text" },
    { name: "link2_label", label: "Link 2 label", type: "text" },
    { name: "link2_url", label: "Link 2 URL", type: "text" },
    { name: "link3_label", label: "Link 3 label", type: "text" },
    { name: "link3_url", label: "Link 3 URL", type: "text" },
    { name: "link4_label", label: "Link 4 label", type: "text" },
    { name: "link4_url", label: "Link 4 URL", type: "text" },
  ]},
];

function LandingEditor() {
  const { data: site } = useSiteContent();
  const mut = useSiteContentMutation();
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (!site) return;
    const next: Record<string, Record<string, string>> = {};
    LANDING_BLOCKS.forEach((b) => {
      next[b.key] = {};
      b.fields.forEach((f) => {
        const v = site[b.key]?.[f.name];
        next[b.key][f.name] = typeof v === "string" ? v : "";
      });
    });
    setDrafts(next);
  }, [site]);

  const setField = (block: string, field: string, value: string) =>
    setDrafts((d) => ({ ...d, [block]: { ...(d[block] ?? {}), [field]: value } }));

  const uploadImage = async (block: string, field: string, file: File) => {
    const path = `landing/${block}-${field}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("elite-media").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("elite-media").getPublicUrl(path);
    setField(block, field, data.publicUrl);
    toast.success("Uploaded — remember to Save");
  };

  const saveBlock = async (key: string) => {
    await mut.mutateAsync({ key, value: drafts[key] ?? {} });
    toast.success("Saved — changes are live");
  };

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-6">
        <SectionHeader title="Landing page content" desc="Edit hero text, library page copy, footer, and images. Changes appear immediately on the live site." />
      </section>

      {LANDING_BLOCKS.map((block) => (
        <section key={block.key} className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">{block.label}</h2>
            <button onClick={() => saveBlock(block.key)} disabled={mut.isPending}
              className="ring-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {block.fields.map((f) => {
              const val = drafts[block.key]?.[f.name] ?? "";
              const wide = f.type !== "text";
              return (
                <div key={f.name} className={wide ? "sm:col-span-2" : ""}>
                  <Field label={f.label}>
                    {f.type === "textarea" ? (
                      <textarea
                        value={val}
                        onChange={(e) => setField(block.key, f.name, e.target.value)}
                        rows={3}
                        className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none"
                      />
                    ) : f.type === "image" ? (
                      <div className="space-y-2">
                        {val && (
                          <div className="glass aspect-video w-full overflow-hidden rounded-xl bg-black/40">
                            <img src={val} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <input
                          value={val}
                          onChange={(e) => setField(block.key, f.name, e.target.value)}
                          placeholder="https://… or upload below"
                          className="glass w-full rounded-xl bg-transparent px-3 py-2 text-xs outline-none"
                        />
                        <label className="glass flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs hover:bg-white/10">
                          <Upload className="h-3.5 w-3.5" /> Upload image
                          <input
                            type="file" accept="image/*" className="hidden"
                            onChange={(e) => e.target.files?.[0] && uploadImage(block.key, f.name, e.target.files[0])}
                          />
                        </label>
                      </div>
                    ) : (
                      <input
                        value={val}
                        onChange={(e) => setField(block.key, f.name, e.target.value)}
                        className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none"
                      />
                    )}
                  </Field>
                </div>
              );
            })}
          </div>
        </section>
      ))}

    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</label>{children}</div>;
}

function MediaField({ label, url, accept, onUrl, onFile, preview }: { label: string; url: string | null; accept: string; onUrl: (u: string) => void; onFile: (f: File) => void; preview: "image" | "video" }) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {url && (
          <div className="glass aspect-video w-full overflow-hidden rounded-xl bg-black/40">
            {preview === "image"
              ? <img src={url} alt="" className="h-full w-full object-cover" />
              : <video src={url} className="h-full w-full object-cover" muted playsInline />}
          </div>
        )}
        <input value={url ?? ""} onChange={(e) => onUrl(e.target.value)} placeholder="https://…" className="glass w-full rounded-xl bg-transparent px-3 py-2 text-xs outline-none" />
        <label className="glass flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs hover:bg-white/10">
          <Upload className="h-3.5 w-3.5" /> Upload file
          <input type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      </div>
    </Field>
  );
}

/* ──────────────────────────── AI Logos ─────────────────────────── */

function AiLogoManager() {
  const { data: logos } = useAiLogos();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["ai_logos"] });

  const addLogo = async (file: File) => {
    const path = `ai-logos/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("elite-media").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); return; }
    const { data } = supabase.storage.from("elite-media").getPublicUrl(path);
    const { error } = await supabase.from("ai_logos").insert({
      name: file.name.replace(/\.[^.]+$/, ""),
      logo_url: data.publicUrl,
      sort_order: (logos?.length ?? 0) + 1,
    });
    if (error) toast.error(error.message); else { toast.success("Logo added"); refresh(); }
  };

  const update = async (l: AiLogo, patch: Partial<AiLogo>) => {
    const { error } = await supabase.from("ai_logos").update(patch).eq("id", l.id);
    if (error) toast.error(error.message); else refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this logo?")) return;
    const { error } = await supabase.from("ai_logos").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  const reorder = async (l: AiLogo, dir: -1 | 1) => {
    if (!logos) return;
    const sorted = [...logos].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((x) => x.id === l.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("ai_logos").update({ sort_order: swap.sort_order }).eq("id", l.id),
      supabase.from("ai_logos").update({ sort_order: l.sort_order }).eq("id", swap.id),
    ]);
    refresh();
  };

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="AI Models Carousel" desc="Logos that auto-scroll across the homepage. Hide individual ones with the toggle." />
        <label className="ring-glow inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Upload logo
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden"
            onChange={(e) => e.target.files?.[0] && addLogo(e.target.files[0])} />
        </label>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {logos?.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No logos yet — upload your first one.</p>
        )}
        {logos?.map((l) => (
          <div key={l.id} className={`glass flex items-center gap-3 rounded-2xl p-3 transition-opacity ${l.is_published ? "" : "opacity-50"}`}>
            <div className="grid h-14 w-24 flex-shrink-0 place-items-center rounded-lg bg-white/5 p-2">
              <img src={l.logo_url} alt={l.name} className="max-h-10 max-w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <input defaultValue={l.name} onBlur={(e) => e.target.value !== l.name && update(l, { name: e.target.value })}
                className="w-full rounded-lg bg-transparent px-2 py-1 text-sm font-semibold outline-none focus:bg-white/5" />
              <input defaultValue={l.link_url ?? ""} placeholder="Optional link URL"
                onBlur={(e) => e.target.value !== (l.link_url ?? "") && update(l, { link_url: e.target.value || null })}
                className="w-full rounded-lg bg-transparent px-2 py-1 text-xs text-muted-foreground outline-none focus:bg-white/5" />
            </div>
            <button onClick={() => update(l, { is_published: !l.is_published })}
              className="text-muted-foreground hover:text-foreground" aria-label="Toggle visibility">
              {l.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <div className="flex flex-col">
              <button onClick={() => reorder(l, -1)} className="text-muted-foreground hover:text-foreground"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => reorder(l, 1)} className="text-muted-foreground hover:text-foreground"><ArrowDown className="h-3.5 w-3.5" /></button>
            </div>
            <button onClick={() => remove(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────── Helpers ─────────────────────────── */

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
    </div>
  );
}

/* ──────────────────────────── Section order ─────────────────────────── */

import { DEFAULT_SECTIONS, getSectionOrder, type SectionId } from "@/lib/sections";
export { DEFAULT_SECTIONS, getSectionOrder };
export type { SectionId };

function SectionOrderManager() {
  const { data: site } = useSiteContent();
  const mut = useSiteContentMutation();
  const [order, setOrder] = useState<SectionId[]>(DEFAULT_SECTIONS.map((s) => s.id));

  useEffect(() => { if (site) setOrder(getSectionOrder(site)); }, [site]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setOrder(next);
  };
  const save = async () => {
    await mut.mutateAsync({ key: "layout", value: { sections: order } });
    toast.success("Section order saved — refresh the homepage to see it");
  };
  const reset = () => setOrder(DEFAULT_SECTIONS.map((s) => s.id));

  const labelFor = (id: SectionId) => DEFAULT_SECTIONS.find((s) => s.id === id)?.label ?? id;

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Landing section order" desc="Drag-free reorder — use the arrows to set how sections appear under the hero on the homepage." />
        <div className="flex gap-2">
          <button onClick={reset} className="rounded-full bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Reset</button>
          <button onClick={save} disabled={mut.isPending}
            className="ring-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            <Save className="h-4 w-4" /> Save order
          </button>
        </div>
      </div>
      <ol className="mt-5 space-y-2">
        {order.map((id, i) => (
          <li key={id} className="glass flex items-center gap-3 rounded-2xl p-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 font-mono text-xs">{i + 1}</span>
            <span className="flex-1 text-sm font-semibold">{labelFor(id)}</span>
            <code className="text-xs text-muted-foreground">{id}</code>
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">Hero stays pinned at the top. Footer stays pinned at the bottom.</p>
    </section>
  );
}

/* ──────────────────────────── Pack Manager ─────────────────────────── */

function PackManager() {
  const { data: packs } = usePacks(true);
  const { data: prompts } = usePrompts();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["packs"] }); qc.invalidateQueries({ queryKey: ["prompts"] }); };

  const create = async () => {
    const slug = `new-pack-${Date.now()}`;
    const { error } = await supabase.from("packs").insert({ slug, title: "New Pack", description: "", sort_order: (packs?.length ?? 0) + 1, is_published: false });
    if (error) toast.error(error.message); else { refresh(); toast.success("Draft pack created"); }
  };

  const remove = async (p: Pack) => {
    if (!confirm(`Delete "${p.title}"? Prompts in this pack will become unassigned.`)) return;
    const { error } = await supabase.from("packs").delete().eq("id", p.id);
    if (error) toast.error(error.message); else refresh();
  };

  const countFor = (id: string) => (prompts ?? []).filter((p) => p.pack_id === id).length;

  return (
    <section className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Prompt Packs" desc="Each pack appears as a card on the library page. Click to edit details or manage prompts." />
        <button onClick={create} className="ring-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> New pack
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {packs?.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No packs yet. Create your first one above.</p>}
        {packs?.map((p) => (
          <div key={p.id} className="glass rounded-2xl">
            <button onClick={() => setOpenId(openId === p.id ? null : p.id)} className="flex w-full items-center justify-between p-4 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{p.title}</div>
                    {!p.is_published && <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-yellow-200">Draft</span>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground"><span className="font-mono">/{p.slug}</span> · {countFor(p.id)} prompts</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <a href={`/pack/${p.slug}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
                <span className="text-foreground">{openId === p.id ? "Close" : "Edit"}</span>
              </div>
            </button>
            {openId === p.id && <PackEditor pack={p} onDelete={() => { remove(p); setOpenId(null); }} onClose={() => setOpenId(null)} />}
          </div>
        ))}
      </div>
    </section>
  );
}

function PackEditor({ pack, onDelete, onClose }: { pack: Pack; onDelete: () => void; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Pack>(pack);
  const [saving, setSaving] = useState(false);
  const { data: prompts } = usePrompts();
  const { data: cats } = useCategories();
  const inPack = (prompts ?? []).filter((p) => p.pack_id === pack.id);
  const others = (prompts ?? []).filter((p) => p.pack_id !== pack.id);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("packs").update({
      title: form.title, slug: form.slug, description: form.description,
      cover_image_url: form.cover_image_url, is_published: form.is_published,
    }).eq("id", form.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["packs"] }); }
  };

  const upload = async (file: File) => {
    const path = `packs/${form.slug}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("elite-media").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("elite-media").getPublicUrl(path);
    setForm({ ...form, cover_image_url: data.publicUrl });
    toast.success("Uploaded — remember to Save");
  };

  const assign = async (promptId: string, packId: string | null) => {
    const { error } = await supabase.from("prompts").update({ pack_id: packId }).eq("id", promptId);
    if (error) toast.error(error.message);
    else { qc.invalidateQueries({ queryKey: ["prompts"] }); qc.invalidateQueries({ queryKey: ["prompts_by_pack", pack.id] }); }
  };

  return (
    <div className="space-y-4 border-t border-border/40 bg-white/[0.02] p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none" /></Field>
        <Field label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm font-mono outline-none" /></Field>
      </div>
      <Field label="Description"><textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none" /></Field>
      <MediaField label="Cover image" url={form.cover_image_url} accept="image/*" onUrl={(u) => setForm({ ...form, cover_image_url: u })} onFile={upload} preview="image" />

      <Field label="Visibility">
        <button onClick={() => setForm({ ...form, is_published: !form.is_published })}
          className={`glass flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${form.is_published ? "text-emerald-300" : "text-yellow-300"}`}>
          {form.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {form.is_published ? "Published" : "Draft"}
        </button>
      </Field>

      <div className="rounded-2xl bg-white/[0.02] p-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Prompts in this pack ({inPack.length})</div>
        <ul className="space-y-1">
          {inPack.length === 0 && <li className="py-2 text-sm text-muted-foreground">None yet — add one from the picker below.</li>}
          {inPack.map((p) => {
            const cat = cats?.find((c) => c.id === p.category_id);
            return (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5">
                <span className="truncate"><span className="font-semibold">{p.title}</span> <span className="text-xs text-muted-foreground">· {cat?.name ?? "uncategorized"}</span></span>
                <button onClick={() => assign(p.id, null)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
              </li>
            );
          })}
        </ul>
        {others.length > 0 && (
          <div className="mt-3">
            <select defaultValue="" onChange={(e) => { if (e.target.value) { assign(e.target.value, pack.id); e.target.value = ""; } }} className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none">
              <option value="" className="bg-background">+ Add a prompt to this pack…</option>
              {others.map((p) => <option key={p.id} value={p.id} className="bg-background">{p.title}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /> Delete pack</button>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Close</button>
          <button onClick={save} disabled={saving} className="ring-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

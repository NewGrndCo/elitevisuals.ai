import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useCategories, usePack, usePromptsByPack, useUserPurchases } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Sparkles, UploadCloud, Play, Copy, Check, ArrowLeft, Lock, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startPackCheckout } from "@/lib/checkout-client";




export const Route = createFileRoute("/pack/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Elite Visuals` },
      { name: "description", content: "Cinematic AI prompts." },
    ],
  }),
  component: PackPage,
  notFoundComponent: () => (
    <>
      <SiteHeader />
      <main className="grid min-h-[60vh] place-items-center px-6 pt-28 text-center">
        <div>
          <h1 className="font-display text-3xl">Pack not found</h1>
          <Link to="/library" className="mt-4 inline-block text-sm text-[#a78bfa] underline">Back to library</Link>
        </div>
      </main>
    </>
  ),
});

type PromptRow = {
  id: string; slug: string; title: string; description: string | null;
  prompt_text: string; cover_image_url: string | null;
  categories: { slug: string; name: string; accent_color: string | null } | null;
};

function CopyButton({ slug, text }: { slug: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Prompt copied");
      await supabase.rpc("increment_prompt_copy", { _slug: slug });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy");
    }
  };
  return (
    <button
      onClick={onCopy}
      aria-label="Copy prompt"
      className="glass absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition hover:bg-black/60"
    >
      {copied ? <Check className="h-4 w-4 text-[#7dd3fc]" /> : <Copy className="h-4 w-4 text-white/90" />}
    </button>
  );
}

function PromptCard({ p, accent, isUnlocked, pack }: { p: PromptRow; accent: string; isUnlocked: boolean; pack: { id: string } | null }) {
  const [busy, setBusy] = useState(false);
  const onBuy = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!pack?.id) return;
    setBusy(true);
    try { await startPackCheckout(pack.id); }
    catch (err) { console.error(err); toast.error("Couldn't start checkout"); setBusy(false); }
  };

  return (
    <div className="glass group relative w-[78vw] shrink-0 snap-start overflow-hidden rounded-3xl sm:w-[55vw] md:w-auto md:shrink">
      {isUnlocked && <CopyButton slug={p.slug} text={p.prompt_text} />}
      {isUnlocked ? (
        <Link to="/prompt/$slug" params={{ slug: p.slug }} className="block">
          <div className="relative aspect-[4/3] overflow-hidden">
            {p.cover_image_url ? (
              <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" decoding="async" />
            ) : (
              <div className="h-full w-full" style={{
                background: `radial-gradient(circle at 30% 30%, ${accent}55, transparent 60%), radial-gradient(circle at 70% 70%, #22d3ee35, transparent 60%), #1a1830`,
              }} />
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        </Link>
      ) : (
        <div className="block">
          <div className="relative aspect-[4/3] overflow-hidden">
            {p.cover_image_url ? (
              <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" decoding="async" />
            ) : (
              <div className="h-full w-full" style={{
                background: `radial-gradient(circle at 30% 30%, ${accent}55, transparent 60%), radial-gradient(circle at 70% 70%, #22d3ee35, transparent 60%), #1a1830`,
              }} />
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        </div>
      )}
      <div className="p-5">
        {isUnlocked ? (
          <Link to="/prompt/$slug" params={{ slug: p.slug }} className="font-display text-lg font-semibold hover:text-[#a78bfa] focus:outline-none">
            {p.title}
          </Link>
        ) : (
          <span className="font-display text-lg font-semibold text-foreground">
            {p.title}
          </span>
        )}
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>

        <div className="relative mt-4 min-h-[88px] overflow-hidden rounded-xl border border-white/5 bg-black/30 p-3">
          {isUnlocked ? (
            <p className="line-clamp-4 font-mono text-xs leading-relaxed text-white/80">{p.prompt_text}</p>
          ) : (
            <>
              <div className="pointer-events-none select-none" style={{ filter: "blur(6px)" }} aria-hidden>
                <p className="line-clamp-4 font-mono text-xs leading-relaxed text-white/80">{p.prompt_text}</p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 backdrop-blur-[2px]">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/90">
                  <Lock className="h-3.5 w-3.5 text-[#a78bfa]" /> Purchase to unlock
                </div>
                <button
                  onClick={onBuy}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#a78bfa] px-3 py-1.5 text-[11px] font-semibold text-black transition hover:bg-[#c4b5fd] disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingCart className="h-3 w-3" />} Buy pack
                </button>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


function PackPage() {
  const { slug } = Route.useParams();
  const { data: pack, isLoading: packLoading } = usePack(slug);
  const { data: cats } = useCategories();
  const { data: prompts, isLoading } = usePromptsByPack(pack?.id);
  const { data: purchases } = useUserPurchases();
  const cart = useCart();
  const isUnlocked = !!(pack && (purchases?.hasMembership || purchases?.packIds.has(pack.id)));
  const hidden = new Set(pack?.hidden_sections ?? []);



  const grouped = useMemo(() => {
    const map = new Map<string, PromptRow[]>();
    (prompts ?? []).forEach((p) => {
      const key = p.categories?.slug ?? "uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p as unknown as PromptRow);
    });
    return map;
  }, [prompts]);

  if (!packLoading && !pack) throw notFound();

  return (
    <>
      <SiteHeader />
      <main className="pt-28">
        {!hidden.has("hero") && (
        <section className="mx-auto max-w-5xl px-6 text-center">
          <Link to="/library" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> All packs
          </Link>

          <div className="mx-auto mb-8 aspect-square w-40 overflow-hidden rounded-3xl glass sm:w-52">
            {pack?.cover_image_url ? (
              <img src={pack.cover_image_url} alt={pack.title} className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
            ) : (
              <div className="h-full w-full" style={{
                background: "radial-gradient(circle at 30% 30%, rgba(167,139,250,0.55), transparent 60%), radial-gradient(circle at 70% 70%, rgba(34,211,238,0.45), transparent 60%), #0f0c1f",
              }} />
            )}
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
            <span className="bg-gradient-to-br from-[#f0f0f8] via-[#f0f0f8] to-[#a78bfa] bg-clip-text text-transparent">
              {pack?.title ?? "Loading…"}
            </span>
          </h1>

          {pack?.description && (
            <p className="mx-auto mt-8 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              {pack.description}
            </p>
          )}

          {!isUnlocked && pack?.shopify_variant_id && (
            <div className="mx-auto mt-6 flex max-w-lg flex-col items-center gap-3 rounded-3xl border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-8 py-6 text-center">
              <Lock className="h-5 w-5 text-[#a78bfa]" />
              <p className="text-sm text-muted-foreground">
                Purchase this pack to unlock all prompts and copy them directly to your AI tools.
              </p>
              <button
                onClick={async () => {
                  if (!pack?.shopify_variant_id) return;
                  await cart.addItem(pack.shopify_variant_id, 1);
                  cart.openCart();
                }}
                className="ring-glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy pack — ${((pack.price_cents ?? 4900) / 100).toFixed(0)}
              </button>
            </div>
          )}
        </section>
        )}

        {!hidden.has("prompts") && (
        <section className="mx-auto mt-12 max-w-6xl space-y-16 px-6">
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass aspect-[4/3] animate-pulse rounded-3xl" />
              ))}
            </div>
          )}

          {cats?.map((c) => {
            const items = grouped.get(c.slug) ?? [];
            if (items.length === 0) return null;
            const accent = c.accent_color ?? "#a78bfa";
            return (
              <div key={c.id}>
                <div className="mb-5 flex items-end justify-between">
                  <h2 className="font-display text-2xl font-bold lowercase tracking-[-0.02em] sm:text-3xl">
                    <span className="mr-3 inline-block h-3 w-3 translate-y-[-3px] rounded-full" style={{ background: accent }} />
                    {c.name}
                  </h2>
                  <span className="font-mono text-xs text-muted-foreground">{items.length} prompts</span>
                </div>
                <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
                  {items.map((p) => <PromptCard key={p.id} p={p} accent={accent} isUnlocked={isUnlocked} pack={pack ?? null} />)}
                </div>
              </div>
            );
          })}

          {/* Uncategorized prompts (in case a prompt has no category) */}
          {(() => {
            const uncat = grouped.get("uncategorized") ?? [];
            if (uncat.length === 0) return null;
            return (
              <div>
                <div className="mb-5"><h2 className="font-display text-2xl font-bold lowercase">other</h2></div>
                <div className="grid gap-4 md:grid-cols-3">
                  {uncat.map((p) => <PromptCard key={p.id} p={p} accent="#a78bfa" isUnlocked={isUnlocked} pack={pack ?? null} />)}
                </div>
              </div>
            );
          })()}

          {!isLoading && prompts && prompts.length === 0 && (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
              No prompts in this pack yet.
            </div>
          )}
        </section>
        )}

        {!hidden.has("how_to") && (
        <section className="mx-auto mt-28 max-w-5xl px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold lowercase tracking-[-0.02em] sm:text-4xl">how to use</h2>
            <p className="mt-3 text-sm text-muted-foreground">Three steps from prompt to cinematic motion.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Sparkles, title: "Pick a prompt", desc: "Browse the prompts and copy the one you want." },
              { icon: UploadCloud, title: "Upload your frame", desc: "Drop your starting image into your AI video model of choice." },
              { icon: Play, title: "Generate motion", desc: "Paste, run, and refine until the transition lands." },
            ].map((s, i) => (
              <div key={s.title} className="glass rounded-3xl p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <s.icon className="h-5 w-5 text-[#a78bfa]" />
                </div>
                <div className="font-mono text-xs text-muted-foreground">Step {i + 1}</div>
                <h3 className="mt-1 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        <SiteFooter />
      </main>
    </>
  );
}

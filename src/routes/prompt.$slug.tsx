import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { usePrompt, usePrompts, useUserPurchases, usePackById } from "@/lib/queries";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Copy, Check, ArrowLeft, Play, ClipboardCheck, Lock, Plus } from "lucide-react";
import { toast } from "sonner";



export const Route = createFileRoute("/prompt/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Elite Visuals` },
      { name: "description", content: "Premium AI visual prompt with demo gallery and copy-ready prompt text." },
    ],
  }),
  component: PromptPage,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-muted-foreground">{error.message}</p>
        <Link to="/library" className="mt-4 inline-block text-sm underline">Back to library</Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="glass rounded-3xl p-10 text-center">
        <h1 className="font-display text-2xl">Prompt not found</h1>
        <Link to="/library" className="mt-4 inline-block text-sm underline">Back to library</Link>
      </div>
    </div>
  ),
});

function PromptPage() {
  const { slug } = Route.useParams();
  const { data: prompt, isLoading } = usePrompt(slug);
  const { data: allPrompts } = usePrompts();
  const { data: purchases } = useUserPurchases();
  const { data: pack } = usePackById(prompt?.pack_id ?? null);
  const { addItem } = useCart();
  const [copied, setCopied] = useState(false);
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [copyCount, setCopyCount] = useState<number | null>(null);

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="pt-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="glass h-[500px] animate-pulse rounded-3xl" />
          </div>
        </main>
      </>
    );
  }
  if (!prompt) throw notFound();

  const hero = activeImg ?? prompt.cover_image_url;
  const accent = prompt.categories?.accent_color ?? "#a78bfa";
  const displayedCount = copyCount ?? prompt.copy_count ?? 0;
  const demoIsImage = prompt.demo_video_url && /\.(gif|png|jpe?g|webp|avif)(\?|$)/i.test(prompt.demo_video_url);
  const more = (allPrompts ?? []).filter((p) => p.is_published && p.slug !== prompt.slug).slice(0, 8);
  const isUnlocked = !!(purchases?.hasMembership || (pack && purchases?.packIds.has(pack.id)));

  const copy = async () => {
    if (!isUnlocked) return;
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    const { data } = await supabase.rpc("increment_prompt_copy", { _slug: prompt.slug });
    if (typeof data === "number") setCopyCount(data);
    else setCopyCount((n) => (n ?? prompt.copy_count ?? 0) + 1);
    setTimeout(() => setCopied(false), 1800);
  };


  return (
    <>
      <SiteHeader />
      <main className="pt-28">
        <div className="mx-auto max-w-7xl px-6">
          <Link to="/library" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to library
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* LEFT: hero + gallery */}
            <div>
              <div className="glass relative overflow-hidden rounded-3xl">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  {prompt.demo_video_url && demoIsImage ? (
                    <img src={prompt.demo_video_url} alt={prompt.title} className="h-full w-full object-cover" />
                  ) : prompt.demo_video_url ? (
                    <video src={prompt.demo_video_url} controls autoPlay loop muted playsInline className="h-full w-full object-cover" />
                  ) : hero ? (
                    <img src={hero} alt={prompt.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ background: `radial-gradient(circle at 30% 30%, ${accent}55, transparent 60%), radial-gradient(circle at 70% 70%, #22d3ee35, transparent 60%), #14122a` }}>
                      <div className="grid h-full w-full place-items-center">
                        <div className="ring-glow grid h-20 w-20 place-items-center rounded-full bg-white/10 backdrop-blur"><Play className="h-7 w-7 translate-x-0.5" /></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {prompt.gallery_urls.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {(prompt.cover_image_url ? [prompt.cover_image_url, ...prompt.gallery_urls] : prompt.gallery_urls).map((u) => (
                    <button key={u} onClick={() => setActiveImg(u)} className={`glass overflow-hidden rounded-xl ${activeImg === u ? "ring-2 ring-primary" : ""}`}>
                      <img src={u} alt="" className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-8">
                <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
                  {prompt.categories?.name}
                </span>
                <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl text-gradient">{prompt.title}</h1>
                <p className="mt-4 max-w-2xl text-muted-foreground">{prompt.description}</p>
              </div>
            </div>

            {/* RIGHT: sticky prompt sidebar */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              {isUnlocked ? (
                <div className="glass-strong rounded-3xl p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Prompt</h2>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClipboardCheck className="h-3.5 w-3.5 text-[#a78bfa]" />
                        Copied <span className="font-mono text-foreground">{displayedCount.toLocaleString()}</span> {displayedCount === 1 ? "time" : "times"}
                      </div>
                    </div>
                    <button onClick={copy} className="ring-glow inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                      {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                    </button>
                  </div>
                  <pre className="mt-4 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-2xl bg-black/40 p-4 font-mono text-[13px] leading-relaxed text-foreground/90">
{prompt.prompt_text}
                  </pre>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Paste into any modern image or video model. Adjust subject, lens, and palette to taste.
                  </p>
                </div>
              ) : (
                <div className="glass-strong rounded-3xl p-6">
                  <Lock className="h-6 w-6 text-[#a78bfa]" />
                  <h2 className="mt-3 font-display text-xl font-semibold">Purchase to unlock</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Buy this pack to copy and use this prompt.</p>
                  {pack?.id && (
                    <button
                      disabled={buying}
                      onClick={async () => {
                        setBuying(true);
                        try { await startPackCheckout(pack.id); }
                        catch (err) { console.error(err); toast.error("Couldn't start checkout"); setBuying(false); }
                      }}
                      className="ring-glow mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      <Lock className="h-4 w-4" /> Buy pack — ${((pack.price_cents ?? 4900) / 100).toFixed(0)}
                    </button>
                  )}

                  <pre
                    aria-hidden
                    className="mt-4 max-h-[60vh] overflow-hidden whitespace-pre-wrap rounded-2xl bg-black/40 p-4 font-mono text-[13px] leading-relaxed text-foreground/90 select-none pointer-events-none"
                    style={{ filter: "blur(5px)" }}
                  >
{prompt.prompt_text}
                  </pre>
                </div>
              )}
            </aside>
          </div>




          {more.length > 0 && (
            <section className="mt-24">
              <div className="mb-6 flex items-end justify-between">
                <h2 className="font-display text-2xl font-bold lowercase tracking-[-0.02em] sm:text-3xl">keep browsing</h2>
                <Link to="/library" className="text-xs text-muted-foreground hover:text-foreground">All packs →</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {more.map((p) => {
                  const a = p.categories?.accent_color ?? "#a78bfa";
                  return (
                    <Link key={p.id} to="/prompt/$slug" params={{ slug: p.slug }} className="glass group block overflow-hidden rounded-2xl">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {p.cover_image_url ? (
                          <img src={p.cover_image_url} alt={p.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="h-full w-full" style={{ background: `radial-gradient(circle at 30% 30%, ${a}55, transparent 60%), #14122a` }} />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="truncate font-display text-sm font-semibold group-hover:text-[#a78bfa]">{p.title}</div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">{p.categories?.name ?? "Uncategorized"}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
        <SiteFooter />
      </main>
    </>
  );
}

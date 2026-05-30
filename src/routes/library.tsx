import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useCategories, usePrompts, useSiteContent, sc } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Sparkles, UploadCloud, Play, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const search = z.object({ category: z.string().optional() });

export const Route = createFileRoute("/library")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Kinetic V1 Prompt Pack — Elite Visuals" },
      { name: "description", content: "20 cinematic AI prompts across Temporal, Particle, Fluid, and Energy motion styles." },
      { property: "og:title", content: "Kinetic V1 Prompt Pack — Elite Visuals" },
      { property: "og:description", content: "20 curated AI visual prompts in 4 motion categories." },
    ],
  }),
  component: LibraryPage,
});

type PromptRow = {
  id: string; slug: string; title: string; description: string | null;
  prompt_text: string; cover_image_url: string | null;
  categories: { slug: string; name: string; accent_color: string | null };
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

function PromptCard({ p, accent }: { p: PromptRow; accent: string }) {
  return (
    <div className="glass group relative w-[78vw] shrink-0 snap-start overflow-hidden rounded-3xl sm:w-[55vw] md:w-auto md:shrink">
      <CopyButton slug={p.slug} text={p.prompt_text} />
      <Link to="/prompt/$slug" params={{ slug: p.slug }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          {p.cover_image_url ? (
            <img
              src={p.cover_image_url}
              alt={p.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${accent}55, transparent 60%), radial-gradient(circle at 70% 70%, #22d3ee35, transparent 60%), #1a1830`,
              }}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
      </Link>
      <div className="p-5">
        <Link
          to="/prompt/$slug"
          params={{ slug: p.slug }}
          className="font-display text-lg font-semibold hover:text-[#a78bfa] focus:outline-none"
        >
          {p.title}
        </Link>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
      </div>
    </div>
  );
}

function LibraryPage() {
  const { category } = Route.useSearch();
  const { data: cats } = useCategories();
  const { data: prompts, isLoading } = usePrompts();
  const { data: site } = useSiteContent();
  const heroImage = sc(site, "library", "hero_image", "");

  const grouped = useMemo(() => {
    const map = new Map<string, PromptRow[]>();
    prompts?.forEach((p) => {
      const key = p.categories.slug;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p as unknown as PromptRow);
    });
    return map;
  }, [prompts]);

  const visibleCats = category ? cats?.filter((c) => c.slug === category) : cats;

  return (
    <>
      <SiteHeader />
      <main className="pt-28">
        {/* HERO */}
        <section className="mx-auto max-w-5xl px-6 text-center">
          <div className="mx-auto mb-8 aspect-square w-40 overflow-hidden rounded-3xl glass sm:w-52">
            {heroImage ? (
              <img src={heroImage} alt="Kinetic V1 Prompt Pack" className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(167,139,250,0.55), transparent 60%), radial-gradient(circle at 70% 70%, rgba(34,211,238,0.45), transparent 60%), #0f0c1f",
                }}
              />
            )}
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
            <span className="bg-gradient-to-br from-[#f0f0f8] via-[#f0f0f8] to-[#a78bfa] bg-clip-text text-transparent">
              Kinetic V1 Prompt Pack
            </span>
          </h1>
          <div className="mt-3 inline-block rounded-md border border-[rgba(124,92,252,0.25)] bg-[rgba(124,92,252,0.10)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#a78bfa]">
            EVKT1
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Twenty cinematic prompts across four motion styles — temporal, particle, fluid, and energy.
            Paste into any modern AI video model to turn a still frame into a kinetic shot.
          </p>
        </section>


        {/* FILTERS — compact */}
        <section className="mx-auto mt-10 max-w-6xl px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Filter
            </span>
            <Link
              to="/library"
              className={`glass rounded-full px-3 py-1 text-xs transition-colors ${!category ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              All
            </Link>
            {cats?.map((c) => (
              <Link
                key={c.id}
                to="/library"
                search={{ category: c.slug }}
                className={`glass inline-flex items-center rounded-full px-3 py-1 text-xs transition-colors ${category === c.slug ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: c.accent_color ?? "#a78bfa" }}
                />
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* CATEGORY SECTIONS */}
        <section className="mx-auto mt-12 max-w-6xl space-y-16 px-6">
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass aspect-[4/3] animate-pulse rounded-3xl" />
              ))}
            </div>
          )}

          {visibleCats?.map((c) => {
            const items = grouped.get(c.slug) ?? [];
            if (items.length === 0) return null;
            const accent = c.accent_color ?? "#a78bfa";
            return (
              <div key={c.id}>
                <div className="mb-5 flex items-end justify-between">
                  <h2 className="font-display text-2xl font-bold lowercase tracking-[-0.02em] sm:text-3xl">
                    <span
                      className="mr-3 inline-block h-3 w-3 translate-y-[-3px] rounded-full"
                      style={{ background: accent }}
                    />
                    {c.name}
                  </h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    {items.length} prompts
                  </span>
                </div>

                {/* Swipe on mobile/tablet, grid on desktop */}
                <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
                  {items.map((p) => (
                    <PromptCard key={p.id} p={p} accent={accent} />
                  ))}
                </div>
              </div>
            );
          })}

          {prompts && prompts.length === 0 && (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
              No prompts yet.
            </div>
          )}
        </section>

        {/* HOW TO USE */}
        <section className="mx-auto mt-28 max-w-5xl px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold lowercase tracking-[-0.02em] sm:text-4xl">
              how to use
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Three steps from prompt to cinematic motion.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Sparkles, title: "Pick a prompt", desc: "Browse 20 prompts across 4 motion categories and copy the one you want." },
              { icon: UploadCloud, title: "Upload your frame", desc: "Drop your starting image into your AI video model of choice." },
              { icon: Play, title: "Generate motion", desc: "Paste, run, and refine until the transition lands the way you want." },
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

        <SiteFooter />
      </main>
    </>
  );
}

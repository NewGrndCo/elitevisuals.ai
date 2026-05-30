import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useCategories, usePrompts } from "@/lib/queries";
import { z } from "zod";

const search = z.object({ category: z.string().optional() });

export const Route = createFileRoute("/library")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Prompt Library — Elite Visuals" },
      { name: "description", content: "Browse 20 cinematic AI prompts across Temporal, Particle, Fluid, and Energy categories." },
      { property: "og:title", content: "Prompt Library — Elite Visuals" },
      { property: "og:description", content: "20 curated AI visual prompts in 4 categories." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { category } = Route.useSearch();
  const { data: cats } = useCategories();
  const { data: prompts, isLoading } = usePrompts(category);

  return (
    <>
      <SiteHeader />
      <main className="pt-28">
        <section className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <span className="font-mono text-xs text-muted-foreground">/library</span>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-6xl text-gradient">The Library</h1>
            <p className="mt-4 text-muted-foreground">Twenty hand-tuned prompts across four signature categories. Click any card to copy.</p>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            <Link to="/library" className={`glass rounded-full px-4 py-2 text-sm transition-colors ${!category ? "bg-white/15" : "hover:bg-white/10"}`}>All</Link>
            {cats?.map((c) => (
              <Link key={c.id} to="/library" search={{ category: c.slug }} className={`glass rounded-full px-4 py-2 text-sm transition-colors ${category === c.slug ? "bg-white/15" : "hover:bg-white/10"}`}>
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: c.accent_color ?? "#a78bfa" }} />
                {c.name}
              </Link>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass aspect-[4/3] animate-pulse rounded-3xl" />
            ))}
            {prompts?.map((p) => (
              <Link key={p.id} to="/prompt/$slug" params={{ slug: p.slug }} className="glass group overflow-hidden rounded-3xl transition-transform hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="h-full w-full" style={{ background: `radial-gradient(circle at 30% 30%, ${p.categories.accent_color ?? "#a78bfa"}55, transparent 60%), radial-gradient(circle at 70% 70%, #22d3ee35, transparent 60%), #1a1830` }} />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute left-3 top-3 glass rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider">{p.categories.name}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                </div>
              </Link>
            ))}
            {prompts && prompts.length === 0 && (
              <div className="glass col-span-full rounded-3xl p-10 text-center text-muted-foreground">No prompts in this category yet.</div>
            )}
          </div>
        </section>
        <SiteFooter />
      </main>
    </>
  );
}

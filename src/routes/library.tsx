import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { usePacks, usePrompts, useSiteContent, sc, type Pack } from "@/lib/queries";
import { useCart } from "@/lib/cart-context";
import { useMemo } from "react";
import { ArrowRight, Plus } from "lucide-react";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Prompt Pack Library — Elite Visuals" },
      { name: "description", content: "Browse all Elite Visuals prompt packs — cinematic AI prompts for modern video models." },
      { property: "og:title", content: "Prompt Pack Library — Elite Visuals" },
      { property: "og:description", content: "Browse all Elite Visuals prompt packs." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { data: packs, isLoading } = usePacks();
  const { data: prompts } = usePrompts();
  const { data: site } = useSiteContent();

  const heroImage = sc(site, "library", "hero_image", "");
  const title = sc(site, "library", "title", "Prompt Packs");
  const description = sc(site, "library", "description", "Curated collections of cinematic AI prompts. Pick a pack to explore its prompts.");

  const countsByPack = useMemo(() => {
    const m = new Map<string, number>();
    (prompts ?? []).forEach((p) => {
      if (!p.pack_id) return;
      m.set(p.pack_id, (m.get(p.pack_id) ?? 0) + 1);
    });
    return m;
  }, [prompts]);

  return (
    <>
      <SiteHeader />
      <main className="pt-28">
        <section className="mx-auto max-w-5xl px-6 text-center">
          {heroImage && (
            <div className="mx-auto mb-8 max-w-3xl overflow-hidden rounded-3xl border border-border/60">
              <img src={heroImage} alt="" className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
            </div>
          )}
          <div className="mb-4 inline-block rounded-md border border-[rgba(124,92,252,0.25)] bg-[rgba(124,92,252,0.10)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#a78bfa]">
            Library
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
            <span className="bg-gradient-to-br from-[#f0f0f8] via-[#f0f0f8] to-[#a78bfa] bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            {description}
          </p>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-6">
          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass aspect-[4/5] animate-pulse rounded-3xl" />
              ))}
            </div>
          )}

          {!isLoading && (packs?.length ?? 0) === 0 && (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
              No packs yet. Check back soon.
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packs?.map((p) => {
              const count = countsByPack.get(p.id) ?? 0;
              return <PackCard key={p.id} pack={p} count={count} />;
            })}
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}

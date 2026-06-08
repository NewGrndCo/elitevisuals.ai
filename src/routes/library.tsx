import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { usePacks, usePrompts } from "@/lib/queries";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

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
          <div className="mb-4 inline-block rounded-md border border-[rgba(124,92,252,0.25)] bg-[rgba(124,92,252,0.10)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#a78bfa]">
            Library
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
            <span className="bg-gradient-to-br from-[#f0f0f8] via-[#f0f0f8] to-[#a78bfa] bg-clip-text text-transparent">
              Prompt Packs
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Curated collections of cinematic AI prompts. Pick a pack to explore its prompts.
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
              return (
                <Link
                  key={p.id}
                  to="/pack/$slug"
                  params={{ slug: p.slug }}
                  className="glass group relative flex flex-col overflow-hidden rounded-3xl transition-all hover:-translate-y-1 hover:border-[rgba(124,92,252,0.35)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="h-full w-full" style={{
                        background: "radial-gradient(circle at 30% 30%, rgba(167,139,250,0.55), transparent 60%), radial-gradient(circle at 70% 70%, rgba(34,211,238,0.45), transparent 60%), #0f0c1f",
                      }} />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/90 backdrop-blur">
                      {count} prompts
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-xl font-bold tracking-[-0.02em]">{p.title}</h2>
                    {p.description && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                    )}
                    <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#a78bfa]">
                      Explore pack <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}

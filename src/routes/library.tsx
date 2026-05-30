import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useCategories, usePrompts } from "@/lib/queries";
import { z } from "zod";
import { useMemo } from "react";
import { Sparkles, UploadCloud, Wand2, Play } from "lucide-react";

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

function WavyDivider() {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      className="mx-auto h-8 w-full max-w-3xl text-white/30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M0,20 Q50,0 100,20 T200,20 T300,20 T400,20 T500,20 T600,20 T700,20 T800,20 T900,20 T1000,20 T1100,20 T1200,20" />
    </svg>
  );
}

function LibraryPage() {
  const { category } = Route.useSearch();
  const { data: cats } = useCategories();
  const { data: prompts, isLoading } = usePrompts();

  const grouped = useMemo(() => {
    const map = new Map<string, typeof prompts>();
    prompts?.forEach((p) => {
      const key = p.categories.slug;
      if (!map.has(key)) map.set(key, [] as any);
      (map.get(key) as any).push(p);
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
          <div className="mx-auto mb-10 aspect-square w-44 overflow-hidden rounded-3xl glass sm:w-56">
            <div
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(167,139,250,0.55), transparent 60%), radial-gradient(circle at 70% 70%, rgba(34,211,238,0.45), transparent 60%), #0f0c1f",
              }}
            />
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
            <span className="bg-gradient-to-br from-[#f0f0f8] via-[#f0f0f8] to-[#a78bfa] bg-clip-text text-transparent">
              Kinetic V1 Prompt Pack
            </span>
          </h1>
          <div className="mt-3 inline-block rounded-md border border-[rgba(124,92,252,0.25)] bg-[rgba(124,92,252,0.10)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#a78bfa]">
            EVKT1
          </div>

          <div className="mt-8">
            <WavyDivider />
          </div>
        </section>

        {/* FILTERS */}
        <section className="mx-auto mt-12 max-w-6xl px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mr-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Filter
            </span>
            <Link
              to="/library"
              className={`glass rounded-full px-4 py-2 text-sm transition-colors ${!category ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              All
            </Link>
            {cats?.map((c) => (
              <Link
                key={c.id}
                to="/library"
                search={{ category: c.slug }}
                className={`glass rounded-full px-4 py-2 text-sm transition-colors ${category === c.slug ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ background: c.accent_color ?? "#a78bfa" }}
                />
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* CATEGORY SECTIONS */}
        <section className="mx-auto mt-14 max-w-6xl space-y-20 px-6">
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass aspect-[4/3] animate-pulse rounded-3xl" />
              ))}
            </div>
          )}

          {visibleCats?.map((c) => {
            const items = (grouped.get(c.slug) ?? []) as NonNullable<typeof prompts>;
            if (items.length === 0) return null;
            return (
              <div key={c.id}>
                <div className="mb-6 flex items-end justify-between">
                  <h2 className="font-display text-3xl font-bold lowercase tracking-[-0.02em] sm:text-4xl">
                    <span
                      className="mr-3 inline-block h-3 w-3 translate-y-[-4px] rounded-full"
                      style={{ background: c.accent_color ?? "#a78bfa" }}
                    />
                    {c.name}
                  </h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    {items.length} prompts
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      to="/prompt/$slug"
                      params={{ slug: p.slug }}
                      className="glass group overflow-hidden rounded-3xl transition-transform hover:-translate-y-1"
                    >
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
                              background: `radial-gradient(circle at 30% 30%, ${c.accent_color ?? "#a78bfa"}55, transparent 60%), radial-gradient(circle at 70% 70%, #22d3ee35, transparent 60%), #1a1830`,
                            }}
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                      </div>
                      <div className="p-5">
                        <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                    </Link>
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

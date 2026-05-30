import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useCategories, usePrompts } from "@/lib/queries";
import { ArrowRight, Play, Sparkles, Wand2, Layers, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elite Visuals — Premium AI Visual Prompts" },
      { name: "description", content: "Cinematic AI prompts for temporal, particle, fluid, and energy effects. Browse a curated library and copy production-ready prompts in one click." },
      { property: "og:title", content: "Elite Visuals" },
      { property: "og:description", content: "A curated library of premium AI visual prompts." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: cats } = useCategories();
  const { data: prompts } = usePrompts();
  const featured = prompts?.slice(0, 6) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="pt-28">
        {/* HERO */}
        <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-12">
          <div className="grid-mask absolute inset-x-0 top-0 -z-10 h-[600px]" />
          <div className="glass relative overflow-hidden rounded-[32px] p-10 sm:p-16 aurora-bg">
            <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[oklch(0.55_0.22_295/35%)] blur-3xl animate-float" />
            <div className="absolute bottom-0 left-12 h-72 w-72 rounded-full bg-[oklch(0.65_0.18_200/30%)] blur-3xl" />
            <div className="relative max-w-3xl">
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3 text-[var(--color-violet)]" /> 20 prompts · 4 categories · always evolving
              </span>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] sm:text-7xl">
                <span className="text-gradient">Prompts that render</span><br />
                like a film studio.
              </h1>
              <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
                Elite Visuals is a curated library of premium AI prompts engineered for cinematic temporal warps, particle storms, fluid sims, and pure energy. Every prompt is dialed in, copy-ready, and built for the dark.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/library" className="ring-glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
                  Explore the library <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#demo" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium hover:bg-white/10">
                  <Play className="h-4 w-4" /> Watch demo
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* DEMO VIDEO PLACEHOLDER */}
        <section id="demo" className="mx-auto max-w-6xl px-6">
          <div className="glass-strong relative overflow-hidden rounded-[28px] p-2">
            <div className="aspect-video w-full overflow-hidden rounded-[20px] bg-gradient-to-br from-[oklch(0.20_0.04_295)] via-[oklch(0.18_0.04_240)] to-[oklch(0.20_0.05_200)]">
              <div className="grid h-full w-full place-items-center">
                <div className="text-center">
                  <button className="ring-glow grid h-20 w-20 place-items-center rounded-full bg-white/10 backdrop-blur-xl transition-transform hover:scale-105">
                    <Play className="h-7 w-7 translate-x-0.5 text-white" />
                  </button>
                  <p className="mt-4 text-sm text-muted-foreground">Demo reel — drop your own video URL in admin</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto mt-24 max-w-6xl px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">Built for visual obsessives.</h2>
            <p className="mt-3 text-muted-foreground">Every prompt has been tested across modern image/video models. No filler. No fluff. Just frame-ready output.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Wand2, title: "Curated prompts", body: "20 hand-tuned prompts across 4 signature categories — temporal, particle, fluid, energy." },
              { icon: Layers, title: "Live gallery", body: "Each prompt page ships a hero demo, a gallery of stills, and one-click copy." },
              { icon: Zap, title: "Admin control", body: "Edit prompt text, swap cover media, manage categories — all from a frosted dashboard." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass rounded-3xl p-6 transition-colors hover:bg-white/[0.07]">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5"><Icon className="h-5 w-5 text-[var(--color-cyan)]" /></div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="mx-auto mt-24 max-w-6xl px-6">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-3xl font-semibold sm:text-4xl">Four signature categories</h2>
            <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground">Browse all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cats?.map((c) => (
              <Link key={c.id} to="/library" search={{ category: c.slug }} className="glass group relative overflow-hidden rounded-3xl p-6 transition-transform hover:-translate-y-1">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-60" style={{ background: c.accent_color ?? "#a78bfa" }} />
                <div className="relative">
                  <span className="font-mono text-xs text-muted-foreground">/{c.slug}</span>
                  <h3 className="mt-3 font-display text-2xl font-semibold">{c.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FEATURED PROMPTS */}
        <section className="mx-auto mt-24 max-w-6xl px-6">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-3xl font-semibold sm:text-4xl">Featured prompts</h2>
            <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground">All 20 →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <Link key={p.id} to="/prompt/$slug" params={{ slug: p.slug }} className="glass group overflow-hidden rounded-3xl transition-transform hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[oklch(0.25_0.05_295)] to-[oklch(0.20_0.04_240)]">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full" style={{ background: `radial-gradient(circle at 30% 30%, ${p.categories.accent_color ?? "#a78bfa"}40, transparent 60%), radial-gradient(circle at 70% 70%, #22d3ee30, transparent 60%)` }} />
                  )}
                  <span className="absolute left-3 top-3 glass rounded-full px-2.5 py-1 text-xs">{p.categories.name}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-24 max-w-6xl px-6">
          <div className="glass relative overflow-hidden rounded-[28px] p-10 text-center sm:p-16 aurora-bg">
            <h2 className="font-display text-3xl font-semibold sm:text-5xl text-gradient">Render your next masterpiece.</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Browse the full library, copy a prompt, paste, render. That's it.</p>
            <Link to="/library" className="ring-glow mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              Enter the library <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}

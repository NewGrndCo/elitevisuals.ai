import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useCategories, usePrompts, useAiLogos, useSiteContent, sc } from "@/lib/queries";
import { getSectionOrder } from "./admin";
import {
  ArrowRight, Play, Monitor, UploadCloud, CheckCircle2, Timer, Sparkles, Waves, Zap, Check,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elite Visuals — Premium AI Visual Prompts" },
      { name: "description", content: "20 curated image-to-video prompts across 4 motion styles. Cinematic transitions for modern AI video models." },
    ],
  }),
  component: HomePage,
});

const compatLogos = [
  { label: "Veo", short: "V", grad: "linear-gradient(135deg,#065f46,#10b981)" },
  { label: "Kling", short: "K", grad: "linear-gradient(135deg,#1e40af,#3b82f6)" },
  { label: "Seedance", short: "Sd", grad: "linear-gradient(135deg,#4c1d95,#8b5cf6)" },
  { label: "Runway", short: "RW", grad: "linear-gradient(135deg,#065f46,#34d399)" },
  { label: "Hailuo", short: "Hl", grad: "linear-gradient(135deg,#1d4ed8,#60a5fa)" },
  { label: "Pika", short: "Pi", grad: "linear-gradient(135deg,#7c3aed,#c084fc)" },
  { label: "Sora", short: "So", grad: "linear-gradient(135deg,#0f172a,#475569)" },
];

const STYLE_META: Record<string, { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; lang: string; tags: string[]; tint: string; tintBorder: string; tintText: string }> = {
  temporal: { icon: Timer,    lang: "Motion Language: Time",   tags: ["Time Distortion", "Speed Variation", "Temporal Loops", "Motion Echoes", "Time Reversal"], tint: "rgba(56,182,255,0.18)",  tintBorder: "rgba(56,182,255,0.25)",  tintText: "#7dd3fc" },
  particle: { icon: Sparkles, lang: "Motion Language: Matter", tags: ["Fragmentation", "Dissolution", "Reconstruction", "Dust Effects", "Sparks"],            tint: "rgba(251,146,60,0.15)",  tintBorder: "rgba(251,146,60,0.25)",  tintText: "#fbbf5a" },
  fluid:    { icon: Waves,    lang: "Motion Language: Flow",   tags: ["Liquid Motion", "Ink Effects", "Smoke Dynamics", "Organic Morphing", "Melting"],         tint: "rgba(52,211,153,0.15)",  tintBorder: "rgba(52,211,153,0.25)",  tintText: "#6ee7b7" },
  energy:   { icon: Zap,      lang: "Motion Language: Force",  tags: ["Electrical Effects", "Plasma Movement", "Light Trails", "Shockwaves", "Power Surges"],   tint: "rgba(251,113,133,0.15)", tintBorder: "rgba(251,113,133,0.25)", tintText: "#fca5a5" },
};

function HomePage() {
  const { data: cats } = useCategories();
  const { data: prompts } = usePrompts();
  const { data: aiLogos } = useAiLogos();
  const { data: site } = useSiteContent();
  const totalPrompts = prompts?.length ?? 20;
  const totalStyles = cats?.length ?? 4;
  const perStyle = totalStyles ? Math.round(totalPrompts / totalStyles) : 5;
  const publishedLogos = (aiLogos ?? []).filter((l) => l.is_published);

  const badge = sc(site, "hero", "badge", "EVKT1");
  const badgeLabel = sc(site, "hero", "badge_label", "Kinetic V1 Prompt Pack");
  const headline = sc(site, "hero", "headline", "The best AI transitions for video editors.");
  const subhead = sc(site, "hero", "subhead", `A curated library of ${totalPrompts} image-to-video prompts engineered to create cinematic motion and transformation effects across modern AI video generation platforms.`);
  const ctaPrimary = sc(site, "hero", "cta_primary", "Explore Prompts");
  const productImage = sc(site, "hero", "product_image", "");

  return (
    <>
      <SiteHeader />
      <main className="pt-16">
        {/* HERO */}
        <section className="flex min-h-[100vh] flex-col items-center justify-center px-6 pb-20 pt-32 text-center">
          <div className="mb-8 inline-flex items-center gap-3">
            <span className="rounded-md border border-[rgba(124,92,252,0.25)] bg-[rgba(124,92,252,0.10)] px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-[#a78bfa]">
              {badge}
            </span>
            <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/60" />
            <span className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {badgeLabel}
            </span>
          </div>

          <h1 className="mb-6 max-w-[860px] font-display text-[clamp(2.4rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">
            <span className="bg-gradient-to-br from-[#f0f0f8] via-[#f0f0f8] to-[#a78bfa] bg-clip-text text-transparent">
              {headline}
            </span>
          </h1>

          <p className="mb-10 max-w-[560px] text-[1.05rem] leading-[1.8] text-muted-foreground">
            {subhead}
          </p>

          <div className="mb-10 flex flex-wrap items-center justify-center gap-8">
            {[
              { num: String(totalPrompts), label: "Prompts" },
              { num: String(totalStyles),   label: "Motion Styles" },
              { num: String(perStyle),      label: "Prompts / Style" },
              { num: "6+",                  label: "AI Platforms" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-[1.6rem] font-extrabold tracking-[-0.04em] text-foreground">{s.num}</div>
                  <div className="mt-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{s.label}</div>
                </div>
                {i < arr.length - 1 && <div className="hidden h-9 w-px bg-border sm:block" />}
              </div>
            ))}
          </div>

          <Link
            to="/library"
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-9 py-3.5 text-base font-bold tracking-[-0.01em] text-primary-foreground shadow-[0_0_28px_rgba(124,92,252,0.35),0_0_60px_rgba(124,92,252,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(124,92,252,0.45),0_0_90px_rgba(124,92,252,0.25)]"
          >
            {ctaPrimary} <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </section>

        {/* DEMO REEL */}
        <section id="demo" className="mx-auto max-w-[1100px] px-6 py-28">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionTag>Demo Reel</SectionTag>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-[-0.03em]">From Static to Cinematic</h2>
            </div>
            <p className="max-w-[400px] text-[0.95rem] leading-[1.75] text-muted-foreground">
              Witness the capabilities of our AI motion prompts. See real-world examples of how these transitions elevate standard editing workflows.
            </p>
          </div>
          <DemoPlayer />
        </section>

        <SectionDivider />

        {/* COMPAT CAROUSEL */}
        <section className="overflow-hidden px-6 py-16 text-center">
          <div
            className="overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            }}
          >
            <div className="flex w-max animate-[marquee_24s_linear_infinite] gap-4 hover:[animation-play-state:paused]">
              {publishedLogos.length > 0
                ? [...publishedLogos, ...publishedLogos].map((l, i) => (
                    <a
                      key={`${l.id}-${i}`}
                      href={l.link_url ?? "#"}
                      target={l.link_url ? "_blank" : undefined}
                      rel="noreferrer"
                      className="glass flex h-[60px] flex-shrink-0 items-center justify-center rounded-[10px] px-6 transition-colors hover:border-[rgba(124,92,252,0.3)]"
                    >
                      <img src={l.logo_url} alt={l.name} className="h-7 w-auto max-w-[120px] object-contain opacity-80 transition-opacity hover:opacity-100" draggable={false} />
                    </a>
                  ))
                : [...compatLogos, ...compatLogos].map((l, i) => (
                    <div key={i} className="glass flex flex-shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[8px] px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-[rgba(124,92,252,0.3)] hover:text-foreground">
                      <span className="grid h-[26px] w-[26px] place-items-center rounded-[5px] text-[0.6rem] font-black text-white" style={{ background: l.grad }}>{l.short}</span>
                      {l.label}
                    </div>
                  ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* HOW TO USE — Workflow */}
        <section id="how-to" className="mx-auto max-w-[1100px] px-6 py-28">
          <div className="mb-2 flex flex-col items-center text-center">
            <SectionTag>Workflow</SectionTag>
            <SectionTitle>Unlock the power of your prompts<br />in three easy steps.</SectionTitle>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { n: "01", icon: Monitor,     t: "Extract Start & End Frames", b: "Use your preferred editing software to select and export the high-quality frames that define the beginning and end of your transition." },
              { n: "02", icon: UploadCloud, t: "Upload to Your AI Model",   b: "Input your selected start and end frames into your preferred AI image-to-video generator to set the foundation for the motion." },
              { n: "03", icon: CheckCircle2,t: "Apply Your Prompt",         b: "Copy and paste your chosen prompt from the pack into the model's text field to trigger the specific cinematic effect and generate your transition." },
            ].map(({ n, icon: Icon, t, b }) => (
              <div key={n} className="glass group relative overflow-hidden rounded-[14px] p-8 transition-all hover:-translate-y-1 hover:border-[rgba(124,92,252,0.28)]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(124,92,252,0.05),transparent_60%)]" />
                <div className="relative">
                  <div className="mb-5 text-[3.5rem] font-extrabold leading-none tracking-[-0.05em] text-[rgba(124,92,252,0.18)]">{n}</div>
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-[10px] border border-[rgba(124,92,252,0.2)] bg-[rgba(124,92,252,0.12)]">
                    <Icon className="h-[22px] w-[22px] text-[#a78bfa]" />
                  </div>
                  <h3 className="mb-2 text-[1.05rem] font-semibold tracking-[-0.01em]">{t}</h3>
                  <p className="text-sm leading-[1.7] text-muted-foreground">{b}</p>
                </div>
              </div>
            ))}
          </div>

          {/* MOTION STYLES — nested under Workflow */}
          <div id="styles" className="mt-24">
            <div className="mb-12 max-w-[520px]">
              <SectionTag>Motion Styles</SectionTag>
              <h2 className="mb-3 text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-[1.2] tracking-[-0.03em]">
                {totalStyles} distinct motion languages.
              </h2>
              <p className="mt-3 text-[0.95rem] leading-[1.75] text-muted-foreground">
                Elite Visuals is built around the concept of motion as transformation. Each style uses a specific motion language to evolve a still image into a dynamic cinematic sequence.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cats?.map((c) => {
                const meta = STYLE_META[c.slug] ?? STYLE_META.temporal;
                const Icon = meta.icon;
                const count = prompts?.filter((p) => p.category_id === c.id).length ?? 5;
                return (
                  <Link
                    key={c.id}
                    to="/library"
                    search={{ category: c.slug }}
                    className="glass group relative overflow-hidden rounded-[14px] p-7 transition-all hover:-translate-y-1"
                  >
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${meta.tint}, transparent 70%)` }}
                    />
                    <div className="absolute right-5 top-5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      {count} prompts
                    </div>
                    <div className="relative">
                      <div
                        className="mb-5 grid h-12 w-12 place-items-center rounded-[12px] border"
                        style={{ background: meta.tint, borderColor: meta.tintBorder }}
                      >
                        <Icon className="h-5 w-5" style={{ color: meta.tintText }} />
                      </div>
                      <h3 className="mb-1 text-base font-bold tracking-[-0.01em]">{c.name}</h3>
                      <div className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em]" style={{ color: meta.tintText }}>{meta.lang}</div>
                      <p className="mb-5 text-[0.825rem] leading-[1.65] text-muted-foreground">{c.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-[4px] border px-2 py-0.5 text-[0.68rem] font-semibold tracking-[0.04em]"
                            style={{ background: meta.tint, borderColor: meta.tintBorder, color: meta.tintText }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>


        <SectionDivider />

        {/* PRICING — split layout */}
        <section id="pricing" className="mx-auto max-w-[1100px] px-6 py-28">
          <div className="mb-14 text-center">
            <SectionTag>Pricing</SectionTag>
            <h2 className="mx-auto max-w-[480px] text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-[-0.03em]">
              Invest in your creativity.
            </h2>
            <p className="mb-0 mt-3 text-base text-muted-foreground">
              Gain access to the Elite Visuals prompt pack library.
            </p>
          </div>

          <div className="glass relative mx-auto flex max-w-[960px] flex-col overflow-hidden rounded-[14px] lg:flex-row">
            <div className="pointer-events-none absolute -top-16 left-1/2 h-[220px] w-[320px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(124,92,252,0.18),transparent_70%)]" />

            {/* Left: Content */}
            <div className="relative flex flex-1 flex-col justify-center p-8 sm:p-10 lg:p-12">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#a78bfa]">EVKT1: Kinetic V1</div>
                  <div className="mt-1 text-[0.8rem] text-muted-foreground">Lifetime access · One-time payment</div>
                </div>
                <div className="rounded-full border border-[rgba(124,92,252,0.25)] bg-[rgba(124,92,252,0.12)] px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[#a78bfa]">
                  {totalPrompts} Prompts
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="mt-2 text-2xl font-semibold text-muted-foreground">$</span>
                <span className="text-[4rem] font-extrabold leading-none tracking-[-0.06em]">49</span>
              </div>
              <p className="mb-8 mt-1 text-[0.8rem] text-muted-foreground">One-time purchase. Instant digital delivery.</p>

              <ul className="mb-8 flex flex-col gap-3">
                {[
                  `${totalPrompts} curated image-to-video transition prompts`,
                  `${totalStyles} motion styles: Temporal, Particle, Fluid, Energy`,
                  "Compatible with Veo, Kling, Seedance, Runway, Hailuo & more",
                  "Beginner to advanced skill level",
                  "Copy-and-paste format — no technical setup required",
                  "Commercial use license included",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-full border border-[rgba(124,92,252,0.25)] bg-[rgba(124,92,252,0.15)]">
                      <Check className="h-2.5 w-2.5 text-[#a78bfa]" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/library"
                className="block w-full rounded-[10px] bg-primary py-3.5 text-center text-base font-bold tracking-[-0.01em] text-primary-foreground shadow-[0_0_36px_rgba(124,92,252,0.35),0_0_80px_rgba(124,92,252,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_50px_rgba(124,92,252,0.45),0_0_110px_rgba(124,92,252,0.25)]"
              >
                Browse Library
              </Link>
              <p className="mt-4 text-center text-[0.73rem] text-muted-foreground">
                Secure checkout · Instant delivery · 30-day refund guarantee
              </p>
            </div>

            {/* Right: Image */}
            <div className="relative min-h-[280px] flex-1 overflow-hidden border-t border-border lg:min-h-0 lg:border-l lg:border-t-0">
              {productImage ? (
                <img src={productImage} alt="Product preview" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(124,92,252,0.10),transparent_70%),linear-gradient(135deg,rgba(124,92,252,0.05),rgba(56,182,255,0.05))]" />
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 p-8">
                    <div className="grid h-20 w-20 place-items-center rounded-[18px] border border-[rgba(124,92,252,0.25)] bg-[rgba(124,92,252,0.12)] shadow-[0_0_30px_rgba(124,92,252,0.15)]">
                      <Sparkles className="h-9 w-9 text-[#a78bfa]" />
                    </div>
                    <p className="max-w-[260px] text-center text-xs text-muted-foreground/60">
                      Upload a product preview image from the Admin → Landing page tab.
                    </p>
                  </div>
                </>
              )}
            </div>

          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 inline-block text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#a78bfa]">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-16 text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-[-0.03em]">
      {children}
    </h2>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto h-px max-w-[1100px] bg-gradient-to-r from-transparent via-border to-transparent" />
  );
}

function DemoPlayer() {
  const TOTAL = 167;
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    tickRef.current = window.setInterval(() => {
      setElapsed((e) => {
        const next = Math.min(e + 0.25, TOTAL);
        if (next >= TOTAL) setPlaying(false);
        return next;
      });
    }, 250);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [playing]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div
      onClick={() => setPlaying((p) => !p)}
      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-[14px] border border-border bg-[oklch(0.18_0.03_270)] transition-colors hover:border-[rgba(124,92,252,0.3)]"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.008) 0px, transparent 1px, transparent 4px), radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,92,252,0.07), transparent 70%)",
        }}
      />
      <div className="absolute left-6 top-5 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        Elite Visuals Demo Reel — All 4 Styles
      </div>
      <div className={`absolute inset-0 grid place-items-center transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
        <div className="grid h-[72px] w-[72px] place-items-center rounded-full border-[1.5px] border-[rgba(124,92,252,0.4)] bg-[rgba(124,92,252,0.15)] shadow-[0_0_30px_rgba(124,92,252,0.2)] backdrop-blur-md transition-transform hover:scale-110">
          <Play className="ml-1 h-7 w-7 text-white" fill="currentColor" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 bg-gradient-to-t from-black/90 to-transparent px-6 py-4">
        <span className="whitespace-nowrap text-[0.7rem] font-medium text-muted-foreground">{fmt(elapsed)} / {fmt(TOTAL)}</span>
        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#a78bfa] transition-[width]" style={{ width: `${(elapsed / TOTAL) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

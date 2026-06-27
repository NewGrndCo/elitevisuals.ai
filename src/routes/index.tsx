import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useCategories, usePrompts, useAiLogos, useSiteContent, usePacks, sc } from "@/lib/queries";
import { useCart } from "@/lib/cart-context";
import { getSectionOrder } from "@/lib/sections";
import {
  ArrowRight, Play, Monitor, UploadCloud, CheckCircle2, Timer, Sparkles, Waves, Zap, Check, Plus,
} from "lucide-react";
import { useRef, useState } from "react";

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
  const { data: packs } = usePacks();
  const { addItem } = useCart();
  const featuredPack = packs?.[0];
  const totalPrompts = prompts?.length ?? 20;
  const totalStyles = cats?.length ?? 4;
  
  const publishedLogos = (aiLogos ?? []).filter((l) => l.is_published);

  const badge = sc(site, "hero", "badge", "EVKT1");
  const badgeLabel = sc(site, "hero", "badge_label", "Kinetic V1 Prompt Pack");
  const headline = sc(site, "hero", "headline", "The best AI transitions for video editors.");
  const subhead = sc(site, "hero", "subhead", `A curated library of ${totalPrompts} image-to-video prompts engineered to create cinematic motion and transformation effects across modern AI video generation platforms.`);
  const ctaPrimary = sc(site, "hero", "cta_primary", "Explore Prompts");
  const productImage = sc(site, "hero", "product_image", "");
  const heroBg = sc(site, "hero", "background_image", "");

  return (
    <>
      <SiteHeader />
      <main className="pt-16">
        {/* HERO */}
        <section className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-32 text-center">
          {heroBg && (
            <>
              <img src={heroBg} alt="" aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background" />
            </>
          )}
          <div
            className="pointer-events-none absolute inset-0 -z-10 animate-hero-breathe opacity-60"
            style={{
              background: `radial-gradient(circle at 20% 20%, oklch(0.55 0.22 295 / 40%), transparent 55%),
                           radial-gradient(circle at 80% 20%, oklch(0.65 0.18 200 / 35%), transparent 55%),
                           radial-gradient(circle at 50% 90%, oklch(0.50 0.18 240 / 35%), transparent 60%)`,
            }}
          />
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

          {/* AI Logos carousel — part of the hero */}
          <div className="relative z-10 mt-20 w-full max-w-[1100px]">
            {sc(site, "compat", "description", "") && (
              <p className="mb-6 text-center text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {sc(site, "compat", "description", "")}
              </p>
            )}
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
          </div>
        </section>

        {(() => {
          const sectionOrder = getSectionOrder(site);

          const demoSection = (
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
              <DemoPlayer
                videoUrl={sc(site, "demo", "video_url", "")}
                poster={sc(site, "demo", "poster_image", "")}
                caption={sc(site, "demo", "caption", "Elite Visuals Demo Reel — All 4 Styles")}
              />
            </section>
          );


          const workflowSection = (
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
          );

          const packPriceCents = featuredPack?.price_cents ?? 4900;
          const packPriceDollars = Math.round(packPriceCents / 100);
          const packId = featuredPack?.id ?? null;

          const memPriceCents = Number(sc(site, "pricing", "membership_price_cents", "9900")) || 9900;
          const memPriceDollars = Math.round(memPriceCents / 100);
          const memLabel = sc(site, "pricing", "membership_label", "All-Access Membership");
          const memFeaturesRaw = sc(
            site,
            "pricing",
            "membership_features",
            "Every current pack\nEvery future drop\nPriority support\nCommercial license",
          );
          const memFeatures = memFeaturesRaw.split("\n").map((s) => s.trim()).filter(Boolean);
          const memVariant = sc(site, "pricing", "membership_shopify_variant_id", "");

          const handleAddPack = () => {
            if (!packId || !featuredPack) return;
            addItem({
              id: `pack:${packId}`,
              kind: "pack",
              packId,
              title: featuredPack.title ?? "Prompt Pack",
              priceCents: packPriceCents,
              image: featuredPack.cover_image_url ?? null,
            });
          };
          const handleAddMembership = () => {
            addItem({
              id: "membership",
              kind: "membership",
              title: memLabel,
              priceCents: memPriceCents,
            });
          };



          const pricingSection = (
            <section id="pricing" className="mx-auto max-w-[1200px] px-6 py-28">
              <div className="mb-14 text-center">
                <SectionTag>Pricing</SectionTag>
                <h2 className="mx-auto max-w-[480px] text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold leading-[1.2] tracking-[-0.03em]">
                  Invest in your creativity.
                </h2>
                <p className="mb-0 mt-3 text-base text-muted-foreground">
                  Gain access to the Elite Visuals prompt pack library.
                </p>
              </div>

              <div className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-2">
                {/* Pack card */}
                <div className="glass relative flex flex-col overflow-hidden rounded-[14px]">
                  <div className="pointer-events-none absolute -top-16 left-1/2 h-[220px] w-[320px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(124,92,252,0.18),transparent_70%)]" />
                  <div className="relative flex flex-1 flex-col p-8 sm:p-10">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#a78bfa]">
                          {featuredPack?.title ?? "EVKT1: Kinetic V1"}
                        </div>
                        <div className="mt-1 text-[0.8rem] text-muted-foreground">Lifetime access · One-time payment</div>
                      </div>
                      <div className="rounded-full border border-[rgba(124,92,252,0.25)] bg-[rgba(124,92,252,0.12)] px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[#a78bfa]">
                        {totalPrompts} Prompts
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="mt-2 text-2xl font-semibold text-muted-foreground">$</span>
                      <span className="text-[4rem] font-extrabold leading-none tracking-[-0.06em]">{packPriceDollars}</span>
                    </div>
                    <p className="mb-8 mt-1 text-[0.8rem] text-muted-foreground">One-time purchase. Instant digital delivery.</p>
                    <ul className="mb-8 flex flex-col gap-3">
                      {[
                        `${totalPrompts} curated image-to-video transition prompts`,
                        `${totalStyles} motion styles: Temporal, Particle, Fluid, Energy`,
                        "Compatible with Veo, Kling, Seedance, Runway, Hailuo & more",
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
                    <button
                      onClick={handleAddPack}
                      disabled={!packId}
                      className="ring-glow inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" /> {packId ? "Add to cart" : "Coming soon"}
                    </button>

                    <p className="mt-4 text-center text-[0.73rem] text-muted-foreground">
                      Secure checkout · Instant delivery · 30-day refund guarantee
                    </p>
                  </div>
                </div>

                {/* Membership card */}
                <div className="glass relative flex flex-col overflow-hidden rounded-[14px] border-[rgba(56,182,255,0.25)]">
                  <div className="pointer-events-none absolute -top-16 left-1/2 h-[220px] w-[320px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(56,182,255,0.20),transparent_70%)]" />
                  <div className="relative flex flex-1 flex-col p-8 sm:p-10">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#7dd3fc]">
                          {memLabel}
                        </div>
                        <div className="mt-1 text-[0.8rem] text-muted-foreground">Unlock every pack · Cancel anytime</div>
                      </div>
                      <div className="rounded-full border border-[rgba(56,182,255,0.3)] bg-[rgba(56,182,255,0.12)] px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[#7dd3fc]">
                        All Access
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="mt-2 text-2xl font-semibold text-muted-foreground">$</span>
                      <span className="text-[4rem] font-extrabold leading-none tracking-[-0.06em]">{memPriceDollars}</span>
                    </div>
                    <p className="mb-8 mt-1 text-[0.8rem] text-muted-foreground">Recurring · Every drop included.</p>
                    <ul className="mb-8 flex flex-col gap-3">
                      {memFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-full border border-[rgba(56,182,255,0.3)] bg-[rgba(56,182,255,0.15)]">
                            <Check className="h-2.5 w-2.5 text-[#7dd3fc]" strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleAddMembership}
                      disabled={!memVariant}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-[rgba(56,182,255,0.5)] bg-[rgba(56,182,255,0.12)] py-3.5 text-center text-base font-bold tracking-[-0.01em] text-[#bae6fd] shadow-[0_0_36px_rgba(56,182,255,0.25),0_0_80px_rgba(56,182,255,0.12)] transition-all hover:-translate-y-0.5 hover:bg-[rgba(56,182,255,0.18)] disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      <Plus className="h-4 w-4" /> {memVariant ? "Add membership" : "Coming soon"}
                    </button>
                    <p className="mt-4 text-center text-[0.73rem] text-muted-foreground">
                      Secure checkout via Shopify
                    </p>
                  </div>
                </div>
              </div>

              {productImage && (
                <div className="mx-auto mt-10 max-w-[1100px] overflow-hidden rounded-[14px] border border-border">
                  <img src={productImage} alt="Product preview" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </div>
              )}
            </section>
          );

          const sectionMap: Record<string, React.ReactNode> = {
            demo: demoSection,
            
            workflow: workflowSection,
            pricing: pricingSection,
          };

          return sectionOrder.map((id, i) => (
            <div key={id}>
              {i > 0 && <SectionDivider />}
              {sectionMap[id]}
            </div>
          ));
        })()}

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

function DemoPlayer({ videoUrl, poster, caption }: { videoUrl: string; poster: string; caption: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) { setPlaying((p) => !p); return; }
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const isImage = /\.(gif|png|jpe?g|webp|avif)(\?|$)/i.test(videoUrl);

  return (
    <div
      onClick={toggle}
      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-[14px] border border-border bg-[oklch(0.18_0.03_270)] transition-colors hover:border-[rgba(124,92,252,0.3)]"
    >
      {videoUrl && isImage ? (
        <img src={videoUrl} alt="Demo reel" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster || undefined}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      ) : poster ? (
        <img src={poster} alt="Demo reel poster" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.008) 0px, transparent 1px, transparent 4px), radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,92,252,0.07), transparent 70%)",
          }}
        />
      )}
      <div className="absolute left-6 top-5 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        {caption}
      </div>
      {!isImage && (
        <div className={`absolute inset-0 grid place-items-center transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
          <div className="grid h-[72px] w-[72px] place-items-center rounded-full border-[1.5px] border-[rgba(124,92,252,0.4)] bg-[rgba(124,92,252,0.15)] shadow-[0_0_30px_rgba(124,92,252,0.2)] backdrop-blur-md transition-transform hover:scale-110">
            <Play className="ml-1 h-7 w-7 text-white" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Copy, Download, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  aiLogosOptions,
  packsOptions,
  promptsOptions,
  siteContentOptions,
  useAiLogos,
  usePacks,
  usePrompts,
  useSiteContent,
  sc,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Elite Visuals — AI Prompt Library" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteContentOptions()),
      context.queryClient.ensureQueryData(aiLogosOptions()),
      context.queryClient.ensureQueryData(packsOptions()),
      context.queryClient.ensureQueryData(promptsOptions()),
    ]);
  },
  component: HomePage,
});

function HomePage() {
  const { data: prompts = [] } = usePrompts();
  const { data: packs = [] } = usePacks();
  const { data: logos = [] } = useAiLogos();
  const { data: site } = useSiteContent();
  const featured = prompts.slice(0, 10);
  const runway = [...featured.slice(0, 7), ...featured.slice(0, 7)];
  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden pt-24">
        <section className="mx-auto max-w-[1500px] px-4 pb-16 pt-14 text-center sm:px-7 sm:pt-24">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-primary">
            The visual prompt library
          </p>
          <h1 className="mx-auto max-w-4xl text-balance font-display text-[clamp(3.2rem,8vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.075em] text-foreground">
            Create beyond <span className="text-primary">ordinary.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
            {sc(
              site,
              "hero",
              "subhead",
              "Discover cinematic AI prompts, visual recipes, and downloadable creative skills built to move ideas faster.",
            )}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/library" className="ev-button ev-button-primary">
              Explore prompts <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/skills" className="ev-button ev-button-secondary">
              Download skills <Download className="h-4 w-4" />
            </Link>
          </div>
        </section>
        <section aria-label="Featured visual prompts" className="pb-24">
          <div className="ev-runway">
            <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-3 px-3 hover:[animation-play-state:paused]">
              {runway.length
                ? runway.map((prompt, index) => (
                    <Link
                      key={`${prompt.id}-${index}`}
                      to="/prompt/$slug"
                      params={{ slug: prompt.slug }}
                      className="group relative h-[380px] w-[270px] shrink-0 overflow-hidden rounded-[24px] bg-[#e9e4f5] sm:h-[470px] sm:w-[335px]"
                    >
                      {prompt.cover_image_url ? (
                        <img
                          src={prompt.cover_image_url}
                          alt={prompt.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <FallbackArt index={index} />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-20 text-left text-white">
                        <p className="text-sm font-semibold">{prompt.title}</p>
                        <p className="mt-1 text-xs text-white/70">View prompt</p>
                      </div>
                    </Link>
                  ))
                : Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[380px] w-[270px] shrink-0 overflow-hidden rounded-[24px] sm:h-[470px] sm:w-[335px]"
                    >
                      <FallbackArt index={i} />
                    </div>
                  ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-[1500px] px-4 py-14 sm:px-7 sm:py-24">
          <div className="mb-9 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Prompt library
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Find your next visual.
              </h2>
            </div>
            <Link to="/library" className="hidden items-center gap-2 text-sm font-semibold sm:flex">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {featured.map((prompt, index) => (
              <Link
                key={prompt.id}
                to="/prompt/$slug"
                params={{ slug: prompt.slug }}
                className="group"
              >
                <div className="aspect-[4/5] overflow-hidden rounded-[18px] bg-[#eeeaf6]">
                  {prompt.cover_image_url ? (
                    <img
                      src={prompt.cover_image_url}
                      alt={prompt.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <FallbackArt index={index} />
                  )}
                </div>
                <p className="mt-3 line-clamp-1 text-sm font-semibold">{prompt.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Copy className="h-3 w-3" /> {prompt.copy_count ?? 0} uses
                </p>
              </Link>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-[1500px] px-4 py-20 sm:px-7">
          <div className="rounded-[34px] bg-primary px-6 py-16 text-center text-white sm:px-12 sm:py-24">
            <Sparkles className="mx-auto h-7 w-7" />
            <h2 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              Prompts are the idea. Skills are the system.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/75">
              Install complete EliteVisuals workflows as ZIP packages and keep every creative system
              ready inside your AI workspace.
            </p>
            <Link to="/skills" className="ev-button mt-8 bg-white text-primary">
              Browse downloadable skills <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
        {(packs.length > 0 || logos.length > 0) && (
          <section className="mx-auto max-w-[1500px] px-4 py-16 sm:px-7">
            <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Works with your favorite creative AI tools
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {logos
                .filter((l) => l.is_published)
                .map((l) => (
                  <div
                    key={l.id}
                    className="rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold"
                  >
                    {l.name}
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

function FallbackArt({ index }: { index: number }) {
  const gradients = [
    "linear-gradient(145deg,#201044 0%,#7c3aed 45%,#e9d5ff 100%)",
    "radial-gradient(circle at 70% 20%,#fff 0 8%,transparent 9%),linear-gradient(155deg,#6d28d9,#c084fc 55%,#171027)",
    "linear-gradient(35deg,#140b2d,#9333ea 48%,#f5f3ff)",
    "radial-gradient(circle at 30% 35%,#ddd6fe,transparent 24%),linear-gradient(160deg,#2e1065,#a855f7,#faf5ff)",
  ];
  return (
    <div className="h-full w-full" style={{ background: gradients[index % gradients.length] }} />
  );
}

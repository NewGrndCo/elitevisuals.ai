import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Package } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { skillsOptions, useSkills } from "@/lib/queries";

export const Route = createFileRoute("/skills")({
  loader: ({ context }) => context.queryClient.ensureQueryData(skillsOptions()),
  head: () => ({ meta: [{ title: "AI Skills — Elite Visuals" }] }),
  component: SkillsPage,
});
function SkillsPage() {
  const { data = [] } = useSkills();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-6xl px-5 pt-32">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#a78bfa]">
            Downloadable systems
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold">AI skills, ready to install.</h1>
          <p className="mt-4 text-muted-foreground">
            Versioned Codex and ChatGPT skill packages built for real creative workflows.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <Link
              key={s.id}
              to="/skill/$slug"
              params={{ slug: s.slug }}
              className="glass group overflow-hidden rounded-3xl"
            >
              <div className="aspect-[4/3] bg-white/5">
                {s.cover_image_url ? (
                  <img src={s.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center">
                    <Package className="h-12 w-12 text-[#a78bfa]" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-xl font-semibold">{s.title}</h2>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                    {s.price_cents === 0 ? "Free" : `$${(s.price_cents / 100).toFixed(0)}`}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.summary}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#c4b5fd]">
                  <Download className="h-4 w-4" />
                  View skill
                </div>
              </div>
            </Link>
          ))}
        </div>
        {data.length === 0 && (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
            Skills are being prepared for launch.
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

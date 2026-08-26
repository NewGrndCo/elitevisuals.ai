import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Lock, Package } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { skillOptions, skillVersionsOptions, useSkill, useSkillVersions } from "@/lib/queries";
import { requestSkillDownload, createSkillCheckout } from "@/lib/skill-download.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/skill/$slug")({
  loader: async ({ context, params }) => {
    const skill = await context.queryClient.ensureQueryData(skillOptions(params.slug));
    if (skill) await context.queryClient.ensureQueryData(skillVersionsOptions(skill.id));
  },
  component: SkillPage,
});
function SkillPage() {
  const { slug } = Route.useParams();
  const { data: s } = useSkill(slug);
  const { data: versions = [] } = useSkillVersions(s?.id);
  const [busy, setBusy] = useState(false);
  if (!s)
    return (
      <>
        <SiteHeader />
        <main className="pt-40 text-center">Skill not found.</main>
      </>
    );
  const act = async () => {
    setBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
        return;
      }
      if (s.price_cents > 0) {
        const r = await createSkillCheckout({ data: { skillId: s.id } });
        location.href = r.url;
        return;
      }
      const v = versions[0];
      if (!v) throw new Error("No published version");
      const r = await requestSkillDownload({ data: { skillId: s.id, versionId: v.id } });
      location.href = r.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-32">
        <Link to="/skills" className="text-sm text-muted-foreground">
          ← All skills
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="glass aspect-[4/3] overflow-hidden rounded-3xl">
            {s.cover_image_url ? (
              <img src={s.cover_image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center">
                <Package className="h-20 w-20 text-[#a78bfa]" />
              </div>
            )}
          </div>
          <section>
            <div className="flex flex-wrap gap-2">
              {s.compatibility.map((x) => (
                <span key={x} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                  {x}
                </span>
              ))}
            </div>
            <h1 className="mt-5 font-display text-5xl font-bold">{s.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{s.summary}</p>
            <button
              onClick={act}
              disabled={busy || versions.length === 0}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-bold text-primary-foreground disabled:opacity-50"
            >
              {s.price_cents > 0 ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {busy
                ? "Preparing…"
                : s.price_cents > 0
                  ? `Buy for $${(s.price_cents / 100).toFixed(2)}`
                  : "Download free"}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Latest version: {versions[0]?.version ?? "Coming soon"} · Secure ZIP download
            </p>
          </section>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="font-display text-2xl font-semibold">What it does</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-muted-foreground">
              {s.description}
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold">Install</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-muted-foreground">
              {s.install_instructions ||
                "Download the ZIP, extract it, then add the skill folder to your Codex skills directory."}
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

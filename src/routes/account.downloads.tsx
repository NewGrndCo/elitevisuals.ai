import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
import { requestSkillDownload } from "@/lib/skill-download.functions";
type Owned = {
  skill_id: string;
  source: string;
  skills: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    cover_image_url: string | null;
  } | null;
};
export const Route = createFileRoute("/account/downloads")({ component: Downloads });
function Downloads() {
  const [items, setItems] = useState<Owned[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        location.href = "/login?next=/account/downloads";
        return;
      }
      const { data: rows } = await supabase
        .from("skill_entitlements")
        .select("skill_id,source,skills(id,slug,title,summary,cover_image_url)")
        .eq("user_id", data.user.id);
      setItems((rows ?? []) as unknown as Owned[]);
      setLoading(false);
    });
  }, []);
  const download = async (skillId: string) => {
    const { data: v } = await supabase
      .from("skill_versions")
      .select("id")
      .eq("skill_id", skillId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!v) return;
    const r = await requestSkillDownload({ data: { skillId, versionId: v.id } });
    location.href = r.url;
  };
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-5 pt-32">
        <h1 className="font-display text-4xl font-bold">Your downloads</h1>
        <p className="mt-3 text-muted-foreground">
          Every skill you own, ready whenever you need it.
        </p>
        <div className="mt-10 grid gap-4">
          {items.map(
            (i) =>
              i.skills && (
                <div
                  key={i.skill_id}
                  className="glass flex items-center justify-between gap-5 rounded-2xl p-5"
                >
                  <div>
                    <Link
                      to="/skill/$slug"
                      params={{ slug: i.skills.slug }}
                      className="font-display text-xl font-semibold"
                    >
                      {i.skills.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{i.skills.summary}</p>
                  </div>
                  <button
                    onClick={() => download(i.skill_id)}
                    className="rounded-full bg-primary p-3 text-primary-foreground"
                    aria-label={`Download ${i.skills.title}`}
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              ),
          )}
        </div>
        {!loading && items.length === 0 && (
          <div className="glass mt-10 rounded-2xl p-10 text-center">
            <p>No skills yet.</p>
            <Link to="/skills" className="mt-3 inline-block text-[#c4b5fd]">
              Browse skills
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

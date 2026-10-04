import Image from "next/image";
import { requireMember } from "@/lib-next/member-server";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components-next/page-shell";
import { getPacks, getPrompts } from "@/lib-next/supabase";
import { PromptFlipCard } from "@/components-next/prompt-flip-card";
import { Tilt } from "@/components/ui/tilt";
export const metadata = { alternates: { canonical: "/promptbox" }, title: "Prompts" };
export const revalidate = 60;
export default async function Promptbox() {
  await requireMember("/promptbox");
  const [packs, prompts] = await Promise.all([getPacks(), getPrompts()]);
  const imagePrompts = prompts.filter((prompt) => !prompt.pack_id);
  const grouped = imagePrompts.reduce<Record<string, typeof imagePrompts>>((groups, prompt) => {
    const category = prompt.category_name || "More image prompts";
    groups[category] ??= [];
    groups[category].push(prompt);
    return groups;
  }, {});
  return (
    <PageShell
      eyebrow="Prompts"
      title="Find your next visual."
      description="Curated prompts and complete creative packs built for modern AI image and video models."
    >
      <section className="catalog-section">
        <div className="pack-grid">
          {packs.map((p, i) => (
            <Tilt key={p.id} className="pack-tilt">
              <Link href={`/pack/${p.slug}`} className="pack-card">
                {p.cover_image_url && (
                  <Image src={p.cover_image_url} alt={p.title} fill sizes="33vw" />
                )}
                <div className="pack-shade" />
                <div className="pack-copy">
                  <span>Pack {String(i + 1).padStart(2, "0")}</span>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <b>
                    Explore pack <ArrowRight size={15} />
                  </b>
                </div>
              </Link>
            </Tilt>
          ))}
        </div>
        <div className="catalog-title">
          <h2>Image prompts</h2>
          <span>{imagePrompts.length} visuals</span>
        </div>
        {Object.entries(grouped).map(([category, categoryPrompts]) => (
          <section className="prompt-category" key={category}>
            <div className="prompt-category-heading">
              <h3>{category}</h3>
              <span>{categoryPrompts.length} prompts</span>
            </div>
            <div className="catalog-grid">
              {categoryPrompts.map((p) => (
                <PromptFlipCard
                  key={p.id}
                  slug={p.slug}
                  title={p.title}
                  imageUrl={p.cover_image_url}
                  uses={p.copy_count || 0}
                />
              ))}
            </div>
          </section>
        ))}
      </section>
    </PageShell>
  );
}

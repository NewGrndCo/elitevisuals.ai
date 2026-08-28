import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components-next/page-shell";
import { getPacks, getPrompts } from "@/lib-next/supabase";
export const metadata = { title: "Promptbox" };
export const revalidate = 60;
export default async function Promptbox() {
  const [packs, prompts] = await Promise.all([getPacks(), getPrompts()]);
  return (
    <PageShell
      eyebrow="Promptbox"
      title="Find your next visual."
      description="Curated prompts and complete creative packs built for modern AI image and video models."
    >
      <section className="catalog-section">
        <div className="pack-grid">
          {packs.map((p, i) => (
            <Link href={`/pack/${p.slug}`} className="pack-card" key={p.id}>
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
          ))}
        </div>
        <div className="catalog-title">
          <h2>Individual prompts</h2>
          <span>{prompts.length} visuals</span>
        </div>
        <div className="catalog-grid">
          {prompts.map((p) => (
            <Link href={`/prompt/${p.slug}`} className="catalog-card" key={p.id}>
              {p.cover_image_url ? (
                <Image src={p.cover_image_url} alt={p.title} fill sizes="25vw" />
              ) : (
                <div className="image-fallback" />
              )}
              <div>
                <h3>{p.title}</h3>
                <span>{p.copy_count || 0} uses</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

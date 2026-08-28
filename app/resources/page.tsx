import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { PageShell } from "@/components-next/page-shell";
import { getResources } from "@/lib-next/supabase";
export const metadata = { title: "AI Resources" };
export default async function Resources() {
  const items = await getResources();
  return (
    <PageShell
      eyebrow="Curated directory"
      title="Useful AI resources."
      description="Tools, platforms, creators, news sources, and workflows worth keeping close."
    >
      <section className="catalog-section">
        <div className="resource-grid">
          {items.map((r) => (
            <a href={r.url} target="_blank" rel="noreferrer" className="resource-card" key={r.id}>
              {r.image_url ? (
                <Image src={r.image_url} alt="" width={500} height={280} />
              ) : (
                <div className="resource-placeholder" />
              )}
              <span>{r.resource_type}</span>
              <h2>{r.title}</h2>
              <p>{r.description}</p>
              <b>
                Visit resource <ExternalLink size={14} />
              </b>
            </a>
          ))}
        </div>
        {!items.length && (
          <div className="empty-state">
            <h2>Resources are being curated.</h2>
            <p>New tools and workflow references are coming soon.</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

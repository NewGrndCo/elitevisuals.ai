import Image from "next/image";
import { ExternalLink, Link2 } from "lucide-react";
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
        <div className="resource-directory">
          {items.map((r) => (
            <a href={r.url} target="_blank" rel="noreferrer" className="resource-card" key={r.id}>
              <div className="resource-logo">
                {r.image_url ? (
                  <Image src={r.image_url} alt="" width={64} height={64} />
                ) : (
                  <Link2 />
                )}
              </div>
              <div className="resource-copy">
                <span>{r.resource_type}</span>
                <h2>{r.title}</h2>
                <p>{r.description}</p>
                <small>{r.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</small>
              </div>
              <div className="resource-visit" aria-label="Open resource">
                <ExternalLink size={17} />
              </div>
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

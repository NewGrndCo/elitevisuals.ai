import { PageShell } from "@/components-next/page-shell";
import { ResourceDirectory } from "@/components-next/resource-directory";
import { getResources } from "@/lib-next/supabase";
export const metadata = { title: "AI Resources" };
export const dynamic = "force-dynamic";
export default async function Resources() {
  const items = await getResources();
  return (
    <PageShell
      eyebrow="Curated directory"
      title="Useful AI resources."
      description="Tools, platforms, creators, news sources, and workflows worth keeping close."
    >
      <section className="catalog-section">
        <ResourceDirectory items={items} />
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

import Image from "next/image";
import { requireMember } from "@/lib-next/member-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components-next/site-header";
import { getPack } from "@/lib-next/supabase";
export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireMember(`/pack/${encodeURIComponent(slug)}`);
  const data = await getPack(slug);
  if (!data) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="subhero pack-hero">
          <Link href="/promptbox" className="back">
            <ArrowLeft size={16} /> All packs
          </Link>
          {data.pack.cover_image_url && (
            <Image src={data.pack.cover_image_url} alt={data.pack.title} width={210} height={210} />
          )}
          <p className="kicker">Prompt Pack</p>
          <h1>{data.pack.title}</h1>
          <p>{data.pack.description}</p>
        </section>
        <section className="catalog-section">
          <div className="catalog-grid">
            {data.prompts.map((p) => (
              <Link href={`/prompt/${p.slug}`} className="catalog-card" key={p.id}>
                {p.cover_image_url && (
                  <Image src={p.cover_image_url} alt={p.title} fill sizes="25vw" />
                )}
                <div>
                  <h3>{p.title}</h3>
                  <span>View prompt</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireMember(`/pack/${encodeURIComponent(slug)}`);
  const result = await getPack(slug);
  const item = result?.pack;
  return item
    ? {
        title: item.title,
        description: item.description || undefined,
        alternates: { canonical: `/pack/${encodeURIComponent(slug)}` },
        openGraph: {
          title: item.title,
          url: `/pack/${encodeURIComponent(slug)}`,
          ...(item.cover_image_url ? { images: [{ url: item.cover_image_url }] } : {}),
        },
      }
    : { title: "Not found", robots: { index: false } };
}

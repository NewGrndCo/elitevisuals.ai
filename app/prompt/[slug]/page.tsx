import Image from "next/image";
import { requireMember } from "@/lib-next/member-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components-next/icons";
import { SiteFooter, SiteHeader } from "@/components-next/site-header";
import { PromptAccess } from "@/components-next/prompt-access";
import { getPrompt } from "@/lib-next/supabase";
export default async function PromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireMember(`/prompt/${encodeURIComponent(slug)}`);
  const p = await getPrompt(slug);
  if (!p) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="detail-page">
        <Link href="/promptbox" className="back">
          <ArrowLeft size={16} /> Back to Promptbox
        </Link>
        <div className="prompt-detail">
          <div>
            {p.cover_image_url && (
              <div className="detail-image">
                <Image
                  src={p.cover_image_url}
                  alt={p.title}
                  fill
                  priority
                  sizes="(max-width: 800px) 100vw, 60vw"
                />
              </div>
            )}
            <p className="kicker">{p.categories?.name || "Visual Prompt"}</p>
            <h1>{p.title}</h1>
            <p className="detail-description">{p.description}</p>
          </div>
          <aside>
            <PromptAccess slug={p.slug} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireMember(`/prompt/${encodeURIComponent(slug)}`);
  const result = await getPrompt(slug);
  const item = result;
  return item
    ? {
        title: item.title,
        description: item.description || undefined,
        alternates: { canonical: `/prompt/${encodeURIComponent(slug)}` },
        openGraph: {
          title: item.title,
          url: `/prompt/${encodeURIComponent(slug)}`,
          ...(item.cover_image_url ? { images: [{ url: item.cover_image_url }] } : {}),
        },
      }
    : { title: "Not found", robots: { index: false } };
}

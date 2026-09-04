import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components-next/site-header";
import { PromptAccess } from "@/components-next/prompt-access";
import { getPrompt } from "@/lib-next/supabase";
export default async function PromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPrompt(slug);
  if (!p) notFound();
  return (
    <>
      <SiteHeader />
      <main className="detail-page">
        <Link href="/promptbox" className="back">
          <ArrowLeft size={16} /> Back to Promptbox
        </Link>
        <div className="prompt-detail">
          <div>
            {p.cover_image_url && (
              <div className="detail-image">
                <Image src={p.cover_image_url} alt={p.title} fill priority sizes="60vw" />
              </div>
            )}
            <p className="kicker">{p.categories?.name || "Visual Prompt"}</p>
            <h1>{p.title}</h1>
            <p className="detail-description">{p.description}</p>
          </div>
          <aside>
            <PromptAccess prompt={p.prompt_text} slug={p.slug} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components-next/site-header";
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
            <div className="prompt-lock">
              <div className="blurred-copy">{p.prompt_text}</div>
              <div className="lock-cover">
                <Lock size={23} />
                <h2>Sign in to reveal prompt</h2>
                <p>Create a free account to view and copy the complete prompt.</p>
                <Link className="button button-solid" href={`/login?next=/prompt/${p.slug}`}>
                  Sign In
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

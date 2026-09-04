import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components-next/site-header";
import { getSkill } from "@/lib-next/supabase";

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) notFound();
  return (
    <>
      <SiteHeader />
      <main className="detail-page">
        <Link href="/skills" className="back">
          <ArrowLeft size={16} /> All skills
        </Link>
        <div className="prompt-detail">
          <div>
            {skill.cover_image_url && (
              <div className="detail-image">
                <Image src={skill.cover_image_url} alt={skill.title} fill priority sizes="60vw" />
              </div>
            )}
            <p className="kicker">Downloadable skill</p>
            <h1>{skill.title}</h1>
            <p className="detail-description">{skill.description}</p>
          </div>
          <aside className="skill-purchase">
            <span>{skill.price_cents ? `$${(skill.price_cents / 100).toFixed(0)}` : "Free"}</span>
            <h2>Install the complete system.</h2>
            <p>{skill.summary}</p>
            {skill.download_url ? (
              <a className="button button-solid" href={skill.download_url} download>
                <Download size={16} /> Download ZIP
              </a>
            ) : (
              <button className="button button-solid" disabled>
                <Download size={16} /> Package coming soon
              </button>
            )}
            <div className="compatibility">Works with {skill.compatibility?.join(", ")}</div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

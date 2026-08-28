import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, Sparkles } from "lucide-react";
import { PageShell } from "@/components-next/page-shell";
import { getSkills } from "@/lib-next/supabase";
export const metadata = { title: "Downloadable Skills" };
export default async function Skills() {
  const skills = await getSkills();
  return (
    <PageShell
      eyebrow="Creative systems"
      title="Downloadable AI skills."
      description="Production-ready Elite Visuals workflows packaged for your AI workspace."
    >
      <section className="catalog-section">
        <div className="skill-grid skill-prompt-grid">
          {skills.map((s) => (
            <Link href={`/skill/${s.slug}`} className="skill-visual-card" key={s.id}>
              {s.cover_image_url ? (
                <Image
                  src={s.cover_image_url}
                  alt={s.title}
                  fill
                  sizes="(max-width: 700px) 90vw, 33vw"
                />
              ) : (
                <div className="skill-placeholder">
                  <Sparkles size={34} />
                </div>
              )}
              <div className="skill-card-overlay">
                <span className="skill-price">
                  {s.price_cents ? `$${(s.price_cents / 100).toFixed(0)}` : "Free"}
                </span>
                <h2>{s.title}</h2>
                <p>{s.summary}</p>
                <b>
                  <Download size={14} /> View skill <ArrowRight size={15} />
                </b>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

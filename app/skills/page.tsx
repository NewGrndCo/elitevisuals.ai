import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
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
        <div className="skill-grid">
          {skills.map((s) => (
            <Link href={`/skill/${s.slug}`} className="skill-card" key={s.id}>
              {s.cover_image_url ? (
                <Image src={s.cover_image_url} alt={s.title} width={600} height={400} />
              ) : (
                <div className="skill-placeholder">
                  <Download />
                </div>
              )}
              <div>
                <span>{s.price_cents ? `$${(s.price_cents / 100).toFixed(0)}` : "Free"}</span>
                <h2>{s.title}</h2>
                <p>{s.summary}</p>
                <b>
                  View skill <ArrowRight size={15} />
                </b>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

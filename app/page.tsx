import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Download, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components-next/site-header";
import { VisualGrid } from "@/components-next/visual-grid";
import { getHomeData } from "@/lib-next/supabase";

export const revalidate = 60;
export default async function Home() {
  const { packs, prompts, transitionPrompts, imagePrompts, skills, logos } = await getHomeData();
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="eyebrow">
            <Sparkles size={14} /> The AI creator toolkit
          </div>
          <h1>
            Create Beyond <span>Ordinary</span>
          </h1>
          <p>
            Create stronger AI visuals with curated prompts, downloadable skills, practical tools,
            and creator-ready resources.
          </p>
          <div className="hero-actions">
            <Link href="/promptbox" className="button button-outline">
              Explore Prompts <ArrowRight size={17} />
            </Link>
            <Link href="/waitlist" className="button button-solid">
              Join Waitlist
            </Link>
          </div>
        </section>
        <VisualGrid prompts={prompts} />
        <section className="section promptbox">
          <div className="section-heading centered">
            <p className="kicker">Promptbox</p>
            <h2>Curated prompts for your next creation</h2>
            <p>Explore visual ideas built for modern image and video models.</p>
          </div>
          <div className="prompt-showcase-group">
            <div className="prompt-row-heading">
              <span>Transition prompts</span>
              <small>From Kinetic V1</small>
            </div>
            <div className="prompt-row">
              {transitionPrompts.map((p) => (
                <Link href={`/prompt/${p.slug}`} className="prompt-card" key={p.id}>
                  {p.cover_image_url ? (
                    <Image
                      src={p.cover_image_url}
                      alt={p.title}
                      fill
                      sizes="(max-width: 700px) 80vw, 33vw"
                    />
                  ) : (
                    <div className="image-fallback" />
                  )}
                  <div className="card-overlay">
                    <h3>{p.title}</h3>
                    <span>
                      View <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="prompt-showcase-group">
            <div className="prompt-row-heading">
              <span>Image prompts</span>
              <small>Fresh inspiration</small>
            </div>
            <div className="prompt-row">
              {imagePrompts.map((p) => (
                <Link href={`/prompt/${p.slug}`} className="prompt-card" key={p.id}>
                  {p.cover_image_url ? (
                    <Image
                      src={p.cover_image_url}
                      alt={p.title}
                      fill
                      sizes="(max-width: 700px) 80vw, 33vw"
                    />
                  ) : (
                    <div className="image-fallback" />
                  )}
                  <div className="card-overlay">
                    <h3>{p.title}</h3>
                    <span>
                      View <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <Link href="/promptbox" className="button button-outline center-button">
            Explore all <ArrowRight size={16} />
          </Link>
        </section>
        <section className="section packs">
          <div className="section-heading">
            <p className="kicker">Prompt Packs</p>
            <h2>Complete creative worlds.</h2>
          </div>
          <div className="pack-grid">
            {packs.map((p, i) => (
              <Link href={`/pack/${p.slug}`} className="pack-card" key={p.id}>
                {p.cover_image_url && <Image src={p.cover_image_url} alt="" fill sizes="33vw" />}
                <div className="pack-shade" />
                <div className="pack-copy">
                  <span>Pack {String(i + 1).padStart(2, "0")}</span>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <b>
                    Explore pack <ArrowRight size={15} />
                  </b>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/promptbox" className="button button-outline center-button">
            Explore all packs <ArrowRight size={16} />
          </Link>
        </section>
        <section className="skill-banner">
          <div>
            <p className="kicker">Elite Visuals Skills</p>
            <h2>
              Prompts are the idea.
              <br />
              Skills are the system.
            </h2>
            <p>
              Install complete creative workflows as ZIP packages and keep your production systems
              ready inside your AI workspace.
            </p>
            <Link href="/skills" className="button button-solid">
              <Download size={16} /> Browse skills
            </Link>
          </div>
          {skills[0]?.cover_image_url && (
            <Image src={skills[0].cover_image_url} alt="" width={430} height={430} />
          )}
        </section>
        {logos.length > 0 && (
          <section className="logo-strip">
            <p>Works with your favorite creative AI tools</p>
            <div>
              {logos
                .filter((l) => l.logo_url || l.image_url)
                .map((l) => (
                  <Image
                    key={l.id}
                    src={(l.logo_url || l.image_url)!}
                    alt={l.name || "AI platform"}
                    width={90}
                    height={36}
                  />
                ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

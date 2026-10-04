import { SiteFooter, SiteHeader } from "./site-header";
import { SectionReveal } from "./section-reveal";
export function PageShell({
  eyebrow,
  title,
  description,
  heroFeature,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  heroFeature?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <SectionReveal>
          <section className="subhero">
            <p className="kicker">{eyebrow}</p>
            {heroFeature}
            <h1>{title}</h1>
            <p>{description}</p>
          </section>
        </SectionReveal>
        <SectionReveal>{children}</SectionReveal>
      </main>
      <SiteFooter />
    </>
  );
}

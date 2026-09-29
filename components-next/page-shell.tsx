import { SiteFooter, SiteHeader } from "./site-header";
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
        <section className="subhero">
          <p className="kicker">{eyebrow}</p>
          {heroFeature}
          <h1>{title}</h1>
          <p>{description}</p>
        </section>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

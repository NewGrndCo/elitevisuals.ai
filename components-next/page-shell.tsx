import { SiteFooter, SiteHeader } from "./site-header";
export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="subhero">
          <p className="kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

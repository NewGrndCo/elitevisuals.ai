import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components-next/site-header";
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="route-state">
        <p className="kicker">404 · Page not found</p>
        <h1>Let’s find your next idea.</h1>
        <p>This page may have moved or is no longer published.</p>
        <Link href="/promptbox" className="button button-solid">
          Explore prompts
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}

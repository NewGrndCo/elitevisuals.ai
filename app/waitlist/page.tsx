import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components-next/page-shell";
import { WaitlistForm } from "@/components-next/waitlist-form";
import { getPacks, getPrompts } from "@/lib-next/supabase";
export const metadata = { title: "Join the Waitlist" };

type ShowcaseItem = {
  id: string;
  title: string;
  image: string | null;
  href: string;
  kind: string;
};

function ShowcaseCard({ item, index }: { item: ShowcaseItem; index: number }) {
  return (
    <Link
      href={item.href}
      className="waitlist-showcase-card"
      style={{ "--card-index": index } as React.CSSProperties}
      aria-label={`${item.kind}: ${item.title}`}
    >
      {item.image ? (
        <Image src={item.image} alt="" fill sizes="(max-width: 600px) 62vw, 190px" unoptimized />
      ) : (
        <div className="image-fallback" />
      )}
      <span>{item.kind}</span>
      <strong>{item.title}</strong>
    </Link>
  );
}

export default async function Waitlist() {
  const [packs, prompts] = await Promise.all([getPacks(), getPrompts()]);
  const transitionPack = packs.find((pack) => pack.slug.toLowerCase() === "kinetic-v1");
  const transitionPrompts = prompts
    .filter((prompt) => prompt.pack_id === transitionPack?.id && prompt.cover_image_url)
    .slice(0, 3);
  const showcase: ShowcaseItem[] = [
    ...transitionPrompts.map((prompt) => ({
      id: prompt.id,
      title: prompt.title,
      image: prompt.cover_image_url,
      href: `/prompt/${prompt.slug}`,
      kind: "AI Transition",
    })),
    ...packs.slice(0, 3).map((pack) => ({
      id: pack.id,
      title: pack.title,
      image: pack.cover_image_url,
      href: `/pack/${pack.slug}`,
      kind: "Prompt Pack",
    })),
  ];

  return (
    <PageShell
      eyebrow="Early access"
      title="Be first inside."
      description="Join the Elite Visuals list for new prompt packs, downloadable skills, and creator workflow drops."
      heroFeature={
        showcase.length > 0 ? (
          <div className="waitlist-showcase" aria-label="Featured prompts and AI transitions">
            <div className="waitlist-showcase-track">
              {showcase.map((item, index) => (
                <ShowcaseCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>
        ) : null
      }
    >
      <section className="form-card">
        <WaitlistForm />
        <p>Early access. No noise.</p>
      </section>
    </PageShell>
  );
}

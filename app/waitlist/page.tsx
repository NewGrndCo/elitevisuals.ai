import { PageShell } from "@/components-next/page-shell";
import { WaitlistForm } from "@/components-next/waitlist-form";
import { WaitlistCardStack } from "@/components-next/waitlist-card-stack";
import { getPacks, getPrompts, getSkills } from "@/lib-next/supabase";
import type { CardStackItem } from "@/components/ui/card-stack";
export const metadata = { alternates: { canonical: "/waitlist" }, title: "Join the Waitlist" };

export default async function Waitlist() {
  const [packs, prompts, skills] = await Promise.all([getPacks(), getPrompts(), getSkills()]);
  const transitionPack = packs.find((pack) => pack.slug.toLowerCase() === "kinetic-v1");
  const transitionPrompts = prompts
    .filter((prompt) => prompt.pack_id === transitionPack?.id && prompt.cover_image_url)
    .slice(0, 3);
  const showcase: CardStackItem[] = [
    ...transitionPrompts.map((prompt) => ({
      id: prompt.id,
      title: prompt.title,
      description: "Ready-to-use motion direction for your next AI video.",
      imageSrc: prompt.cover_image_url,
      href: `/prompt/${prompt.slug}`,
      tag: "AI Transition",
      ctaLabel: "View prompt",
    })),
    ...prompts
      .filter((prompt) => !prompt.pack_id && prompt.cover_image_url)
      .slice(0, 2)
      .map((prompt) => ({
        id: `image-${prompt.id}`,
        title: prompt.title,
        description: prompt.description ?? "A fresh visual direction for modern image models.",
        imageSrc: prompt.cover_image_url,
        href: `/prompt/${prompt.slug}`,
        tag: "Image Prompt",
        ctaLabel: "View prompt",
      })),
    ...skills.slice(0, 2).map((skill) => ({
      id: `skill-${skill.id}`,
      title: skill.title,
      description: skill.summary,
      imageSrc: skill.cover_image_url,
      href: `/skill/${skill.slug}`,
      tag: "Downloadable Skill",
      ctaLabel: "View skill",
    })),
    ...packs.slice(0, 2).map((pack) => ({
      id: pack.id,
      title: pack.title,
      description: pack.description ?? "A complete creative world built for your next drop.",
      imageSrc: pack.cover_image_url,
      href: `/pack/${pack.slug}`,
      tag: "Prompt Pack",
      ctaLabel: "Explore pack",
    })),
  ];

  return (
    <PageShell
      eyebrow="Early access"
      title="Be first inside."
      description="Join the Elite Visuals list for new prompt packs, downloadable skills, and creator workflow drops."
      heroFeature={showcase.length > 0 ? <WaitlistCardStack items={showcase} /> : null}
    >
      <section className="form-card">
        <WaitlistForm />
        <p>Early access. No noise.</p>
      </section>
    </PageShell>
  );
}

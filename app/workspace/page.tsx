import { SiteFooter, SiteHeader } from "@/components-next/site-header";
import { WorkspaceStudio } from "@/components-next/workspace-studio";
import { getPacks, getPrompts, isWorkspaceVisible } from "@/lib-next/supabase";
import { notFound } from "next/navigation";

export const metadata = {
  alternates: { canonical: "/workspace" },
  title: "Workspace",
  description:
    "Create cover art, motion, logos, promo graphics, flyers, and enhanced images in one visual workspace.",
};

export default async function WorkspacePage() {
  if (!(await isWorkspaceVisible())) notFound();
  const [packs, prompts] = await Promise.all([getPacks(), getPrompts()]);
  const motionPackIds = new Set(
    packs
      .filter((pack) => /kinetic|motion|transition/i.test(`${pack.title} ${pack.slug}`))
      .map((pack) => pack.id),
  );
  const motionPresets = prompts
    .filter((prompt) => prompt.pack_id && motionPackIds.has(prompt.pack_id))
    .map((prompt) => ({
      title: prompt.title,
      description:
        prompt.description || "A guided transition preset from the Elite Visuals motion library.",
      imageUrl: prompt.cover_image_url,
    }));
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="workspace-page" tabIndex={-1}>
        <WorkspaceStudio motionPresets={motionPresets} />
      </main>
      <SiteFooter />
    </>
  );
}

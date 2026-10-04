import { SiteFooter, SiteHeader } from "@/components-next/site-header";
import { WorkspaceStudio } from "@/components-next/workspace-studio";
import { isWorkspaceVisible } from "@/lib-next/supabase";
import { notFound } from "next/navigation";

export const metadata = {
  alternates: { canonical: "/workspace" },
  title: "Workspace",
  description:
    "Create cover art, motion, logos, promo graphics, flyers, and enhanced images in one visual workspace.",
};

export default async function WorkspacePage() {
  if (!(await isWorkspaceVisible())) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="workspace-page" tabIndex={-1}>
        <WorkspaceStudio />
      </main>
      <SiteFooter />
    </>
  );
}

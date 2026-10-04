import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib-next/site-metadata";
import { getPacks, getPrompts, getSkills } from "@/lib-next/supabase";
export const revalidate = 60;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packs, prompts, skills] = await Promise.all([getPacks(), getPrompts(), getSkills()]);
  const paths = [
    "",
    "/promptbox",
    "/skills",
    "/resources",
    "/waitlist",
    "/terms",
    "/privacy",
    ...packs.map((p) => `/pack/${encodeURIComponent(p.slug)}`),
    ...prompts.map((p) => `/prompt/${encodeURIComponent(p.slug)}`),
    ...skills.map((p) => `/skill/${encodeURIComponent(p.slug)}`),
  ];
  return paths.map((path) => ({
    url: `${siteOrigin}${path}`,
    changeFrequency: "weekly",
    priority: path ? 0.7 : 1,
  }));
}

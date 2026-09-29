import { cache } from "react";
import { connection } from "next/server";
import { isVisible } from "./content-policy";
import { createClient } from "@supabase/supabase-js";
import { readBetaTable, type AdminTable } from "./beta-content";

function env(name: string, legacy: string) {
  const value = process.env[name] ?? process.env[legacy];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function createPublicClient() {
  return createClient(
    env("NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type Pack = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  sort_order: number;
};
export type Prompt = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  demo_video_url: string | null;
  prompt_text: string;
  copy_count: number;
  is_published: boolean;
  sort_order: number;
  pack_id?: string | null;
  tags?: string[];
  category_name?: string | null;
};
export type Skill = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  cover_image_url: string | null;
  price_cents: number;
  is_published: boolean;
  download_url?: string | null;
};
export type AiLogo = {
  id: string;
  name: string;
  logo_url?: string;
  image_url?: string;
  is_published?: boolean;
};
export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  resource_type: string;
  is_published?: boolean;
};

// React cache deduplicates reads within one render without retaining private data across users.
const publishedRows = cache(async (table: AdminTable, defaultPublished = false) => {
  await connection();
  const beta = await readBetaTable(table);
  let rows: Record<string, unknown>[];
  if (beta !== null) rows = beta;
  else {
    const { data, error } = await createPublicClient()
      .from(table)
      .select("*")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw new Error(`Unable to load ${table}. Please retry.`);
    rows = data ?? [];
  }
  return rows
    .filter((row) => isVisible(row, defaultPublished))
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
});
export const getPacks = cache(async () => (await publishedRows("packs")) as Pack[]);
export const getPrompts = cache(async () => (await publishedRows("prompts")) as Prompt[]);
export const getSkills = cache(async () => (await publishedRows("skills")) as Skill[]);
export const getResources = cache(
  async () => (await publishedRows("resources", true)) as ResourceItem[],
);
export const getPrompt = cache(
  async (slug: string) =>
    ((await getPrompts()).find((row) => row.slug === slug) as
      | (Prompt & { categories: { name: string; accent_color: string | null } | null })
      | undefined) ?? null,
);
export const getSkill = cache(
  async (slug: string) =>
    ((await getSkills()).find((row) => row.slug === slug) as
      | (Skill & { description: string; compatibility: string[]; install_instructions: string })
      | undefined) ?? null,
);
export const getPack = cache(async (slug: string) => {
  const [packs, prompts] = await Promise.all([getPacks(), getPrompts()]);
  const pack = packs.find((row) => row.slug === slug);
  return pack ? { pack, prompts: prompts.filter((row) => row.pack_id === pack.id) } : null;
});
export async function getHomeData() {
  const [allPacks, allPrompts, skills, logos] = await Promise.all([
    getPacks(),
    getPrompts(),
    getSkills(),
    publishedRows("ai_logos", true) as Promise<AiLogo[]>,
  ]);
  const transitionPack = allPacks.find((pack) => pack.slug.toLowerCase() === "kinetic-v1");
  const transitionPool = allPrompts.filter((prompt) => prompt.pack_id === transitionPack?.id);
  const flagshipNames = ["particle dissolution", "shattered mirror", "chrono distortion"];
  const transitionPrompts = flagshipNames
    .map((name) =>
      transitionPool.find((prompt) =>
        [prompt.title, prompt.slug].join(" ").toLowerCase().replaceAll("-", " ").includes(name),
      ),
    )
    .filter((prompt): prompt is Prompt => Boolean(prompt));
  const imagePrompts = allPrompts
    .filter((prompt) => !prompt.pack_id)
    .map((prompt) => ({ prompt, rank: Math.random() }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map(({ prompt }) => prompt);
  return {
    packs: allPacks.slice(0, 3),
    prompts: allPrompts.filter((prompt) => !prompt.pack_id).slice(0, 12),
    transitionPrompts,
    imagePrompts,
    skills: skills.slice(0, 3),
    logos: logos.slice(0, 8),
  };
}

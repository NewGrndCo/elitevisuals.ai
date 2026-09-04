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

async function betaOr<T>(table: AdminTable, fallback: T[]) {
  return ((await readBetaTable(table)) ?? fallback) as T[];
}

export async function getHomeData() {
  const db = createPublicClient();
  const [packs, prompts, skills, logos] = await Promise.all([
    db.from("packs").select("*").eq("is_published", true).order("sort_order").limit(3),
    db.from("prompts").select("*").eq("is_published", true).order("sort_order").limit(12),
    db.from("skills").select("*").eq("is_published", true).order("sort_order").limit(3),
    db.from("ai_logos").select("*").eq("is_published", true).order("sort_order").limit(8),
  ]);
  return {
    packs: (await betaOr("packs", (packs.data ?? []) as Pack[]))
      .filter((row) => row.is_published)
      .slice(0, 3),
    prompts: (await betaOr("prompts", (prompts.data ?? []) as Prompt[]))
      .filter((row) => row.is_published)
      .slice(0, 12),
    skills: (await betaOr("skills", (skills.data ?? []) as Skill[]))
      .filter((row) => row.is_published)
      .slice(0, 3),
    logos: (await betaOr("ai_logos", (logos.data ?? []) as AiLogo[]))
      .filter((row) => row.is_published !== false)
      .slice(0, 8),
  };
}

export async function getPacks() {
  const { data } = await createPublicClient()
    .from("packs")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return (await betaOr("packs", (data ?? []) as Pack[])).filter((row) => row.is_published);
}
export async function getPrompts() {
  const { data } = await createPublicClient()
    .from("prompts")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return (await betaOr("prompts", (data ?? []) as Prompt[])).filter((row) => row.is_published);
}
export async function getPrompt(slug: string) {
  const beta = await readBetaTable("prompts");
  if (beta)
    return (beta.find((row) => row.slug === slug) ?? null) as
      | (Prompt & { categories: { name: string; accent_color: string | null } | null })
      | null;
  const { data } = await createPublicClient()
    .from("prompts")
    .select("*,categories(name,accent_color)")
    .eq("slug", slug)
    .maybeSingle();
  return data as
    | (Prompt & { categories: { name: string; accent_color: string | null } | null })
    | null;
}
export async function getSkills() {
  const { data } = await createPublicClient()
    .from("skills")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return (await betaOr("skills", (data ?? []) as Skill[])).filter((row) => row.is_published);
}
export async function getPack(slug: string) {
  const betaPacks = await readBetaTable("packs");
  const betaPrompts = await readBetaTable("prompts");
  if (betaPacks && betaPrompts) {
    const pack = betaPacks.find((row) => row.slug === slug) as Pack | undefined;
    if (!pack) return null;
    return {
      pack,
      prompts: betaPrompts.filter((row) => row.pack_id === pack.id && row.is_published) as Prompt[],
    };
  }
  const db = createPublicClient();
  const { data: pack } = await db.from("packs").select("*").eq("slug", slug).maybeSingle();
  if (!pack) return null;
  const { data: prompts } = await db
    .from("prompts")
    .select("*")
    .eq("pack_id", pack.id)
    .eq("is_published", true)
    .order("sort_order");
  return { pack: pack as Pack, prompts: (prompts ?? []) as Prompt[] };
}
export async function getSkill(slug: string) {
  const beta = await readBetaTable("skills");
  if (beta)
    return (beta.find((row) => row.slug === slug) ?? null) as
      | (Skill & { description: string; compatibility: string[]; install_instructions: string })
      | null;
  const { data } = await createPublicClient()
    .from("skills")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data as
    | (Skill & { description: string; compatibility: string[]; install_instructions: string })
    | null;
}
export async function getResources() {
  const beta = await readBetaTable("resources");
  if (beta) return (beta as ResourceItem[]).filter((row) => row.is_published !== false);
  const { data, error } = await createPublicClient()
    .from("resources")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  if (error) return [];
  return ((data ?? []) as ResourceItem[]).filter((row) => row.is_published !== false);
}

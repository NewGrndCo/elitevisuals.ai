import { createClient } from "@supabase/supabase-js";

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
};
export type AiLogo = { id: string; name: string; logo_url?: string; image_url?: string };
export type ResourceItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  resource_type: string;
};

export async function getHomeData() {
  const db = createPublicClient();
  const [packs, prompts, skills, logos] = await Promise.all([
    db.from("packs").select("*").eq("is_published", true).order("sort_order").limit(3),
    db.from("prompts").select("*").eq("is_published", true).order("sort_order").limit(12),
    db.from("skills").select("*").eq("is_published", true).order("sort_order").limit(3),
    db.from("ai_logos").select("*").eq("is_published", true).order("sort_order").limit(8),
  ]);
  return {
    packs: (packs.data ?? []) as Pack[],
    prompts: (prompts.data ?? []) as Prompt[],
    skills: (skills.data ?? []) as Skill[],
    logos: (logos.data ?? []) as AiLogo[],
  };
}

export async function getPacks() {
  const { data } = await createPublicClient()
    .from("packs")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return (data ?? []) as Pack[];
}
export async function getPrompts() {
  const { data } = await createPublicClient()
    .from("prompts")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return (data ?? []) as Prompt[];
}
export async function getPrompt(slug: string) {
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
  return (data ?? []) as Skill[];
}
export async function getPack(slug: string) {
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
  const { data, error } = await createPublicClient()
    .from("resources")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  if (error) return [];
  return (data ?? []) as ResourceItem[];
}

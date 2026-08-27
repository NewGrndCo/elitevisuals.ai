import { useQuery, useQueryClient, useMutation, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ─── Shared fetcher fns + queryOptions for SSR prefetch ─── */
const fetchSiteContent = async (): Promise<SiteContentMap> => {
  const { data, error } = await (
    supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => Promise<{
          data: { key: string; value: Record<string, unknown> }[] | null;
          error: unknown;
        }>;
      };
    }
  )
    .from("site_content")
    .select("key,value");
  if (error) throw error as Error;
  const map: SiteContentMap = {};
  (data ?? []).forEach((r) => {
    map[r.key] = r.value ?? {};
  });
  return map;
};
const fetchAiLogos = async () => {
  const { data, error } = await supabase.from("ai_logos").select("*").order("sort_order");
  if (error) throw error;
  return data as AiLogo[];
};
const fetchCategories = async () => {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data as Category[];
};
const fetchPacks = async (includeUnpublished = false) => {
  let q = supabase.from("packs").select("*").order("sort_order");
  if (!includeUnpublished) q = q.eq("is_published", true);
  const { data, error } = await q;
  if (error) throw error;
  return data as Pack[];
};
const fetchPrompts = async (categorySlug?: string) => {
  const q = categorySlug
    ? supabase
        .from("prompts")
        .select("*, categories!inner(slug,name,accent_color)")
        .order("sort_order")
        .eq("categories.slug", categorySlug)
    : supabase.from("prompts").select("*, categories(slug,name,accent_color)").order("sort_order");
  const { data, error } = await q;
  if (error) throw error;
  return data as (Prompt & {
    categories: { slug: string; name: string; accent_color: string | null } | null;
  })[];
};
const fetchPack = async (slug: string) => {
  const { data, error } = await supabase.from("packs").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Pack | null;
};
const fetchPromptsByPack = async (packId: string) => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*, categories(slug,name,accent_color)")
    .eq("pack_id", packId)
    .order("sort_order");
  if (error) throw error;
  return data as (Prompt & {
    categories: { slug: string; name: string; accent_color: string | null } | null;
  })[];
};
const fetchPrompt = async (slug: string) => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*, categories(slug,name,accent_color)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as
    | (Prompt & { categories: { slug: string; name: string; accent_color: string | null } | null })
    | null;
};
const fetchSkills = async (includeUnpublished = false) => {
  let q = supabase
    .from("skills")
    .select("*")
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (!includeUnpublished) q = q.eq("is_published", true);
  const { data, error } = await q;
  if (error) {
    if (import.meta.env.DEV) return DEMO_SKILLS;
    throw error;
  }
  return data as Skill[];
};
const fetchSkill = async (slug: string) => {
  const { data, error } = await supabase.from("skills").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    if (import.meta.env.DEV) return DEMO_SKILLS.find((skill) => skill.slug === slug) ?? null;
    throw error;
  }
  return data as Skill | null;
};
const fetchSkillVersions = async (skillId: string, includeUnpublished = false) => {
  let q = supabase
    .from("skill_versions")
    .select("*")
    .eq("skill_id", skillId)
    .order("created_at", { ascending: false });
  if (!includeUnpublished) q = q.eq("is_published", true);
  const { data, error } = await q;
  if (error) {
    if (import.meta.env.DEV && skillId === DEMO_SKILL_ID) return DEMO_SKILL_VERSIONS;
    throw error;
  }
  return data as SkillVersion[];
};

export const siteContentOptions = () =>
  queryOptions({ queryKey: ["site_content"], queryFn: fetchSiteContent, staleTime: 30_000 });
export const aiLogosOptions = () => queryOptions({ queryKey: ["ai_logos"], queryFn: fetchAiLogos });
export const categoriesOptions = () =>
  queryOptions({ queryKey: ["categories"], queryFn: fetchCategories });
export const packsOptions = (includeUnpublished = false) =>
  queryOptions({
    queryKey: ["packs", includeUnpublished ? "all" : "published"],
    queryFn: () => fetchPacks(includeUnpublished),
  });
export const promptsOptions = (categorySlug?: string) =>
  queryOptions({
    queryKey: ["prompts", categorySlug ?? "all"],
    queryFn: () => fetchPrompts(categorySlug),
  });
export const packOptions = (slug: string) =>
  queryOptions({ queryKey: ["pack", slug], queryFn: () => fetchPack(slug) });
export const promptsByPackOptions = (packId: string) =>
  queryOptions({
    queryKey: ["prompts_by_pack", packId],
    queryFn: () => fetchPromptsByPack(packId),
  });
export const promptOptions = (slug: string) =>
  queryOptions({ queryKey: ["prompt", slug], queryFn: () => fetchPrompt(slug) });
export const skillsOptions = (includeUnpublished = false) =>
  queryOptions({
    queryKey: ["skills", includeUnpublished ? "all" : "published"],
    queryFn: () => fetchSkills(includeUnpublished),
  });
export const skillOptions = (slug: string) =>
  queryOptions({ queryKey: ["skill", slug], queryFn: () => fetchSkill(slug) });
export const skillVersionsOptions = (skillId: string, includeUnpublished = false) =>
  queryOptions({
    queryKey: ["skill_versions", skillId, includeUnpublished ? "all" : "published"],
    queryFn: () => fetchSkillVersions(skillId, includeUnpublished),
  });

/* ─── Site Content (CMS) ─── */
export type SiteContentMap = Record<string, Record<string, unknown>>;

export const useSiteContent = () =>
  useQuery({
    queryKey: ["site_content"],
    queryFn: fetchSiteContent,
    staleTime: 30_000,
  });

export const useSiteContentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      const { error } = await (
        supabase as unknown as {
          from: (t: string) => { upsert: (v: unknown) => Promise<{ error: unknown }> };
        }
      )
        .from("site_content")
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error as Error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site_content"] }),
  });
};

export const sc = (
  m: SiteContentMap | undefined,
  key: string,
  field: string,
  fallback = "",
): string => {
  const v = m?.[key]?.[field];
  return typeof v === "string" ? v : fallback;
};

export type AiLogo = {
  id: string;
  name: string;
  logo_url: string;
  link_url: string | null;
  sort_order: number;
  is_published: boolean;
};

export const useAiLogos = () =>
  useQuery({
    queryKey: ["ai_logos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_logos").select("*").order("sort_order");
      if (error) throw error;
      return data as AiLogo[];
    },
  });

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accent_color: string | null;
  sort_order: number;
};

export type Pack = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_published: boolean;
  price_cents: number;
  hidden_sections: string[];
};

export type Prompt = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  prompt_text: string;
  category_id: string | null;
  pack_id: string | null;
  cover_image_url: string | null;
  demo_video_url: string | null;
  gallery_urls: string[];
  is_published: boolean;
  sort_order: number;
  copy_count: number;
};

export type Skill = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  cover_image_url: string | null;
  compatibility: string[];
  install_instructions: string;
  price_cents: number;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SkillVersion = {
  id: string;
  skill_id: string;
  version: string;
  changelog: string;
  storage_path: string;
  file_size: number;
  sha256: string;
  is_published: boolean;
  created_at: string;
};

export type ResourceItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  resource_type: "tool" | "platform" | "creator" | "news" | "workflow" | "community" | "other";
  tags: string[];
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

export type SiteAsset = {
  id: string;
  asset_key: string;
  name: string;
  asset_type: "image" | "video" | "icon" | "document" | "other";
  url: string;
  alt_text: string;
  notes: string;
  is_published: boolean;
};

// Generated database types are refreshed after the migration is applied remotely.
/* eslint-disable @typescript-eslint/no-explicit-any */
const dynamicTable = (name: string): any =>
  (supabase as unknown as { from: (table: string) => any }).from(name);
/* eslint-enable @typescript-eslint/no-explicit-any */

export const useResources = (includeUnpublished = false) =>
  useQuery({
    queryKey: ["resources", includeUnpublished ? "all" : "published"],
    queryFn: async () => {
      let q = dynamicTable("resources").select("*").order("sort_order").order("title");
      if (!includeUnpublished) q = q.eq("is_published", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as ResourceItem[];
    },
  });

export const useSiteAssets = () =>
  useQuery({
    queryKey: ["site_assets"],
    queryFn: async () => {
      const { data, error } = await dynamicTable("site_assets").select("*").order("name");
      if (error) throw error;
      return data as SiteAsset[];
    },
  });

const DEMO_SKILL_ID = "11111111-1111-4111-8111-111111111111";
const DEMO_SKILLS: Skill[] = [
  {
    id: DEMO_SKILL_ID,
    slug: "elite-visuals-reel-script-writer",
    title: "Elite Visuals Reel Script Writer",
    summary: "Turn AI news, tools, and ideas into high-retention Instagram Reel scripts.",
    description:
      "A production-ready writing system for hooks, pacing, education, and creator-focused calls to action.",
    cover_image_url: null,
    compatibility: ["Codex", "ChatGPT"],
    install_instructions:
      "Download and extract the ZIP, then place the skill folder inside your Codex skills directory.",
    price_cents: 0,
    is_featured: true,
    is_published: true,
    sort_order: 0,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
];
const DEMO_SKILL_VERSIONS: SkillVersion[] = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    skill_id: DEMO_SKILL_ID,
    version: "1.0.0",
    changelog: "Initial release",
    storage_path: "demo-only",
    file_size: 1024,
    sha256: "0".repeat(64),
    is_published: true,
    created_at: new Date(0).toISOString(),
  },
];

export const useSkills = (includeUnpublished = false) =>
  useQuery(skillsOptions(includeUnpublished));

export const useSkill = (slug: string) => useQuery(skillOptions(slug));

export const useSkillVersions = (skillId: string | undefined, includeUnpublished = false) =>
  useQuery({
    ...skillVersionsOptions(skillId ?? "", includeUnpublished),
    enabled: !!skillId,
  });

export const useSkillEntitlements = () =>
  useQuery({
    queryKey: ["skill_entitlements"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as { skill_id: string; source: string; granted_at: string }[];
      const { data, error } = await supabase
        .from("skill_entitlements")
        .select("skill_id,source,granted_at")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

/* ─── Packs ─── */

export const usePacks = (includeUnpublished = false) =>
  useQuery({
    queryKey: ["packs", includeUnpublished ? "all" : "published"],
    queryFn: async () => {
      let q = supabase.from("packs").select("*").order("sort_order");
      if (!includeUnpublished) q = q.eq("is_published", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as Pack[];
    },
  });

export const usePack = (slug: string) =>
  useQuery({
    queryKey: ["pack", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packs")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Pack | null;
    },
  });

export const usePackById = (id: string | null | undefined) =>
  useQuery({
    enabled: !!id,
    queryKey: ["pack_by_id", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("packs").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as Pack | null;
    },
  });

/* ─── Prompts ─── */

export const usePrompts = (categorySlug?: string) =>
  useQuery({
    queryKey: ["prompts", categorySlug ?? "all"],
    queryFn: async () => {
      const q = categorySlug
        ? supabase
            .from("prompts")
            .select("*, categories!inner(slug,name,accent_color)")
            .order("sort_order")
            .eq("categories.slug", categorySlug)
        : supabase
            .from("prompts")
            .select("*, categories(slug,name,accent_color)")
            .order("sort_order");
      const { data, error } = await q;
      if (error) throw error;
      return data as (Prompt & {
        categories: { slug: string; name: string; accent_color: string | null } | null;
      })[];
    },
  });

export const usePromptsByPack = (packId: string | undefined) =>
  useQuery({
    enabled: !!packId,
    queryKey: ["prompts_by_pack", packId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*, categories(slug,name,accent_color)")
        .eq("pack_id", packId!)
        .order("sort_order");
      if (error) throw error;
      return data as (Prompt & {
        categories: { slug: string; name: string; accent_color: string | null } | null;
      })[];
    },
  });

export const usePrompt = (slug: string) =>
  useQuery({
    queryKey: ["prompt", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*, categories(slug,name,accent_color)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as
        | (Prompt & {
            categories: { slug: string; name: string; accent_color: string | null } | null;
          })
        | null;
    },
  });

/* ─── Purchases / Access ─── */
export const useUserPurchases = () =>
  useQuery({
    queryKey: ["user_purchases"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return { packIds: new Set<string>(), hasMembership: false };
      const { data, error } = await (
        supabase as unknown as {
          from: (t: string) => {
            select: (c: string) => {
              eq: (
                k: string,
                v: string,
              ) => Promise<{
                data: { pack_id: string | null; is_membership: boolean }[] | null;
                error: unknown;
              }>;
            };
          };
        }
      )
        .from("purchases")
        .select("pack_id,is_membership")
        .eq("user_id", uid);
      if (error) throw error as Error;
      const packIds = new Set<string>();
      let hasMembership = false;
      (data ?? []).forEach((r) => {
        if (r.is_membership) hasMembership = true;
        if (r.pack_id) packIds.add(r.pack_id);
      });
      return { packIds, hasMembership };
    },
  });

/* ─── Admin role check (defense-in-depth behind the PIN gate) ─── */
export const useIsAdmin = () =>
  useQuery({
    queryKey: ["is_admin"],
    staleTime: 60_000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

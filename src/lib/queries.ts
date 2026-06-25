import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ─── Site Content (CMS) ─── */
export type SiteContentMap = Record<string, Record<string, unknown>>;

export const useSiteContent = () =>
  useQuery({
    queryKey: ["site_content"],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => Promise<{ data: { key: string; value: Record<string, unknown> }[] | null; error: unknown }> } })
        .from("site_content").select("key,value");
      if (error) throw error as Error;
      const map: SiteContentMap = {};
      (data ?? []).forEach((r) => { map[r.key] = r.value ?? {}; });
      return map;
    },
    staleTime: 30_000,
  });

export const useSiteContentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      const { error } = await (supabase as unknown as { from: (t: string) => { upsert: (v: unknown) => Promise<{ error: unknown }> } })
        .from("site_content").upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error as Error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site_content"] }),
  });
};

export const sc = (m: SiteContentMap | undefined, key: string, field: string, fallback = ""): string => {
  const v = m?.[key]?.[field];
  return typeof v === "string" ? v : fallback;
};


export type AiLogo = {
  id: string; name: string; logo_url: string; link_url: string | null;
  sort_order: number; is_published: boolean;
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
  id: string; slug: string; name: string; description: string | null;
  accent_color: string | null; sort_order: number;
};

export type Pack = {
  id: string; slug: string; title: string; description: string | null;
  cover_image_url: string | null; sort_order: number; is_published: boolean;
  price_cents: number; shopify_variant_id: string | null;
};

export type Prompt = {
  id: string; slug: string; title: string; description: string | null;
  prompt_text: string; category_id: string | null; pack_id: string | null;
  cover_image_url: string | null; demo_video_url: string | null;
  gallery_urls: string[]; is_published: boolean; sort_order: number;
  copy_count: number;
};

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
      const { data, error } = await supabase.from("packs").select("*").eq("slug", slug).maybeSingle();
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
      let q = categorySlug
        ? supabase.from("prompts").select("*, categories!inner(slug,name,accent_color)").order("sort_order").eq("categories.slug", categorySlug)
        : supabase.from("prompts").select("*, categories(slug,name,accent_color)").order("sort_order");
      const { data, error } = await q;
      if (error) throw error;
      return data as (Prompt & { categories: { slug: string; name: string; accent_color: string | null } | null })[];
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
      return data as (Prompt & { categories: { slug: string; name: string; accent_color: string | null } | null })[];
    },
  });

export const usePrompt = (slug: string) =>
  useQuery({
    queryKey: ["prompt", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts").select("*, categories(slug,name,accent_color)").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data as (Prompt & { categories: { slug: string; name: string; accent_color: string | null } | null }) | null;
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
      const { data, error } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => Promise<{ data: { pack_id: string | null; is_membership: boolean }[] | null; error: unknown }> } } })
        .from("purchases").select("pack_id,is_membership").eq("user_id", uid);
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


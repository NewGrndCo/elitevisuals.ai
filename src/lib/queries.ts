import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string; slug: string; name: string; description: string | null;
  accent_color: string | null; sort_order: number;
};
export type Prompt = {
  id: string; slug: string; title: string; description: string | null;
  prompt_text: string; category_id: string | null;
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

export const usePrompts = (categorySlug?: string) =>
  useQuery({
    queryKey: ["prompts", categorySlug ?? "all"],
    queryFn: async () => {
      let q = supabase.from("prompts").select("*, categories!inner(slug,name,accent_color)").order("sort_order");
      if (categorySlug) q = q.eq("categories.slug", categorySlug);
      const { data, error } = await q;
      if (error) throw error;
      return data as (Prompt & { categories: { slug: string; name: string; accent_color: string | null } })[];
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

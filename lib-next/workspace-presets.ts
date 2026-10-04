import type { Prompt } from "./supabase";

export type ImagePreset = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  promptText: string;
};

// The same image-only classification used by the site's Promptbox catalog.
export function getImagePresets(prompts: Prompt[]): ImagePreset[] {
  return prompts
    .filter((prompt) => !prompt.pack_id)
    .map((prompt) => ({
      id: prompt.id,
      slug: prompt.slug,
      title: prompt.title,
      description: prompt.description || "An image prompt from the Elite Visuals library.",
      imageUrl: prompt.cover_image_url,
      promptText: prompt.prompt_text,
    }));
}

export function imagePresetBrief(preset: ImagePreset | undefined) {
  return preset
    ? {
        id: preset.id,
        slug: preset.slug,
        title: preset.title,
        prompt: preset.promptText,
      }
    : undefined;
}

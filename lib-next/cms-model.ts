export const tabs = [
  ["packs", "Prompt Packs"],
  ["prompts", "Image Prompts"],
  ["skills", "Skills"],
  ["resources", "Resources"],
  ["site_assets", "Site Assets"],
  ["site_content", "Page Copy"],
  ["categories", "Categories"],
  ["ai_logos", "AI Models"],
  ["members", "Members"],
  ["waitlist_signups", "Waitlist"],
] as const;
export type Table = (typeof tabs)[number][0];
export type Row = Record<string, unknown> & { id?: string; key?: string };
export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "boolean" | "json" | "datetime";
  required?: boolean;
  upload?: { kind: string; accept: string; label: string };
};
const f = (key: string, label: string, type: Field["type"] = "text", required = false): Field => ({
  key,
  label,
  type,
  required,
});
export const fields: Record<Table, Field[]> = {
  packs: [
    f("title", "Title", "text", true),
    f("slug", "URL slug", "text", true),
    f("description", "Description", "textarea"),
    {
      ...f("cover_image_url", "Cover image URL"),
      upload: {
        kind: "prompt-cover",
        accept: "image/png,image/jpeg,image/webp,image/avif,image/gif",
        label: "Upload cover",
      },
    },
    f("sort_order", "Sort order", "number"),
    f("is_published", "Published", "boolean"),
  ],
  prompts: [
    f("title", "Title", "text", true),
    f("slug", "URL slug", "text", true),
    f("description", "Description", "textarea"),
    f("prompt_text", "Prompt text", "textarea", true),
    {
      ...{
        ...f("cover_image_url", "Cover image URL"),
        upload: {
          kind: "prompt-cover",
          accept: "image/png,image/jpeg,image/webp,image/avif,image/gif",
          label: "Upload cover",
        },
      },
      upload: { kind: "prompt-cover", accept: "image/*", label: "Upload cover" },
    },
    {
      ...f("demo_video_url", "Demo video URL"),
      upload: { kind: "prompt-demo", accept: "video/*", label: "Upload video" },
    },
    f("gallery_urls", "Gallery URLs (one per line)", "textarea"),
    f("tags", "Tags (one per line)", "textarea"),
    f("category_name", "Display category"),
    f("source_url", "Original source URL"),
    f("category_id", "Category ID"),
    f("pack_id", "Pack ID"),
    f("sort_order", "Sort order", "number"),
    f("is_published", "Published", "boolean"),
  ],
  skills: [
    f("title", "Title", "text", true),
    f("slug", "URL slug", "text", true),
    f("summary", "Summary", "textarea"),
    f("description", "Description", "textarea"),
    {
      ...{
        ...f("cover_image_url", "Cover image URL"),
        upload: {
          kind: "prompt-cover",
          accept: "image/png,image/jpeg,image/webp,image/avif,image/gif",
          label: "Upload cover",
        },
      },
      upload: { kind: "skill-cover", accept: "image/*", label: "Upload cover" },
    },
    {
      ...f("download_url", "Skill ZIP URL"),
      upload: { kind: "skill-package", accept: ".zip,application/zip", label: "Upload ZIP" },
    },
    f("compatibility", "Compatibility (one per line)", "textarea"),
    f("install_instructions", "Install instructions", "textarea"),
    f("price_cents", "Price in cents", "number"),
    f("sort_order", "Sort order", "number"),
    f("is_featured", "Featured", "boolean"),
    f("is_published", "Published", "boolean"),
  ],
  resources: [
    f("title", "Title", "text", true),
    f("slug", "URL slug", "text", true),
    f("description", "Description", "textarea"),
    f("url", "Destination URL", "text", true),
    {
      ...f("image_url", "Image URL"),
      upload: { kind: "resource-image", accept: "image/*", label: "Upload image" },
    },
    f("resource_type", "Type"),
    f("tags", "Tags (one per line)", "textarea"),
    f("sort_order", "Sort order", "number"),
    f("is_featured", "Featured", "boolean"),
    f("is_published", "Published", "boolean"),
  ],
  site_assets: [
    f("name", "Name", "text", true),
    f("asset_key", "Asset key", "text", true),
    f("asset_type", "Asset type"),
    {
      ...f("url", "Asset URL", "text", true),
      upload: { kind: "site-asset", accept: "image/*,video/*,.zip,.pdf", label: "Upload asset" },
    },
    f("alt_text", "Alt text"),
    f("notes", "Notes", "textarea"),
    f("is_published", "Published", "boolean"),
  ],
  site_content: [
    f("key", "Section key", "text", true),
    f("value", "Section copy (JSON)", "json", true),
  ],
  categories: [
    f("name", "Name", "text", true),
    f("slug", "URL slug", "text", true),
    f("description", "Description", "textarea"),
    f("accent_color", "Accent color"),
    f("sort_order", "Sort order", "number"),
  ],
  ai_logos: [
    f("name", "Name", "text", true),
    f("logo_url", "Logo URL"),
    f("image_url", "Image URL"),
    f("sort_order", "Sort order", "number"),
    f("is_published", "Published", "boolean"),
  ],
  members: [f("email", "Email address"), f("created_at", "Joined"), f("source", "Signup source")],
  waitlist_signups: [
    f("email", "Email address", "text", true),
    f("name", "Name"),
    f("interests", "Interests", "textarea"),
    f("source", "Signup source"),
  ],
};
export const rowId = (row: Row) => String(row.id ?? row.key ?? "");
export const shown = (value: unknown, field: Field) =>
  field.type === "json"
    ? JSON.stringify(value ?? {}, null, 2)
    : Array.isArray(value)
      ? value.join("\n")
      : value == null
        ? ""
        : String(value);
export function parsed(value: string | boolean, field: Field) {
  if (field.type === "datetime") return value ? new Date(String(value)).toISOString() : null;
  if (field.type === "boolean") return Boolean(value);
  if (field.type === "number") return Number(value || 0);
  if (field.type === "json") return JSON.parse(String(value || "{}"));
  if (["gallery_urls", "compatibility", "tags"].includes(field.key))
    return String(value)
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  return value === "" &&
    [
      "category_id",
      "pack_id",
      "cover_image_url",
      "demo_video_url",
      "image_url",
      "logo_url",
      "download_url",
      "source_url",
    ].includes(field.key)
    ? null
    : value;
}

export const contentTables = ["packs", "prompts", "skills", "resources", "ai_logos"] as const;
for (const table of contentTables)
  fields[table].push(f("publish_at", "Schedule publication", "datetime"));
export const titleOf = (row: Row) =>
  String(row.title || row.name || row.email || row.key || "Untitled");
export function statusOf(row: Row) {
  if (row.archived_at) return "archived";
  if (row.is_published && row.publish_at && new Date(String(row.publish_at)).getTime() > Date.now())
    return "scheduled";
  return row.is_published ? "published" : "draft";
}
export function previewPath(table: Table, row: Row) {
  const prefix = ({ packs: "pack", prompts: "prompt", skills: "skill" } as Record<string, string>)[
    table
  ];
  return prefix && row.slug ? `/${prefix}/${encodeURIComponent(String(row.slug))}` : null;
}

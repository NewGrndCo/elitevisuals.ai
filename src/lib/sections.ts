export type SectionId = "demo" | "workflow" | "styles";

export const DEFAULT_SECTIONS: { id: SectionId; label: string }[] = [
  { id: "demo", label: "Video demo" },
  { id: "workflow", label: "Workflow" },
  { id: "styles", label: "Motion styles" },
];

/** Back-compat alias. */
export const ALL_SECTIONS = DEFAULT_SECTIONS;

const DEFAULT_ORDER: SectionId[] = DEFAULT_SECTIONS.map((s) => s.id);

type SiteContentLike = Record<string, Record<string, unknown>>;

/**
 * Accepts either the raw comma-separated string or the site-content map
 * (reads `layout.sections`).
 */
export function getSectionOrder(source?: SiteContentLike | string | null): SectionId[] {
  let raw: string[] = [];

  if (typeof source === "string") {
    raw = source.split(",");
  } else if (source && typeof source === "object") {
    const value = source.layout?.sections;
    if (Array.isArray(value)) raw = value.map((v) => String(v));
    else if (typeof value === "string") raw = value.split(",");
  }

  const valid = new Set<string>(DEFAULT_ORDER);
  const parsed = raw
    .map((s) => s.trim())
    .filter((s): s is SectionId => valid.has(s));
  const seen = new Set(parsed);
  return [...parsed, ...DEFAULT_ORDER.filter((s) => !seen.has(s))];
}

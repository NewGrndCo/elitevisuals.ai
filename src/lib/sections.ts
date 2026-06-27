import type { SiteContentMap } from "./queries";

export const DEFAULT_SECTIONS = [
  { id: "demo", label: "Demo Reel" },
  { id: "workflow", label: "Workflow" },
  { id: "styles", label: "Motion Styles" },
  { id: "pricing", label: "Pricing" },
] as const;

export type SectionId = typeof DEFAULT_SECTIONS[number]["id"];

export function getSectionOrder(site: SiteContentMap | undefined): SectionId[] {
  const raw = (site?.layout as { sections?: unknown } | undefined)?.sections;
  const ids = DEFAULT_SECTIONS.map((s) => s.id);
  if (!Array.isArray(raw)) return ids;
  const valid = (raw as unknown[]).filter(
    (x): x is SectionId => typeof x === "string" && (ids as readonly string[]).includes(x),
  );
  ids.forEach((id) => {
    if (!valid.includes(id)) valid.push(id);
  });
  return valid;
}

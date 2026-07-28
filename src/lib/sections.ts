export type SectionId = "demo" | "workflow" | "styles";

export const ALL_SECTIONS: { id: SectionId; label: string }[] = [
  { id: "demo", label: "Video demo" },
  { id: "workflow", label: "Workflow" },
  { id: "styles", label: "Motion styles" },
];

const DEFAULT_ORDER: SectionId[] = ["demo", "workflow", "styles"];

export function getSectionOrder(raw?: string | null): SectionId[] {
  const valid = new Set(ALL_SECTIONS.map((s) => s.id));
  const parsed = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SectionId => valid.has(s as SectionId));
  const seen = new Set(parsed);
  return [...parsed, ...DEFAULT_ORDER.filter((s) => !seen.has(s))];
}

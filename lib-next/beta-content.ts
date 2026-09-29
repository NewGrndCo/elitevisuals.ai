import { getStore } from "@netlify/blobs";

export const ADMIN_TABLES = [
  "packs",
  "prompts",
  "skills",
  "resources",
  "site_assets",
  "site_content",
  "categories",
  "ai_logos",
  "waitlist_signups",
  "member_signups",
] as const;

export type AdminTable = (typeof ADMIN_TABLES)[number];
export type ContentRow = Record<string, unknown>;

const storeName = "elitevisuals-beta-cms";
const keyFor = (table: AdminTable) => `tables/${table}.json`;

function scopedName(name: string) {
  const context = process.env.CONTEXT;
  return context && context !== "production" ? `${name}-preview` : name;
}
function store() {
  return getStore({ name: scopedName(storeName), consistency: "strong" });
}

export function getBetaAssetStore() {
  return getStore({ name: scopedName("elitevisuals-beta-assets"), consistency: "strong" });
}

export function isAdminTable(value: string): value is AdminTable {
  return (ADMIN_TABLES as readonly string[]).includes(value);
}

export async function readBetaTable(table: AdminTable): Promise<ContentRow[] | null> {
  try {
    return await store().get(keyFor(table), { type: "json" });
  } catch (error) {
    // Local `next dev` has no Netlify Blobs context. Supabase remains the read source there.
    if (process.env.NETLIFY || process.env.CONTEXT) throw error;
    return null;
  }
}

export async function seedBetaTable(table: AdminTable, rows: ContentRow[]) {
  const existing = await readBetaTable(table);
  if (existing) return existing;
  await store().setJSON(keyFor(table), rows, { onlyIfNew: true });
  return (await readBetaTable(table)) ?? rows;
}

export class ContentConflict extends Error {
  constructor() {
    super("Content changed since it was loaded. Refresh and review before saving again.");
  }
}

export async function mutateBetaTable(
  table: AdminTable,
  change: (rows: ContentRow[]) => ContentRow[],
) {
  const snapshot = await store().getWithMetadata(keyFor(table), { type: "json" });
  const next = change(structuredClone((snapshot?.data ?? []) as ContentRow[]));
  const result = await store().setJSON(
    keyFor(table),
    next,
    snapshot ? { onlyIfMatch: snapshot.etag } : { onlyIfNew: true },
  );
  if (!result.modified) throw new ContentConflict();
  return next;
}

export async function writeBetaTable(table: AdminTable, rows: ContentRow[]) {
  await store().setJSON(keyFor(table), rows, {
    metadata: { updatedAt: new Date().toISOString(), schema: "elitevisuals-beta-cms-v1" },
  });
}

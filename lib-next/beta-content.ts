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
] as const;

export type AdminTable = (typeof ADMIN_TABLES)[number];
export type ContentRow = Record<string, unknown>;

const storeName = "elitevisuals-beta-cms";
const keyFor = (table: AdminTable) => `tables/${table}.json`;

function store() {
  return getStore({ name: storeName, consistency: "strong" });
}

export function isAdminTable(value: string): value is AdminTable {
  return (ADMIN_TABLES as readonly string[]).includes(value);
}

export async function readBetaTable(table: AdminTable): Promise<ContentRow[] | null> {
  try {
    return await store().get(keyFor(table), { type: "json" });
  } catch {
    // Local `next dev` has no Netlify Blobs context. Supabase remains the read source there.
    return null;
  }
}

export async function seedBetaTable(table: AdminTable, rows: ContentRow[]) {
  const existing = await readBetaTable(table);
  if (existing) return existing;
  await writeBetaTable(table, rows);
  return rows;
}

export async function writeBetaTable(table: AdminTable, rows: ContentRow[]) {
  await store().setJSON(keyFor(table), rows, {
    metadata: { updatedAt: new Date().toISOString(), schema: "elitevisuals-beta-cms-v1" },
  });
}

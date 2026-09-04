import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient, verifyAdminToken } from "@/lib-next/admin";
import { createPublicClient } from "@/lib-next/supabase";
import {
  type ContentRow,
  isAdminTable,
  readBetaTable,
  seedBetaTable,
  writeBetaTable,
} from "@/lib-next/beta-content";

const immutableFields = new Set(["id", "created_at", "updated_at"]);
async function authorized() {
  return verifyAdminToken((await cookies()).get("ev_admin")?.value);
}
function tableFrom(request: Request) {
  const table = new URL(request.url).searchParams.get("table") || "";
  if (!isAdminTable(table)) throw new Error("Unsupported content type");
  return table;
}

async function publicSeed(table: ReturnType<typeof tableFrom>) {
  const { data, error } = await createPublicClient()
    .from(table)
    .select("*")
    .order(table === "site_content" ? "key" : "created_at", { ascending: false });
  // V2-only tables may not exist in the legacy Supabase project yet. In beta,
  // Netlify Blobs is authoritative and an empty seed lets the first item be created.
  if (error) return [];
  return (data ?? []) as ContentRow[];
}

function refreshSite() {
  revalidatePath("/", "layout");
}

const assetReferences = {
  packs: ["cover_image_url"],
  prompts: ["cover_image_url", "demo_video_url"],
  skills: ["cover_image_url", "download_url"],
  resources: ["image_url"],
  ai_logos: ["logo_url", "image_url"],
} as const;

function referencedAssetId(table: string, id: string, field: string) {
  return `ref|${table}|${encodeURIComponent(id)}|${field}`;
}

function parseReferencedAssetId(id: string) {
  const [prefix, table, encodedId, field] = id.split("|");
  if (prefix !== "ref" || !table || !encodedId || !field) return null;
  if (!(table in assetReferences)) return null;
  const allowed = assetReferences[table as keyof typeof assetReferences] as readonly string[];
  if (!allowed.includes(field)) return null;
  return { table: table as keyof typeof assetReferences, id: decodeURIComponent(encodedId), field };
}

function assetType(field: string, url: string) {
  if (field.includes("video") || /\.(mp4|webm|mov)(\?|$)/i.test(url)) return "video";
  if (field.includes("download") || /\.(zip|pdf)(\?|$)/i.test(url)) return "document";
  return "image";
}

async function allReferencedAssets() {
  const groups = await Promise.all(
    Object.keys(assetReferences).map(async (tableName) => {
      const table = tableName as keyof typeof assetReferences;
      const rows =
        (await readBetaTable(table)) ?? (await seedBetaTable(table, await publicSeed(table)));
      return rows.flatMap((row) =>
        assetReferences[table].flatMap((field) => {
          const url = row[field];
          const id = String(row.id ?? "");
          if (!id || typeof url !== "string" || !url) return [];
          const owner = String(row.title || row.name || "Untitled");
          return [
            {
              id: referencedAssetId(table, id, field),
              name: `${owner} — ${field.replaceAll("_", " ")}`,
              asset_key: `${table}.${id}.${field}`,
              asset_type: assetType(field, url),
              url,
              alt_text: owner,
              notes: `Used by ${table.slice(0, -1)}: ${owner}`,
              is_published: row.is_published !== false,
              referenced: true,
            },
          ];
        }),
      );
    }),
  );
  return groups.flat();
}

export async function GET(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const table = tableFrom(request);
    const betaRows = await readBetaTable(table);
    if (betaRows) {
      if (table === "site_assets")
        return NextResponse.json({ data: [...betaRows, ...(await allReferencedAssets())] });
      return NextResponse.json({ data: betaRows });
    }

    let rows: ContentRow[];
    try {
      const { data, error } = await createAdminClient()
        .from(table)
        .select("*")
        .order(table === "site_content" ? "key" : "created_at", { ascending: false });
      if (error) throw error;
      rows = (data ?? []) as ContentRow[];
    } catch {
      rows = await publicSeed(table);
    }
    const seeded = await seedBetaTable(table, rows);
    return NextResponse.json({
      data: table === "site_assets" ? [...seeded, ...(await allReferencedAssets())] : seeded,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin request failed" },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const table = tableFrom(request);
    const { id, patch } = (await request.json()) as { id: string; patch: Record<string, unknown> };
    const reference = table === "site_assets" ? parseReferencedAssetId(id) : null;
    if (reference) {
      const rows =
        (await readBetaTable(reference.table)) ??
        (await seedBetaTable(reference.table, await publicSeed(reference.table)));
      const index = rows.findIndex((row) => String(row.id) === reference.id);
      if (index < 0) return NextResponse.json({ error: "Asset owner not found" }, { status: 404 });
      rows[index] = {
        ...rows[index],
        [reference.field]: typeof patch.url === "string" && patch.url ? patch.url : null,
        updated_at: new Date().toISOString(),
      };
      await writeBetaTable(reference.table, rows);
      refreshSite();
      return NextResponse.json({ ok: true });
    }
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([key]) => !immutableFields.has(key)),
    );
    const rows =
      (await readBetaTable(table)) ?? (await seedBetaTable(table, await publicSeed(table)));
    const index = rows.findIndex(
      (row) => String(row[table === "site_content" ? "key" : "id"]) === id,
    );
    if (index < 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    rows[index] = { ...rows[index], ...cleanPatch, updated_at: new Date().toISOString() };
    await writeBetaTable(table, rows);
    refreshSite();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin update failed" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const table = tableFrom(request);
    const { data: input } = (await request.json()) as { data: Record<string, unknown> };
    const clean = Object.fromEntries(
      Object.entries(input).filter(([key]) => !immutableFields.has(key)),
    );
    const rows =
      (await readBetaTable(table)) ?? (await seedBetaTable(table, await publicSeed(table)));
    const now = new Date().toISOString();
    const data: ContentRow =
      table === "site_content"
        ? { ...clean, updated_at: now }
        : { id: crypto.randomUUID(), ...clean, created_at: now, updated_at: now };
    const identity = String(data[table === "site_content" ? "key" : "id"] ?? "");
    if (!identity) return NextResponse.json({ error: "A unique key is required" }, { status: 400 });
    if (rows.some((row) => String(row[table === "site_content" ? "key" : "id"]) === identity))
      return NextResponse.json({ error: "That key already exists" }, { status: 409 });
    await writeBetaTable(table, [data, ...rows]);
    refreshSite();
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin create failed" },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const table = tableFrom(request);
    const { id } = (await request.json()) as { id: string };
    const reference = table === "site_assets" ? parseReferencedAssetId(id) : null;
    if (reference) {
      const rows =
        (await readBetaTable(reference.table)) ??
        (await seedBetaTable(reference.table, await publicSeed(reference.table)));
      const index = rows.findIndex((row) => String(row.id) === reference.id);
      if (index < 0) return NextResponse.json({ error: "Asset owner not found" }, { status: 404 });
      rows[index] = {
        ...rows[index],
        [reference.field]: null,
        updated_at: new Date().toISOString(),
      };
      await writeBetaTable(reference.table, rows);
      refreshSite();
      return NextResponse.json({ ok: true });
    }
    const rows =
      (await readBetaTable(table)) ?? (await seedBetaTable(table, await publicSeed(table)));
    const primaryKey = table === "site_content" ? "key" : "id";
    const nextRows = rows.filter((row) => String(row[primaryKey]) !== id);
    if (nextRows.length === rows.length)
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    await writeBetaTable(table, nextRows);
    refreshSite();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin delete failed" },
      { status: 503 },
    );
  }
}

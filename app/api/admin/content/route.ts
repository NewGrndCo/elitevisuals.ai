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
  mutateBetaTable,
  ContentConflict,
} from "@/lib-next/beta-content";

import { validateContent, InputError } from "@/lib-next/cms-validation";
async function authorized() {
  return verifyAdminToken((await cookies()).get("ev_admin")?.value);
}
function tableFrom(request: Request) {
  const table = new URL(request.url).searchParams.get("table") || "";
  if (!isAdminTable(table)) throw new InputError("Unsupported content type");
  return table;
}

async function publicSeed(table: ReturnType<typeof tableFrom>) {
  const { data, error } = await createPublicClient()
    .from(table)
    .select("*")
    .order(table === "site_content" ? "key" : "created_at", { ascending: false });
  // V2-only tables may not exist in the legacy Supabase project yet. In beta,
  // Netlify Blobs is authoritative and an empty seed lets the first item be created.
  if (error && ["42P01", "PGRST205"].includes(error.code)) return [];
  if (error) throw new Error("Content source is unavailable. Retry before editing.");
  return (data ?? []) as ContentRow[];
}

function refreshSite() {
  for (const path of ["/", "/promptbox", "/skills", "/resources", "/workspace", "/sitemap.xml"])
    revalidatePath(path);
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
              updated_at: row.updated_at,
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

function failed(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof InputError || error instanceof ContentConflict
          ? error.message
          : "Unable to save content. Please retry.",
    },
    { status: error instanceof InputError ? 400 : error instanceof ContentConflict ? 409 : 503 },
  );
}
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
async function mutate(request: Request, action: "POST" | "PATCH" | "DELETE") {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const table = tableFrom(request);
    if (table === "member_signups") throw new InputError("Member accounts are read-only.");
    if (Number(request.headers.get("content-length")) > 500000)
      throw new InputError("Content is too large.");
    const input = await request.json().catch(() => {
      throw new InputError("Invalid JSON.");
    });
    if (!input || typeof input !== "object") throw new InputError("Invalid request.");
    const { id, expectedUpdatedAt } = input;
    if (action !== "POST" && (typeof id !== "string" || !id))
      throw new InputError("An item ID is required.");
    const reference =
      table === "site_assets" && action !== "POST" ? parseReferencedAssetId(id) : null;
    const target = reference?.table ?? table;
    await seedBetaTable(target, (await readBetaTable(target)) ?? (await publicSeed(target)));
    let created: ContentRow | undefined;
    await mutateBetaTable(target, (rows) => {
      const primary = target === "site_content" ? "key" : "id";
      const index =
        action === "POST"
          ? -1
          : rows.findIndex((row) => String(row[primary]) === (reference?.id ?? id));
      if (action !== "POST" && index < 0)
        throw new InputError("Item no longer exists. Refresh the list.");
      if (
        action !== "POST" &&
        expectedUpdatedAt !== undefined &&
        String(rows[index].updated_at ?? "") !== String(expectedUpdatedAt ?? "")
      )
        throw new ContentConflict();
      if (reference) {
        const patch = action === "DELETE" ? { url: null } : input.patch;
        const clean =
          action === "DELETE" ? { url: null } : validateContent("site_assets", patch, true);
        if (!("url" in clean))
          throw new InputError(
            "Only the URL of a referenced asset can be changed. Edit its owner for other changes.",
          );
        rows[index] = {
          ...rows[index],
          [reference.field]: clean.url,
          updated_at: new Date().toISOString(),
        };
        return rows;
      }
      if (action === "DELETE") {
        if (["packs", "categories"].includes(table))
          throw new InputError(
            "Archive packs instead of deleting them. Categories may still be referenced by content.",
          );
        return rows.filter((_, i) => i !== index);
      }
      const clean = validateContent(
        table,
        action === "POST" ? input.data : input.patch,
        action === "PATCH",
      );
      if (
        action === "PATCH" &&
        table === "site_content" &&
        clean.key !== undefined &&
        clean.key !== id
      )
        throw new InputError("Section keys cannot be changed.");
      const slug = clean.slug;
      if (
        table === "site_content" &&
        (clean.key ?? id) === "email_access" &&
        clean.value !== undefined &&
        (typeof clean.value !== "object" ||
          clean.value === null ||
          Array.isArray(clean.value) ||
          typeof (clean.value as { required?: unknown }).required !== "boolean")
      )
        throw new InputError("Email access must specify required as true or false.");
      if (
        slug &&
        rows.some(
          (row, i) => i !== index && String(row.slug).toLowerCase() === String(slug).toLowerCase(),
        )
      )
        throw new InputError("That URL slug already exists.");
      const now = new Date().toISOString();
      if (action === "POST") {
        created = {
          ...clean,
          ...(table === "site_content" ? {} : { id: crypto.randomUUID(), created_at: now }),
          updated_at: now,
        };
        if (rows.some((row) => row[primary] === created?.[primary]))
          throw new InputError("That key already exists.");
        return [created, ...rows];
      }
      rows[index] = { ...rows[index], ...clean, updated_at: now };
      return rows;
    });
    refreshSite();
    return NextResponse.json(created ? { data: created } : { ok: true }, {
      status: created ? 201 : 200,
    });
  } catch (error) {
    return failed(error);
  }
}
export const POST = (request: Request) => mutate(request, "POST");
export const PATCH = (request: Request) => mutate(request, "PATCH");
export const DELETE = (request: Request) => mutate(request, "DELETE");

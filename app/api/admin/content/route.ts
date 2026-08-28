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
  if (error) throw error;
  return (data ?? []) as ContentRow[];
}

function refreshSite() {
  revalidatePath("/", "layout");
}

export async function GET(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const table = tableFrom(request);
    const betaRows = await readBetaTable(table);
    if (betaRows) return NextResponse.json({ data: betaRows });

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
    return NextResponse.json({ data: await seedBetaTable(table, rows) });
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

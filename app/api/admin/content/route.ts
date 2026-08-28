import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient, verifyAdminToken } from "@/lib-next/admin";
import { createPublicClient } from "@/lib-next/supabase";

const TABLES = new Set([
  "packs",
  "prompts",
  "skills",
  "resources",
  "site_assets",
  "categories",
  "ai_logos",
  "site_content",
]);
const immutableFields = new Set(["id", "created_at", "updated_at"]);
async function authorized() {
  return verifyAdminToken((await cookies()).get("ev_admin")?.value);
}
function tableFrom(request: Request) {
  const table = new URL(request.url).searchParams.get("table") || "";
  if (!TABLES.has(table)) throw new Error("Unsupported content type");
  return table;
}

export async function GET(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const table = tableFrom(request);
    let client;
    try {
      client = createAdminClient();
    } catch {
      client = createPublicClient();
    }
    const { data, error } = await client
      .from(table)
      .select("*")
      .order(table === "site_content" ? "key" : "created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data, readOnly: !process.env.SUPABASE_SERVICE_ROLE_KEY });
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
    const primaryKey = table === "site_content" ? "key" : "id";
    const { error } = await createAdminClient().from(table).update(cleanPatch).eq(primaryKey, id);
    if (error) throw error;
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
    const { data, error } = await createAdminClient()
      .from(table)
      .insert(clean)
      .select("*")
      .single();
    if (error) throw error;
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
    const primaryKey = table === "site_content" ? "key" : "id";
    const { error } = await createAdminClient().from(table).delete().eq(primaryKey, id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin delete failed" },
      { status: 503 },
    );
  }
}

import { NextResponse } from "next/server";
import { readBetaTable, seedBetaTable, writeBetaTable } from "@/lib-next/beta-content";
import { createPublicClient } from "@/lib-next/supabase";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function seed() {
  const { data, error } = await createPublicClient()
    .from("waitlist_signups")
    .select("*")
    .order("created_at", { ascending: false });
  return error ? [] : (data ?? []);
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      email?: unknown;
      name?: unknown;
      interests?: unknown;
      source?: unknown;
      company?: unknown;
    };
    if (typeof input.company === "string" && input.company) return NextResponse.json({ ok: true });
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (email.length > 320 || !emailPattern.test(email))
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const rows =
      (await readBetaTable("waitlist_signups")) ??
      (await seedBetaTable("waitlist_signups", await seed()));
    if (rows.some((row) => String(row.email).toLowerCase() === email))
      return NextResponse.json({ ok: true, existing: true });
    const now = new Date().toISOString();
    rows.unshift({
      id: crypto.randomUUID(),
      email,
      name: typeof input.name === "string" ? input.name.trim().slice(0, 100) : "",
      interests: typeof input.interests === "string" ? input.interests.trim().slice(0, 1000) : "",
      source: typeof input.source === "string" ? input.source.trim().slice(0, 80) : "website",
      created_at: now,
      updated_at: now,
    });
    await writeBetaTable("waitlist_signups", rows);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to join right now." }, { status: 503 });
  }
}

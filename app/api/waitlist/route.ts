import { NextResponse } from "next/server";
import { readBetaTable, seedBetaTable } from "@/lib-next/beta-content";
import { captureWaitlist } from "@/lib-next/waitlist-capture";
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
    if (!(await readBetaTable("waitlist_signups")))
      await seedBetaTable("waitlist_signups", await seed());
    const { existing } = await captureWaitlist({
      email,
      name: typeof input.name === "string" ? input.name.trim().slice(0, 100) : "",
      interests: typeof input.interests === "string" ? input.interests.trim().slice(0, 1000) : "",
      source: typeof input.source === "string" ? input.source.trim().slice(0, 80) : "website",
    });
    return NextResponse.json({ ok: true, existing }, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Unable to join right now." }, { status: 503 });
  }
}

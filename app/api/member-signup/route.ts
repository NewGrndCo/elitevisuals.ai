import { safeDestination } from "@/lib-next/content-policy";
import { NextResponse } from "next/server";
import { readBetaTable, seedBetaTable, writeBetaTable } from "@/lib-next/beta-content";
import { getMemberOrigin } from "@/lib-next/member-redirect";
import { createPublicClient } from "@/lib-next/supabase";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { email?: unknown; next?: unknown; company?: unknown };
    if (typeof input.company === "string" && input.company) return NextResponse.json({ ok: true });
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (email.length > 320 || !emailPattern.test(email))
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    const next = safeDestination(input.next);
    // Never inherit a preview host (for example a Lovable preview) for member links.
    // Supabase must also allow this URL in Authentication > URL Configuration.
    const origin = getMemberOrigin();
    const { error } = await createPublicClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}${next}`, shouldCreateUser: true },
    });
    if (error) throw error;

    const rows =
      (await readBetaTable("member_signups")) ?? (await seedBetaTable("member_signups", []));
    if (!rows.some((row) => String(row.email).toLowerCase() === email)) {
      const now = new Date().toISOString();
      rows.unshift({ id: crypto.randomUUID(), email, created_at: now, source: "member-access" });
      await writeBetaTable("member_signups", rows);
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to send a sign-in link right now." },
      { status: 503 },
    );
  }
}

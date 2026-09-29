import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminToken, verifyAdminToken } from "@/lib-next/admin";

const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: Request) {
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!process.env.ADMIN_PIN)
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  const state = attempts.get(ip);
  if (state && state.reset > now && state.count >= 5)
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.pin !== "string" || body.pin.length > 128)
    return NextResponse.json({ error: "Enter a valid PIN." }, { status: 400 });
  const { pin } = body;
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
    attempts.set(ip, {
      count: state?.reset && state.reset > now ? state.count + 1 : 1,
      reset: now + 15 * 60_000,
    });
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }
  attempts.delete(ip);
  let token: string;
  let maxAge: number;
  try {
    ({ token, maxAge } = createAdminToken());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin session is not configured." },
      { status: 503 },
    );
  }
  const jar = await cookies();
  jar.set("ev_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete("ev_admin");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(
    { authenticated: verifyAdminToken((await cookies()).get("ev_admin")?.value) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

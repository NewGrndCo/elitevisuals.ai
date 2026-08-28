import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminToken } from "@/lib-next/admin";

const attempts = new Map<string, { count: number; reset: number }>();
const betaPin = "1293";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  const state = attempts.get(ip);
  if (state && state.reset > now && state.count >= 5)
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  const { pin } = (await request.json()) as { pin?: string };
  if (pin !== (process.env.ADMIN_PIN || betaPin)) {
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

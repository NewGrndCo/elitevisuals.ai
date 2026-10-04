import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib-next/supabase";
import { MEMBER_COOKIE } from "@/lib-next/member-server";
import { captureMember } from "@/lib-next/member-capture";

const privateHeaders = { "Cache-Control": "private, no-store" };
function allowed(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!allowed(request))
    return NextResponse.json(
      { error: "Invalid origin." },
      { status: 403, headers: privateHeaders },
    );
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer ([A-Za-z0-9._-]{1,3500})$/)?.[1];
  if (!token)
    return NextResponse.json({ error: "Sign in again." }, { status: 401, headers: privateHeaders });
  try {
    const { data, error } = await createPublicClient().auth.getUser(token);
    if (error || !data.user || data.user.is_anonymous)
      return NextResponse.json(
        { error: "Sign in again." },
        { status: 401, headers: privateHeaders },
      );
    // Persist verified identity before confirming the server session. A storage
    // failure is explicit and retryable, never silently reported as captured.
    await captureMember({
      email: data.user.email || "",
      userId: data.user.id,
      signedInAt: data.user.last_sign_in_at || new Date().toISOString(),
    });
    (await cookies()).set(MEMBER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch {
    return NextResponse.json(
      { error: "Unable to verify your session. Please retry." },
      { status: 503, headers: privateHeaders },
    );
  }
}

export async function DELETE(request: Request) {
  if (!allowed(request))
    return NextResponse.json(
      { error: "Invalid origin." },
      { status: 403, headers: privateHeaders },
    );
  (await cookies()).delete(MEMBER_COOKIE);
  return NextResponse.json({ ok: true }, { headers: privateHeaders });
}

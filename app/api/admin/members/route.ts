import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib-next/admin";
import { readBetaTable } from "@/lib-next/beta-content";

export async function GET() {
  if (!verifyAdminToken((await cookies()).get("ev_admin")?.value))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json(
      {
        data: ((await readBetaTable("member_signups")) ?? []).map((member) => ({
          ...member,
          status: member.status || (member.last_signed_in_at ? "Signed in" : "Link requested"),
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Unable to load member accounts." }, { status: 503 });
  }
}

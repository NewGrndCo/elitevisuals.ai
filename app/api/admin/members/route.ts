import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib-next/admin";
import { readBetaTable } from "@/lib-next/beta-content";

export async function GET() {
  if (!verifyAdminToken((await cookies()).get("ev_admin")?.value))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json({ data: (await readBetaTable("member_signups")) ?? [] });
  } catch {
    return NextResponse.json({ error: "Unable to load member accounts." }, { status: 503 });
  }
}

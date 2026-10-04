import { NextResponse } from "next/server";
import { isWorkspaceVisible } from "@/lib-next/supabase";

export async function GET() {
  return NextResponse.json(
    { visible: await isWorkspaceVisible() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

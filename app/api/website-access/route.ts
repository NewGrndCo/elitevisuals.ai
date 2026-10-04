import { NextResponse } from "next/server";
import { isEmailAccessRequired } from "@/lib-next/website-access";

export async function GET() {
  return NextResponse.json(
    { required: await isEmailAccessRequired() },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}

import { NextResponse } from "next/server";
import { createPublicClient, getSkill } from "@/lib-next/supabase";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Sign in to download." }, { status: 401 });

  const { data, error } = await createPublicClient().auth.getUser(token);
  if (error || !data.user)
    return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 });

  const skill = await getSkill((await params).slug);
  if (!skill?.download_url)
    return NextResponse.json({ error: "This package is not available." }, { status: 404 });

  const source = new URL(skill.download_url, new URL(request.url).origin);
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok || !response.body)
    return NextResponse.json({ error: "The package could not be loaded." }, { status: 502 });

  return new Response(response.body, {
    headers: {
      "content-type": response.headers.get("content-type") || "application/zip",
      "content-disposition": `attachment; filename="${skill.slug}.zip"`,
      "cache-control": "private, no-store",
    },
  });
}

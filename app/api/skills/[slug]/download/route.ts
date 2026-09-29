import { NextResponse } from "next/server";
import { createPublicClient, getSkill } from "@/lib-next/supabase";
import { getBetaAssetStore } from "@/lib-next/beta-content";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Sign in to download." }, { status: 401 });
    const { data, error } = await createPublicClient().auth.getUser(token);
    if (error || !data.user)
      return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 });
    const skill = await getSkill((await params).slug);
    if (!skill?.download_url)
      return NextResponse.json({ error: "This package is not available." }, { status: 404 });
    const filename = skill.slug.replace(/[^a-zA-Z0-9_-]/g, "-");
    const headers = {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}.zip"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    };
    if (skill.download_url.startsWith("/api/media/assets/skill-package/")) {
      const file = await getBetaAssetStore().get(skill.download_url.slice("/api/media/".length), {
        type: "arrayBuffer",
      });
      return file
        ? new Response(file, { headers })
        : NextResponse.json({ error: "Package not found." }, { status: 404 });
    }
    const source = new URL(skill.download_url);
    const supabase = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    );
    if (
      source.protocol !== "https:" ||
      source.origin !== supabase.origin ||
      !source.pathname.startsWith("/storage/v1/object/") ||
      source.username ||
      source.password
    )
      return NextResponse.json({ error: "This package source is not supported." }, { status: 400 });
    const response = await fetch(source, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok || !response.body)
      return NextResponse.json({ error: "The package could not be loaded." }, { status: 502 });
    return new Response(response.body, { headers });
  } catch {
    return NextResponse.json({ error: "Download unavailable. Please retry." }, { status: 503 });
  }
}

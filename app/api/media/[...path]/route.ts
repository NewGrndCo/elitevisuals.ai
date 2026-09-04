import { NextResponse } from "next/server";
import { getBetaAssetStore } from "@/lib-next/beta-content";
import { createPublicClient } from "@/lib-next/supabase";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join("/");
  if (!key.startsWith("assets/")) return new NextResponse("Not found", { status: 404 });
  if (key.startsWith("assets/skill-package/")) {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return new NextResponse("Sign in required", { status: 401 });
    const { data, error } = await createPublicClient().auth.getUser(token);
    if (error || !data.user) return new NextResponse("Invalid session", { status: 401 });
  }
  const store = getBetaAssetStore();
  const [data, metadata] = await Promise.all([
    store.get(key, { type: "arrayBuffer" }),
    store.getMetadata(key),
  ]);
  if (!data) return new NextResponse("Not found", { status: 404 });
  const details = (metadata?.metadata || {}) as Record<string, string>;
  const filename = String(details.filename || "download").replace(/["\r\n]/g, "");
  return new NextResponse(data, {
    headers: {
      "Content-Type": details.contentType || "application/octet-stream",
      "Content-Disposition": `${details.disposition || "inline"}; filename="${filename}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

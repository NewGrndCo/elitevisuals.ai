import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBetaAssetStore } from "@/lib-next/beta-content";
import { verifyAdminToken } from "@/lib-next/admin";

const chunkLimit = 4 * 1024 * 1024;
// Netlify's streamed function response ceiling is 20 MB, so uploaded files stay
// below it to guarantee they can also be downloaded through the media route.
const fileLimit = 18 * 1024 * 1024;
const allowedKinds = new Set([
  "prompt-cover",
  "prompt-demo",
  "skill-cover",
  "skill-package",
  "resource-image",
]);

async function authorized() {
  return verifyAdminToken((await cookies()).get("ev_admin")?.value);
}

function safeName(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "upload"
  );
}

function uploadInfo(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") || "";
  const uploadId = url.searchParams.get("uploadId") || "";
  const filename = decodeURIComponent(request.headers.get("x-file-name") || "upload");
  const contentType = request.headers.get("x-file-type") || "application/octet-stream";
  if (!allowedKinds.has(kind)) throw new Error("Unsupported upload type");
  if (!/^[a-f0-9-]{16,64}$/i.test(uploadId)) throw new Error("Invalid upload session");
  if (kind === "skill-package" && !filename.toLowerCase().endsWith(".zip"))
    throw new Error("Skill packages must be ZIP files");
  if (kind.endsWith("cover") || kind === "resource-image") {
    if (!contentType.startsWith("image/")) throw new Error("Please choose an image file");
  }
  if (kind === "prompt-demo" && !contentType.startsWith("video/"))
    throw new Error("Please choose a video file");
  return { kind, uploadId, filename: safeName(filename), contentType };
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage");
    const info = uploadInfo(request);
    const store = getBetaAssetStore();

    if (stage === "chunk") {
      const index = Number(url.searchParams.get("index"));
      const total = Number(url.searchParams.get("total"));
      const bytes = await request.arrayBuffer();
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        !Number.isInteger(total) ||
        total < 1 ||
        index >= total
      )
        return NextResponse.json({ error: "Invalid chunk position" }, { status: 400 });
      if (!bytes.byteLength || bytes.byteLength > chunkLimit)
        return NextResponse.json({ error: "Upload chunk is too large" }, { status: 413 });
      await store.set(`temp/${info.uploadId}/${index}`, bytes);
      return NextResponse.json({ ok: true });
    }

    if (stage === "complete") {
      const total = Number(url.searchParams.get("total"));
      if (!Number.isInteger(total) || total < 1 || total > Math.ceil(fileLimit / chunkLimit))
        return NextResponse.json({ error: "Invalid upload size" }, { status: 400 });
      const chunks = await Promise.all(
        Array.from({ length: total }, (_, index) =>
          store.get(`temp/${info.uploadId}/${index}`, { type: "arrayBuffer" }),
        ),
      );
      if (chunks.some((chunk) => !chunk))
        return NextResponse.json({ error: "Upload is incomplete. Please retry." }, { status: 409 });
      const parts = chunks as ArrayBuffer[];
      const size = parts.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const file = new Uint8Array(size);
      let offset = 0;
      for (const chunk of parts) {
        file.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }
      if (file.byteLength > fileLimit)
        return NextResponse.json({ error: "Files must be 18 MB or smaller" }, { status: 413 });
      const key = `assets/${info.kind}/${crypto.randomUUID()}-${info.filename}`;
      await store.set(key, file.buffer, {
        metadata: {
          contentType: info.contentType,
          filename: info.filename,
          disposition: info.kind === "skill-package" ? "attachment" : "inline",
          uploadedAt: new Date().toISOString(),
        },
      });
      await Promise.all(
        Array.from({ length: total }, (_, index) => store.delete(`temp/${info.uploadId}/${index}`)),
      );
      return NextResponse.json({
        url: `/api/media/${key}`,
        filename: info.filename,
        size: file.byteLength,
      });
    }

    return NextResponse.json({ error: "Unsupported upload stage" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 503 },
    );
  }
}

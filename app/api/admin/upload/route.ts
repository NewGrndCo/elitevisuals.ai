import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBetaAssetStore } from "@/lib-next/beta-content";
import { verifyAdminToken } from "@/lib-next/admin";

import {
  CHUNK_SIZE as chunkLimit,
  FILE_LIMIT as fileLimit,
  fileError,
  matchesSignature,
} from "@/lib-next/upload-policy";
import { mutateBetaTable } from "@/lib-next/beta-content";
import { InputError } from "@/lib-next/cms-validation";

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
  if (!/^[a-f0-9-]{16,64}$/i.test(uploadId)) throw new InputError("Invalid upload session");
  const problem = fileError(kind, filename, contentType, 1);
  if (problem) throw new InputError(problem);
  return { kind, uploadId, filename: safeName(filename), contentType };
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage");
    const info = uploadInfo(request);
    const store = getBetaAssetStore();

    if (stage === "chunk") {
      const index = Number(url.searchParams.get("index"));
      const total = Number(url.searchParams.get("total"));
      if (Number(request.headers.get("content-length")) > chunkLimit)
        return NextResponse.json({ error: "Chunk too large" }, { status: 413 });
      const bytes = await request.arrayBuffer();
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        !Number.isInteger(total) ||
        total < 1 ||
        total > Math.ceil(fileLimit / chunkLimit) ||
        index >= total
      )
        return NextResponse.json({ error: "Invalid chunk position" }, { status: 400 });
      if (!bytes.byteLength || bytes.byteLength > chunkLimit)
        return NextResponse.json({ error: "Upload chunk is too large" }, { status: 413 });
      const descriptor = JSON.stringify({ ...info, total });
      await store.set(`temp/${info.uploadId}/manifest`, descriptor, { onlyIfNew: true });
      if ((await store.get(`temp/${info.uploadId}/manifest`, { type: "text" })) !== descriptor)
        throw new InputError("Upload session does not match this file.");
      await store.set(`temp/${info.uploadId}/${index}`, bytes);
      return NextResponse.json({ ok: true });
    }

    if (stage === "complete") {
      const total = Number(url.searchParams.get("total"));
      if (!Number.isInteger(total) || total < 1 || total > Math.ceil(fileLimit / chunkLimit))
        return NextResponse.json({ error: "Invalid upload size" }, { status: 400 });
      if (
        (await store.get(`temp/${info.uploadId}/manifest`, { type: "text" })) !==
        JSON.stringify({ ...info, total })
      )
        throw new InputError("Upload session does not match this file.");
      const completed = await store.get(`temp/${info.uploadId}/result`, { type: "json" });
      if (completed) return NextResponse.json(completed);
      const chunks = await Promise.all(
        Array.from({ length: total }, (_, index) =>
          store.get(`temp/${info.uploadId}/${index}`, { type: "arrayBuffer" }),
        ),
      );
      if (chunks.some((chunk) => !chunk))
        return NextResponse.json({ error: "Upload is incomplete. Please retry." }, { status: 409 });
      const parts = chunks as ArrayBuffer[];
      const size = parts.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      if (!size || size > fileLimit)
        throw new InputError("Files must be non-empty and 18 MB or smaller.");
      const file = new Uint8Array(size);
      let offset = 0;
      for (const chunk of parts) {
        file.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }
      if (file.byteLength > fileLimit)
        return NextResponse.json({ error: "Files must be 18 MB or smaller" }, { status: 413 });
      if (!matchesSignature(file, info.contentType, info.kind))
        throw new InputError("File contents do not match the selected type.");
      const key = `assets/${info.kind}/${info.uploadId}-${info.filename}`;
      await store.set(key, file.buffer, {
        metadata: {
          contentType: info.kind === "skill-package" ? "application/zip" : info.contentType,
          filename: info.filename,
          disposition:
            info.kind === "skill-package" || info.contentType === "application/pdf"
              ? "attachment"
              : "inline",
          uploadedAt: new Date().toISOString(),
        },
      });
      const result = { url: `/api/media/${key}`, filename: info.filename, size: file.byteLength };
      await mutateBetaTable("site_assets", (rows) =>
        rows.some((row) => row.url === result.url)
          ? rows
          : [
              {
                id: info.uploadId,
                name: info.filename,
                asset_key: info.uploadId,
                asset_type:
                  info.kind === "skill-package"
                    ? "document"
                    : info.contentType.startsWith("video/")
                      ? "video"
                      : info.contentType.startsWith("image/")
                        ? "image"
                        : "document",
                url: result.url,
                alt_text: "",
                notes: "Uploaded media",
                is_published: false,
                created_at: new Date().toISOString(),
              },
              ...rows,
            ],
      );
      await store.setJSON(`temp/${info.uploadId}/result`, result);
      await Promise.all(
        Array.from({ length: total }, (_, index) => store.delete(`temp/${info.uploadId}/${index}`)),
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unsupported upload stage" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: error instanceof InputError ? 400 : 503 },
    );
  }
}

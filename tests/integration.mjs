import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const base = "http://localhost:3100";
let cookie = "";
const checks = [];
async function req(path, method = "GET", data, expected = 200, extra = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(data ? { "content-type": "application/json" } : {}),
      ...extra.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...extra,
  });
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${response.status} ${await response
      .clone()
      .text()
      .then((s) => s.slice(0, 160))}`,
  );
  return response;
}
for (const path of [
  "/api/admin/content?table=prompts",
  "/api/admin/members",
  "/api/prompts/test",
  "/api/skills/test/download",
  "/api/media/assets/skill-package/test.zip",
])
  await req(path, "GET", undefined, 401);
await req("/api/admin/upload?stage=chunk", "POST", {}, 401);
checks.push("Anonymous CMS, prompt and package access rejected");
const login = await req("/api/admin/session", "POST", { pin: "local-test-9245" });
cookie = login.headers.get("set-cookie").split(";")[0];
assert.equal((await (await req("/api/admin/session")).json()).authenticated, true);
for (const table of [
  "packs",
  "prompts",
  "skills",
  "resources",
  "site_assets",
  "categories",
  "site_content",
  "ai_logos",
  "waitlist_signups",
])
  await req(`/api/admin/content?table=${table}`);
checks.push("Session restoration and all existing CMS tables load");
await req(
  "/api/admin/content?table=prompts",
  "POST",
  { data: { title: "bad", slug: "../bad", prompt_text: "bad" } },
  400,
);
await req(
  "/api/admin/content?table=prompts",
  "POST",
  {
    data: { title: "bad", slug: "bad", prompt_text: "bad", cover_image_url: "javascript:alert(1)" },
  },
  400,
);
await req(
  "/api/admin/content?table=prompts",
  "POST",
  { data: { title: "bad", slug: "bad", prompt_text: "bad" } },
  403,
  { headers: { cookie, origin: "https://example.invalid", "content-type": "application/json" } },
);
checks.push("Invalid fields, unsafe URLs and cross-origin writes rejected");
const slug = `qa-${randomUUID()}`;
const secret = "LOCAL_TEST_PROMPT_DO_NOT_EXPOSE_93";
let row = (
  await (
    await req(
      "/api/admin/content?table=prompts",
      "POST",
      { data: { title: "Local QA draft", slug, prompt_text: secret, is_published: false } },
      201,
    )
  ).json()
).data;
await req(`/prompt/${slug}`, "GET", undefined, 404);
await req("/api/admin/content?table=prompts", "PATCH", {
  id: row.id,
  patch: { is_published: true },
  expectedUpdatedAt: row.updated_at,
});
await req(
  "/api/admin/content?table=prompts",
  "PATCH",
  { id: row.id, patch: { title: "stale update" }, expectedUpdatedAt: row.updated_at },
  409,
);
let html = await (await req(`/prompt/${slug}`)).text();
assert.ok(!html.includes(secret), "Private prompt leaked into page response");
checks.push("Draft 404, publication, stale edit conflict and no prompt text in anonymous HTML");
await req("/api/admin/content?table=prompts", "PATCH", {
  id: row.id,
  patch: { publish_at: "2099-01-01T00:00:00Z" },
});
await req(`/prompt/${slug}`, "GET", undefined, 404);
await req("/api/admin/content?table=prompts", "PATCH", {
  id: row.id,
  patch: { publish_at: null, archived_at: new Date().toISOString() },
});
await req(`/prompt/${slug}`, "GET", undefined, 404);
await req("/api/admin/content?table=prompts", "PATCH", {
  id: row.id,
  patch: { archived_at: null, is_published: true },
});
await req(`/prompt/${slug}`);
checks.push("Scheduling, archive and restore are enforced on public detail routes");
const png = await readFile("app/icon.png");
const uploadId = randomUUID();
const query = `kind=site-asset&uploadId=${uploadId}&total=1`;
const headers = {
  cookie,
  "x-file-name": "qa-image.png",
  "x-file-type": "image/png",
  "content-type": "application/octet-stream",
};
let result = await fetch(`${base}/api/admin/upload?${query}&stage=chunk&index=0`, {
  method: "POST",
  headers,
  body: png,
});
assert.equal(result.status, 200, await result.text());
result = await fetch(`${base}/api/admin/upload?${query}&stage=complete`, {
  method: "POST",
  headers,
});
assert.equal(result.status, 200);
const media = await result.json();
const asset = await req(media.url);
assert.equal(asset.headers.get("content-type"), "image/png");
assert.equal((await asset.arrayBuffer()).byteLength, png.byteLength);
result = await fetch(`${base}/api/admin/upload?${query}&stage=complete`, {
  method: "POST",
  headers,
});
assert.equal(result.status, 200);
assert.equal((await result.json()).url, media.url);
const library = (await (await req("/api/admin/content?table=site_assets")).json()).data;
assert.ok(library.some((r) => r.url === media.url));
const spoof = randomUUID();
const spoofQuery = `kind=site-asset&uploadId=${spoof}&total=1`;
result = await fetch(`${base}/api/admin/upload?${spoofQuery}&stage=chunk&index=0`, {
  method: "POST",
  headers,
  body: "<script>not an image</script>",
});
assert.equal(result.status, 200);
result = await fetch(`${base}/api/admin/upload?${spoofQuery}&stage=complete`, {
  method: "POST",
  headers,
});
assert.equal(result.status, 400);
checks.push(
  "Chunk upload, media serving, automatic library registration, retry idempotency and signature validation",
);
await req("/api/admin/content?table=prompts", "DELETE", { id: row.id });
await req(`/prompt/${slug}`, "GET", undefined, 404);
checks.push("Local test content deletion succeeds");
for (const path of [
  "/",
  "/promptbox",
  "/skills",
  "/resources",
  "/waitlist",
  "/terms",
  "/privacy",
  "/login",
  "/library",
  "/sitemap.xml",
  "/robots.txt",
])
  await req(path);
let detailCount = 0;
for (const [table, prefix] of [
  ["packs", "pack"],
  ["prompts", "prompt"],
  ["skills", "skill"],
]) {
  const original = JSON.parse(await readFile(`.netlify/refinement-baseline/${table}.json`, "utf8"));
  for (const item of original) {
    const published = item.is_published && !item.archived_at;
    await req(
      `/${prefix}/${encodeURIComponent(item.slug)}`,
      "GET",
      undefined,
      published ? 200 : 404,
    );
    detailCount++;
  }
}
checks.push(
  `Public pages and ${detailCount} existing detail URLs verified, including unpublished 404s`,
);
await req("/api/admin/session", "DELETE");
cookie = "";
await req("/api/admin/content?table=prompts", "GET", undefined, 401);
checks.push("Logout clears admin access");
await writeFile(
  "project-spec/integration-results.json",
  JSON.stringify(
    { environment: "isolated local Netlify Blobs emulator, production Next.js build", checks },
    null,
    2,
  ),
);
console.log(checks.map((c) => `PASS ${c}`).join("\n"));

import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL?.includes("/lib-next/") &&
      specifier.startsWith("./") &&
      !/\.[a-z]+$/.test(specifier)
    )
      return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});
const { isVisible, safeUrl, safeDestination } = await import("../lib-next/content-policy.ts");
const { fileError, matchesSignature, FILE_LIMIT } = await import("../lib-next/upload-policy.ts");
const { validateContent } = await import("../lib-next/cms-validation.ts");
const { createAdminToken, verifyAdminToken } = await import("../lib-next/admin.ts");
test("publication protects drafts, archives and future schedules", () => {
  const now = Date.parse("2026-09-04T12:00:00Z");
  assert.equal(isVisible({ is_published: true }, false, now), true);
  assert.equal(isVisible({ is_published: false }, false, now), false);
  assert.equal(isVisible({ is_published: true, archived_at: "2026-08-01" }, false, now), false);
  assert.equal(isVisible({ is_published: true, publish_at: "2026-09-05" }, false, now), false);
  assert.equal(
    isVisible({ is_published: true, publish_at: "2026-09-04T12:00:00Z" }, false, now),
    true,
  );
  assert.equal(isVisible({ is_published: true, publish_at: "invalid" }, false, now), false);
});
test("CMS rejects unsafe URLs and invalid form payloads", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "//evil.example",
    "https://user:pass@example.com",
  ])
    assert.equal(safeUrl(url), false);
  assert.equal(safeUrl("/api/media/assets/image.png"), true);
  assert.throws(() => validateContent("skills", { price_cents: -1 }, true));
  assert.throws(() => validateContent("prompts", { is_published: "true" }, true));
  assert.throws(() => validateContent("prompts", { id: "replacement" }, true));
  assert.throws(() => validateContent("prompts", { slug: "../../admin" }, true));
  assert.throws(() => validateContent("prompts", { title: "" }));
  assert.deepEqual(validateContent("prompts", { is_published: false, sort_order: 2 }, true), {
    is_published: false,
    sort_order: 2,
  });
});
test("uploads reject active content, MIME spoofing and invalid sizes", () => {
  assert.ok(fileError("prompt-cover", "x.svg", "image/svg+xml", 100));
  assert.ok(fileError("prompt-cover", "x.png", "image/png", FILE_LIMIT + 1));
  assert.ok(fileError("prompt-cover", "x.png", "image/png", 0));
  assert.equal(fileError("site-asset", "x.png", "image/png", 100), "");
  assert.ok(fileError("site-asset", "skill.zip", "application/zip", 100));
  assert.equal(
    matchesSignature(
      new TextEncoder().encode("<script>alert(1)</script>"),
      "image/png",
      "prompt-cover",
    ),
    false,
  );
  assert.equal(
    matchesSignature(
      Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/png",
      "prompt-cover",
    ),
    true,
  );
});
test("sign-in destinations cannot leave the site", () => {
  assert.equal(safeDestination("//evil.example"), "/promptbox");
  assert.equal(safeDestination("/\\evil.example"), "/promptbox");
  assert.equal(safeDestination("/prompt/test"), "/prompt/test");
});
test("admin tokens fail closed without a secret and reject tampering", () => {
  const old = process.env.ADMIN_SESSION_SECRET,
    service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.ADMIN_SESSION_SECRET;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.equal(verifyAdminToken("123"), false);
  assert.throws(() => createAdminToken());
  process.env.ADMIN_SESSION_SECRET = "test-secret-used-only-by-unit-tests";
  const { token } = createAdminToken();
  assert.equal(verifyAdminToken(token), true);
  assert.equal(verifyAdminToken(`${token}extra`), false);
  assert.equal(verifyAdminToken(token.replace(/^\d/, "0")), false);
  if (old) process.env.ADMIN_SESSION_SECRET = old;
  else delete process.env.ADMIN_SESSION_SECRET;
  if (service) process.env.SUPABASE_SERVICE_ROLE_KEY = service;
});

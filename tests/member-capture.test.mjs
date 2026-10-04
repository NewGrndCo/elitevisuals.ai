import test, { after } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BlobsServer } from "@netlify/blobs/server";
import { getStore, setEnvironmentContext } from "@netlify/blobs";

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
const { mergeMember, captureMember } = await import("../lib-next/member-capture.ts");

test("sign-ins upgrade pending rows without losing IDs, dates, or other members", () => {
  const original = [
    { id: "old", email: "Person@Example.test", created_at: "2026-09-01", source: "member-access" },
    { id: "other", email: "other@example.test" },
  ];
  const result = mergeMember(original, {
    email: " person@example.test ",
    userId: "auth-id",
    signedInAt: "2026-10-04",
  });
  assert.equal(result.length, 2);
  assert.equal(result[0].id, "old");
  assert.equal(result[0].created_at, "2026-09-01");
  assert.equal(result[0].status, "Signed in");
  assert.equal(result[0].auth_user_id, "auth-id");
  assert.equal(result[0].last_signed_in_at, "2026-10-04");
  assert.equal(original[0].email, "Person@Example.test");
  assert.equal(mergeMember(result, { email: "person@example.test" })[0].status, "Signed in");
  assert.throws(() => mergeMember([], { email: "" }));
});

test("repeat sign-ins deduplicate emails and handle the same user's changed email", () => {
  const rows = mergeMember([], {
    email: "old@example.test",
    userId: "user-id",
    signedInAt: "2026-10-03",
  });
  const result = mergeMember(rows, {
    email: "new@example.test",
    userId: "user-id",
    signedInAt: "2026-10-04",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, rows[0].id);
  assert.equal(result[0].email, "new@example.test");
  assert.equal(result[0].last_signed_in_at, "2026-10-04");
});

const directory = await mkdtemp(join(tmpdir(), "elitevisuals-member-test-"));
const server = new BlobsServer({ directory, token: "local-member-test-token" });
const { port } = await server.start();
setEnvironmentContext({
  siteID: "local-member-test",
  token: "local-member-test-token",
  apiURL: `http://127.0.0.1:${port}`,
  uncachedEdgeURL: `http://127.0.0.1:${port}`,
  edgeURL: `http://127.0.0.1:${port}`,
});
process.env.CONTEXT = "dev";
after(() => server.stop());
const store = getStore({ name: "elitevisuals-beta-cms-preview", consistency: "strong" });

test("real local Blobs storage preserves concurrent captures and repeated sign-ins", async () => {
  await store.setJSON("tables/member_signups.json", []);
  await Promise.all([
    captureMember({ email: "first@example.test", userId: "first", signedInAt: "2026-10-04" }),
    captureMember({ email: "second@example.test", userId: "second", signedInAt: "2026-10-04" }),
  ]);
  await captureMember({ email: "FIRST@example.test", userId: "first", signedInAt: "2026-10-05" });
  const rows = await store.get("tables/member_signups.json", { type: "json" });
  assert.equal(rows.length, 2);
  assert.equal(
    rows.find((row) => row.email === "first@example.test").last_signed_in_at,
    "2026-10-05",
  );
  assert.ok(rows.some((row) => row.email === "second@example.test"));
});

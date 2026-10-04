import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFile } from "node:fs/promises";

// Explicit test-only auth backend; no production sessions or credential reads.
const mockUrl = `data:text/javascript,${encodeURIComponent(`
export const state = { user: null, error: null, cookie: null, writes: [], deleted: false, members: [], captureFails: false, contentReads: 0, accessRequired: true };
export const isEmailAccessRequired = async () => state.accessRequired;
export const cookies = async () => ({
 get: () => state.cookie ? { value: state.cookie } : undefined,
 set: (...args) => { state.writes.push(args); state.cookie = args[1]; },
 delete: () => { state.deleted = true; state.cookie = null; }
});
export const createPublicClient = () => ({auth: { getUser: async () => ({data: {user: state.user}, error: state.error}) }});
export const getPrompt = async () => { state.contentReads++; return {prompt_text: 'test prompt'}; };
export const getSkill = async () => { state.contentReads++; return null; };
export const getBetaAssetStore = () => { throw new Error('Unexpected package storage access'); };
export const redirect = (url) => { throw new Error('REDIRECT:' + url); };
export class ContentConflict extends Error {}
export const mutateBetaTable = async (table, change) => {
 if (state.captureFails) throw new Error('test storage outage');
 state.members = change(structuredClone(state.members));
 return state.members;
};
`)}`;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      [
        "next/headers",
        "next/navigation",
        "@/lib-next/supabase",
        "./supabase",
        "./website-access",
        "@/lib-next/website-access",
      ].includes(specifier)
    )
      return { url: mockUrl, shortCircuit: true };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (["./beta-content", "@/lib-next/beta-content"].includes(specifier))
      return { url: mockUrl, shortCircuit: true };
    if (specifier === "@/lib-next/member-capture")
      return nextResolve(new URL("../lib-next/member-capture.ts", import.meta.url).href, context);
    if (specifier === "@/lib-next/member-server")
      return nextResolve(new URL("../lib-next/member-server.ts", import.meta.url).href, context);
    if (
      context.parentURL?.includes("/lib-next/") &&
      specifier.startsWith("./") &&
      !/\.[a-z]+$/.test(specifier)
    )
      return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});

const { state } = await import(mockUrl);
const { POST, DELETE } = await import("../app/api/member-session/route.ts");
const { getVerifiedMember, requireMember } = await import("../lib-next/member-server.ts");
const { GET: promptGet } = await import("../app/api/prompts/[slug]/route.ts");
const { GET: downloadGet } = await import("../app/api/skills/[slug]/download/route.ts");
const request = (origin = "https://example.test", token = "test.token.signature") =>
  new Request("https://example.test/api/member-session", {
    method: "POST",
    headers: { Origin: origin, Authorization: `Bearer ${token}` },
  });

test("session bridge rejects cross-origin requests and unverified or anonymous users", async () => {
  state.writes = [];
  assert.equal((await POST(request("https://evil.test"))).status, 403);
  assert.equal((await POST(request("null"))).status, 403);
  assert.equal((await POST(request(undefined, "invalid:token"))).status, 401);
  state.user = null;
  assert.equal((await POST(request())).status, 401);
  state.user = { id: "test-user", is_anonymous: true };
  assert.equal((await POST(request())).status, 401);
  assert.equal(state.writes.length, 0);
});

test("verified members receive a private cookie and logout removes it", async () => {
  state.user = { id: "test-user", email: "Member@example.test", is_anonymous: false };
  state.error = null;
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const [name, , options] = state.writes.at(-1);
  assert.equal(name, "ev_member");
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.maxAge, 3600);
  assert.equal(state.members.length, 1);
  assert.equal(state.members[0].email, "member@example.test");
  assert.equal(state.members[0].status, "Signed in");
  assert.equal((await DELETE(request("https://evil.test"))).status, 403);
  assert.equal((await DELETE(request())).status, 200);
  assert.equal(state.deleted, true);
});

test("capture failures cannot silently confirm member sign-in", async () => {
  state.user = { id: "test-user", email: "Member@example.test", is_anonymous: false };
  state.captureFails = true;
  const count = state.writes.length;
  assert.equal((await POST(request())).status, 503);
  assert.equal(state.writes.length, count);
  state.captureFails = false;
});

test("server page guard fails closed and verifies cookie tokens", async () => {
  state.cookie = null;
  await assert.rejects(requireMember("/skills"), /REDIRECT:\/login\?next=%2Fskills/);
  state.cookie = "test.token.signature";
  state.user = { id: "test-user", is_anonymous: false };
  assert.equal((await getVerifiedMember()).id, "test-user");
  state.error = new Error("expired test token");
  assert.equal(await getVerifiedMember(), null);
  await assert.rejects(requireMember("/workspace"), /REDIRECT:/);
  state.error = null;
  state.user = { id: "test-user", is_anonymous: true };
  assert.equal(await getVerifiedMember(), null);
});

test("every navigation destination and detail page guards its server content", async () => {
  for (const route of [
    "promptbox",
    "skills",
    "resources",
    "workspace",
    "prompt/[slug]",
    "pack/[slug]",
    "skill/[slug]",
  ]) {
    const code = await readFile(new URL(`../app/${route}/page.tsx`, import.meta.url), "utf8");
    assert.match(code, /await requireMember\(/, route);
  }
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /border: [67]px solid/);
  assert.match(css, /\.prompt-row\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
});

test("prompt and package APIs reject anonymous and expired users before reading content", async () => {
  const params = { params: Promise.resolve({ slug: "test" }) };
  const authorized = new Request("https://example.test/api/prompts/test", {
    headers: { Authorization: "Bearer test.token.signature" },
  });
  state.contentReads = 0;
  state.error = null;
  for (const user of [null, { id: "anonymous", is_anonymous: true }]) {
    state.user = user;
    assert.equal((await promptGet(authorized, params)).status, 401);
    assert.equal((await downloadGet(authorized, params)).status, 401);
  }
  state.user = { id: "member", is_anonymous: false };
  state.error = new Error("expired");
  assert.equal((await promptGet(authorized, params)).status, 401);
  assert.equal((await downloadGet(authorized, params)).status, 401);
  assert.equal(state.contentReads, 0);
  state.error = null;
  const response = await promptGet(authorized, params);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { prompt: "test prompt" });
  assert.equal((await downloadGet(authorized, params)).status, 404);
});

test("open website access permits guests and re-enabling restores server and API gates", async () => {
  state.user = null;
  state.cookie = null;
  state.error = null;
  state.accessRequired = false;
  const params = { params: Promise.resolve({ slug: "test" }) };
  const guest = new Request("https://example.test/api/prompts/test");
  try {
    assert.equal(await requireMember("/promptbox"), null);
    assert.equal((await promptGet(guest, params)).status, 200);
    assert.equal((await downloadGet(guest, params)).status, 404);
  } finally {
    state.accessRequired = true;
  }
  await assert.rejects(requireMember("/promptbox"), /REDIRECT:/);
  assert.equal((await promptGet(guest, params)).status, 401);
  assert.equal((await downloadGet(guest, params)).status, 401);
});

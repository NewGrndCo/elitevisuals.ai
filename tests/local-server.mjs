// Production-build QA against the official local Netlify Blobs emulator.
// No production writes or live member emails are needed for these tests.
import { BlobsServer } from "@netlify/blobs/server";
import { getStore, setEnvironmentContext } from "@netlify/blobs";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
const directory = resolve(".netlify/refinement-test-store");
await mkdir(directory, { recursive: true });
const server = new BlobsServer({ directory, token: "local-blobs-test-token" });
const { port } = await server.start();
const context = {
  siteID: "local-refinement-test",
  token: "local-blobs-test-token",
  apiURL: `http://127.0.0.1:${port}`,
  uncachedEdgeURL: `http://127.0.0.1:${port}`,
  edgeURL: `http://127.0.0.1:${port}`,
};
setEnvironmentContext(context);
const store = getStore({ name: "elitevisuals-beta-cms-preview", consistency: "strong" });
for (const table of [
  "packs",
  "prompts",
  "skills",
  "resources",
  "ai_logos",
  "site_assets",
  "categories",
  "site_content",
  "waitlist_signups",
  "member_signups",
]) {
  let rows = [];
  try {
    rows = JSON.parse(await readFile(`.netlify/refinement-baseline/${table}.json`, "utf8"));
  } catch {
    /* Tables without a captured baseline start empty locally. */
  }
  await store.setJSON(`tables/${table}.json`, rows);
}
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3100"], {
  stdio: "inherit",
  env: {
    ...process.env,
    CONTEXT: "dev",
    ADMIN_PIN: "local-test-9245",
    ADMIN_SESSION_SECRET: "local-test-secret-not-used-in-production",
    NETLIFY_BLOBS_CONTEXT: Buffer.from(JSON.stringify(context)).toString("base64"),
  },
});
child.on("exit", async (code) => {
  await server.stop();
  process.exit(code ?? 0);
});
process.on("SIGINT", () => child.kill());

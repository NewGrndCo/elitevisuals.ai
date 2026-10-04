import test from "node:test";
import assert from "node:assert/strict";
import { encryptCredential, decryptCredential } from "../lib-next/workspace-admin.ts";

test("workspace credentials encrypt, round-trip, and reject tampering", () => {
  const original = process.env.WORKSPACE_SETTINGS_SECRET;
  process.env.WORKSPACE_SETTINGS_SECRET = "test-only-workspace-encryption-secret";
  try {
    const value = "test-key:test-secret";
    const first = encryptCredential(value);
    assert.ok(!first.includes(value));
    assert.notEqual(first, encryptCredential(value));
    assert.equal(decryptCredential(first), value);
    const parts = first.split(".");
    const data = Buffer.from(parts[2], "base64");
    data[0] ^= 1;
    parts[2] = data.toString("base64");
    assert.throws(() => decryptCredential(parts.join(".")));
  } finally {
    if (original === undefined) delete process.env.WORKSPACE_SETTINGS_SECRET;
    else process.env.WORKSPACE_SETTINGS_SECRET = original;
  }
});

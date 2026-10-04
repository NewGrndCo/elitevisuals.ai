import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

const mockUrl = `data:text/javascript,${encodeURIComponent(`
export const state = { rows: [], fail: false, remote: null, error: null };
export const connection = async () => {};
export const readBetaTable = async () => { if (state.fail) throw new Error('offline'); return state.rows; };
export const createPublicClient = () => ({ from: () => ({ select: () => ({ eq: () => ({
  maybeSingle: async () => ({ data: state.remote, error: state.error })
}) }) }) });
`)}`;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (["next/server", "./beta-content", "./supabase"].includes(specifier))
      return { url: mockUrl, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
const { state } = await import(mockUrl);
const { isEmailAccessRequired, emailAccessRequired } =
  await import("../lib-next/website-access.ts");

test("only explicit boolean false opens the website", () => {
  for (const value of [
    undefined,
    null,
    false,
    {},
    { required: true },
    { required: "false" },
    { required: 0 },
  ])
    assert.equal(emailAccessRequired(value), true);
  assert.equal(emailAccessRequired({ required: false }), false);
});
test("settings default to gated and storage failures never open access", async () => {
  assert.equal(await isEmailAccessRequired(), true);
  state.rows = [{ key: "email_access", value: { required: false } }];
  assert.equal(await isEmailAccessRequired(), false);
  state.rows[0].value.required = true;
  assert.equal(await isEmailAccessRequired(), true);
  state.fail = true;
  assert.equal(await isEmailAccessRequired(), true);
  state.fail = false;
  state.rows = null;
  state.remote = { value: { required: false } };
  assert.equal(await isEmailAccessRequired(), false);
  state.error = new Error("unavailable");
  assert.equal(await isEmailAccessRequired(), true);
});

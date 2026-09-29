import test from "node:test";
import assert from "node:assert/strict";

const { getMemberOrigin } = await import("../lib-next/member-redirect.ts");

test("member callback always rejects Lovable and preview origins", () => {
  assert.equal(getMemberOrigin("https://my-project.lovable.app"), "https://elitevisualsai.netlify.app");
  assert.equal(getMemberOrigin("https://preview--elitevisuals.lovableproject.com"), "https://elitevisualsai.netlify.app");
  assert.equal(getMemberOrigin("https://evil.example"), "https://elitevisualsai.netlify.app");
});

test("member callback accepts only approved EliteVisuals origins", () => {
  assert.equal(getMemberOrigin("https://elitevisualsai.netlify.app/"), "https://elitevisualsai.netlify.app");
  assert.equal(getMemberOrigin("https://elitevisuals.ai/login"), "https://elitevisuals.ai");
  assert.equal(getMemberOrigin("http://elitevisualsai.netlify.app"), "https://elitevisualsai.netlify.app");
  assert.equal(getMemberOrigin(""), "https://elitevisualsai.netlify.app");
});

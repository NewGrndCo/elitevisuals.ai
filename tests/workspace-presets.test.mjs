import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getImagePresets, imagePresetBrief } from "../lib-next/workspace-presets.ts";

test("Enhance receives every image catalog prompt without a preset limit", () => {
  const prompts = Array.from({ length: 27 }, (_, i) => ({
    id: `id-${i}`,
    slug: `prompt-${i}`,
    title: `Image ${i}`,
    prompt_text: `Full prompt ${i}`,
    pack_id: null,
  }));
  prompts.push({
    id: "motion",
    slug: "motion",
    title: "Motion",
    prompt_text: "Motion text",
    pack_id: "kinetic",
  });
  const presets = getImagePresets(prompts);
  assert.equal(presets.length, 27);
  assert.equal(presets[26].promptText, "Full prompt 26");
  assert.equal(presets[26].id, "id-26");
  assert.deepEqual(JSON.parse(JSON.stringify(imagePresetBrief(presets[26]))), {
    id: "id-26",
    slug: "prompt-26",
    title: "Image 26",
    prompt: "Full prompt 26",
  });
  assert.equal(imagePresetBrief(undefined), undefined);
  assert.deepEqual(getImagePresets([]), []);
});

test("image prompt selection participates in saving, restoring and downloading briefs", async () => {
  const code = await readFile(
    new URL("../components-next/workspace-studio.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    code,
    /JSON.stringify\(\{ mode, values, preset, transitionMethod, imagePresetId \}\)/,
  );
  assert.match(code, /saved.imagePresetId/);
  assert.match(code, /imagePresetBrief\(imagePreset\)/);
  assert.match(code, /aria-label="Search image prompts"/);
  assert.match(code, /no longer available/);
});

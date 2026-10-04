import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("showcase cards use responsive optimized images instead of eager originals", async () => {
  const card = await source("components/ui/3d-card.tsx");
  assert.match(card, /import Image from "next\/image"/);
  assert.match(card, /<Image[^>]+sizes=/);
  assert.doesNotMatch(card, /<img\s/);
  assert.doesNotMatch(card, /\bpriority\b|loading="eager"/);
});

test("pointer animation uses motion values without React state churn", async () => {
  for (const file of ["components/ui/3d-card.tsx", "components/ui/tilt.tsx"]) {
    const code = await source(file);
    assert.match(code, /useSpring/);
    assert.doesNotMatch(code, /useState/);
    assert.match(code, /event.pointerType === "touch"/);
    assert.match(code, /rotateX: reduceMotion \? 0/);
    assert.match(code, /rotateY: reduceMotion \? 0/);
  }
});

test("marquee avoids speculative detail requests and homepage reads run concurrently", async () => {
  assert.match(await source("components-next/visual-grid.tsx"), /prefetch=\{false\}/);
  assert.match(
    await source("app/page.tsx"),
    /Promise.all\(\[getHomeData\(\), isWorkspaceVisible\(\)\]\)/,
  );
});

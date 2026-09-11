import assert from "node:assert/strict";
import { classifyLayoutMode, type LayoutMode } from "../src/hooks/useLayoutMode";

const cases: Array<[number, number, LayoutMode]> = [
  [390, 844, "phone-portrait"],
  [844, 390, "phone-landscape"],
  [768, 1024, "tablet"],
  [1024, 768, "tablet"],
  [1280, 720, "desktop"],
  [1920, 1080, "desktop"],
];

for (const [width, height, expected] of cases) {
  assert.equal(classifyLayoutMode(width, height), expected, `${width}x${height} 분류`);
  assert.equal(classifyLayoutMode(width, height, true), "stage", `${width}x${height} stage 우선`);
}

console.log("✓ 6개 기준 해상도와 stage 레이아웃 분류 통과");

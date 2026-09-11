import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_BUDGET_BYTES = 3_000_000;
const CHORD_ASSET_BUDGET_BYTES = 1_800_000;
const MAX_JAVASCRIPT_CHUNK_BYTES = 500_000;
const INITIAL_JAVASCRIPT_GZIP_BUDGET_BYTES = 120_000;
const FONT_BUDGET_BYTES = 450_000;
const EXPECTED_CHORD_COUNT = 80;

const projectDirectory = process.cwd();
const distDirectory = resolve(projectDirectory, "dist");
const sourceStyles = resolve(projectDirectory, "src", "styles", "globals.css");
const fontStyles = resolve(
  projectDirectory,
  "src",
  "assets",
  "fonts",
  "lesson-designer-font.css",
);

interface FileEntry {
  path: string;
  bytes: number;
}

function collectFiles(directory: string): FileEntry[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(absolutePath);
    return [{ path: absolutePath, bytes: statSync(absolutePath).size }];
  });
}

assert.ok(existsSync(distDirectory), "dist가 없습니다. 먼저 npm run build를 실행하세요.");

const files = collectFiles(distDirectory);
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
assert.ok(
  totalBytes < DIST_BUDGET_BYTES,
  `dist ${totalBytes.toLocaleString()}B가 ${DIST_BUDGET_BYTES.toLocaleString()}B 예산을 초과합니다.`,
);

const javascriptFiles = files.filter(({ path }) => extname(path) === ".js");
const largestJavaScript = javascriptFiles.reduce(
  (largest, file) => (file.bytes > largest.bytes ? file : largest),
  { path: "", bytes: 0 },
);
assert.ok(
  largestJavaScript.bytes < MAX_JAVASCRIPT_CHUNK_BYTES,
  `최대 JS 청크 ${largestJavaScript.bytes.toLocaleString()}B가 예산을 초과합니다.`,
);

const chordFiles = files.filter(({ path }) => path.startsWith(join(distDirectory, "chords")));
const chordAssetBytes = chordFiles.reduce((sum, file) => sum + file.bytes, 0);
assert.ok(
  chordAssetBytes < CHORD_ASSET_BUDGET_BYTES,
  `코드 에셋 ${chordAssetBytes.toLocaleString()}B가 예산을 초과합니다.`,
);

const fallbackCount = chordFiles.filter(({ path }) => /(?<!\.thumb)\.(png|jpe?g)$/i.test(path)).length;
const detailWebpCount = chordFiles.filter(({ path }) => /(?<!\.thumb)\.webp$/i.test(path)).length;
const thumbnailWebpCount = chordFiles.filter(({ path }) => /\.thumb\.webp$/i.test(path)).length;
assert.equal(fallbackCount, EXPECTED_CHORD_COUNT, "코드 이미지 폴백 수가 올바르지 않습니다.");
assert.equal(detailWebpCount, EXPECTED_CHORD_COUNT, "상세 WebP 수가 올바르지 않습니다.");
assert.equal(thumbnailWebpCount, EXPECTED_CHORD_COUNT, "썸네일 WebP 수가 올바르지 않습니다.");

const fontFiles = files.filter(({ path }) => extname(path) === ".woff2");
assert.equal(fontFiles.length, 2, "core/supplement self-hosted WOFF2가 모두 필요합니다.");
const fontBytes = fontFiles.reduce((sum, file) => sum + file.bytes, 0);
assert.ok(
  fontBytes <= FONT_BUDGET_BYTES,
  `폰트 ${fontBytes.toLocaleString()}B가 예산을 초과합니다.`,
);

const cssSource = `${readFileSync(sourceStyles, "utf8")}\n${readFileSync(fontStyles, "utf8")}`;
assert.doesNotMatch(cssSource, /@import\s+url\(["']?https?:/i, "외부 CSS/폰트 import가 남아 있습니다.");
assert.match(cssSource, /font-display:\s*swap/i, "self-hosted 폰트에 font-display: swap이 없습니다.");

for (const assetPath of [
  "assets/ukulele-style-icon.webp",
  "assets/main-footer-authors.webp",
]) {
  assert.ok(existsSync(join(distDirectory, assetPath)), `${assetPath}가 빌드에 없습니다.`);
}

const indexHtml = readFileSync(join(distDirectory, "index.html"), "utf8");
const initialCssPaths = Array.from(indexHtml.matchAll(/href="[^"]*?(assets\/[^"?]+\.css)"/g))
  .map((match) => match[1]);
for (const lazyStylesheet of ["phase7-", "QualitySelector-"]) {
  assert.ok(
    files.some(({ path }) => relative(distDirectory, path).includes(lazyStylesheet)),
    `${lazyStylesheet} 지연 로드 CSS가 생성되지 않았습니다.`,
  );
  assert.ok(
    initialCssPaths.every((filePath) => !filePath.includes(lazyStylesheet)),
    `${lazyStylesheet} CSS가 초기 HTML에서 차단 리소스로 로드됩니다.`,
  );
}
const initialJavaScriptPaths = [...indexHtml.matchAll(/(?:src|href)="[^"]*?(assets\/[^"?]+\.js)"/g)]
  .map((match) => match[1]);
assert.ok(initialJavaScriptPaths.length > 0, "초기 JavaScript 엔트리를 찾지 못했습니다.");
for (const expectedVendor of ["vendor-react", "vendor-dnd", "vendor-qr", "vendor-supabase"]) {
  assert.ok(
    javascriptFiles.some(({ path }) => relative(distDirectory, path).includes(expectedVendor)),
    `${expectedVendor} 청크가 생성되지 않았습니다. manualChunks 설정을 확인하세요.`,
  );
}
for (const lazyVendor of ["vendor-dnd", "vendor-qr", "vendor-supabase"]) {
  assert.ok(
    initialJavaScriptPaths.every((filePath) => !filePath.includes(lazyVendor)),
    `${lazyVendor}가 초기 HTML에서 preload되고 있습니다.`,
  );
}
const initialGzipBytes = [...new Set(initialJavaScriptPaths)].reduce((sum, filePath) => {
  return sum + gzipSync(readFileSync(join(distDirectory, filePath))).byteLength;
}, 0);
assert.ok(
  initialGzipBytes < INITIAL_JAVASCRIPT_GZIP_BUDGET_BYTES,
  `HTML 시드 초기 JS gzip ${initialGzipBytes.toLocaleString()}B가 예산을 초과합니다.`,
);

const relativeLargestChunk = relative(distDirectory, largestJavaScript.path).replace(/\\/g, "/");
console.log(
  [
    "✓ Phase 9 성능 예산 검사 통과",
    `  dist: ${totalBytes.toLocaleString()}B / ${DIST_BUDGET_BYTES.toLocaleString()}B`,
    `  코드 에셋: ${chordAssetBytes.toLocaleString()}B / ${CHORD_ASSET_BUDGET_BYTES.toLocaleString()}B`,
    `  HTML 시드 초기 JS gzip: ${initialGzipBytes.toLocaleString()}B / ${INITIAL_JAVASCRIPT_GZIP_BUDGET_BYTES.toLocaleString()}B`,
    `  최대 JS: ${relativeLargestChunk} ${largestJavaScript.bytes.toLocaleString()}B`,
    `  self-hosted WOFF2: ${fontBytes.toLocaleString()}B (core + supplement)`,
  ].join("\n"),
);

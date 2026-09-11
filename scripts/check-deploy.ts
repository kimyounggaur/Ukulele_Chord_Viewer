import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import sharp from "sharp";

const BASE_PATH = "/Ukulele_Chord_Viewer/";
const SITE_URL = "https://kimyounggaur.github.io/Ukulele_Chord_Viewer/";
const TITLE = "우쿨렐레 코드 뷰어 | Lesson Designer";
const DESCRIPTION = "112개 우쿨렐레 코드 운지법을 검색하고 듣고, 수업 세트와 퀴즈로 연습하세요.";
const OG_IMAGE_URL = `${SITE_URL}og-image.png`;
const ACTION_PINS = [
  "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020",
  "actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d",
  "actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9",
  "actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346",
] as const;

const projectDirectory = process.cwd();
const publicDirectory = resolve(projectDirectory, "public");
const distDirectory = resolve(projectDirectory, "dist");

function requireFile(path: string) {
  assert.ok(existsSync(path), `필수 배포 파일이 없습니다: ${relative(projectDirectory, path)}`);
}

function read(path: string) {
  requireFile(path);
  return readFileSync(path, "utf8");
}

function assertMeta(html: string, attribute: "name" | "property", key: string, value: string) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(
    html,
    new RegExp(`<meta[^>]+${attribute}=["']${escapedKey}["'][^>]+content=["']${escapedValue}["'][^>]*>`, "i"),
    `${key} 메타데이터가 올바르지 않습니다.`,
  );
}

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(absolutePath);
    return /\.(?:ts|tsx|css)$/.test(entry.name) ? [absolutePath] : [];
  });
}

const viteConfig = read(resolve(projectDirectory, "vite.config.ts"));
assert.match(viteConfig, /const BASE_PATH\s*=\s*["']\/Ukulele_Chord_Viewer\/["']/);
assert.match(viteConfig, /base:\s*BASE_PATH/);

for (const directory of [publicDirectory, distDirectory]) {
  const noJekyllPath = join(directory, ".nojekyll");
  requireFile(noJekyllPath);
  assert.equal(statSync(noJekyllPath).size, 0, `${relative(projectDirectory, noJekyllPath)}은 빈 파일이어야 합니다.`);
}

const routerSource = read(resolve(projectDirectory, "src", "main.tsx"));
assert.match(routerSource, /import\s*{\s*HashRouter\s*}\s*from\s*["']react-router-dom["']/);
assert.match(routerSource, /<HashRouter>/);
assert.doesNotMatch(routerSource, /BrowserRouter/);

const assetHelper = read(resolve(projectDirectory, "src", "lib", "asset.ts"));
assert.ok(assetHelper.includes("import.meta.env.BASE_URL"), "asset 헬퍼에 Vite base URL 접두어가 필요합니다.");
assert.ok(assetHelper.includes("replace(/^\\//, \"\")"), "asset 헬퍼는 선행 슬래시를 제거해야 합니다.");

for (const sourceFile of collectSourceFiles(resolve(projectDirectory, "src"))) {
  const source = readFileSync(sourceFile, "utf8");
  assert.doesNotMatch(
    source,
    /["'`]\/(?:assets|chords)\//,
    `${relative(projectDirectory, sourceFile)}에 base 없는 절대 정적 에셋 경로가 있습니다.`,
  );
}

const sourceIndex = read(resolve(projectDirectory, "index.html"));
const distIndex = read(join(distDirectory, "index.html"));
for (const html of [sourceIndex, distIndex]) {
  assert.match(html, /<html\s+lang=["']ko["']/i);
  assert.match(html, new RegExp(`<title>${TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</title>`));
  assertMeta(html, "name", "description", DESCRIPTION);
  assertMeta(html, "name", "theme-color", "#E8ECF3");
  assertMeta(html, "property", "og:title", TITLE);
  assertMeta(html, "property", "og:description", DESCRIPTION);
  assertMeta(html, "property", "og:image", OG_IMAGE_URL);
  assertMeta(html, "property", "og:image:type", "image/png");
  assertMeta(html, "property", "og:url", SITE_URL);
  assertMeta(html, "name", "twitter:card", "summary_large_image");
  assertMeta(html, "name", "twitter:image", OG_IMAGE_URL);
  assert.match(html, /<link[^>]+rel=["']icon["'][^>]+href=["'][^"']+favicon\.svg["']/i);
}
assert.match(distIndex, /(?:src|href)=["']\/Ukulele_Chord_Viewer\/assets\//);
assert.match(distIndex, /href=["']\/Ukulele_Chord_Viewer\/manifest\.webmanifest["']/);

const ogImagePath = join(publicDirectory, "og-image.png");
const builtOgImagePath = join(distDirectory, "og-image.png");
for (const path of [ogImagePath, builtOgImagePath]) requireFile(path);
const ogMetadata = await sharp(ogImagePath, { failOn: "error" }).metadata();
assert.equal(ogMetadata.format, "png");
assert.deepEqual({ width: ogMetadata.width, height: ogMetadata.height }, { width: 1200, height: 630 });
assert.ok(statSync(ogImagePath).size <= 12_000, "OG 이미지는 12KB 이하여야 합니다.");
assert.deepEqual(readFileSync(builtOgImagePath), readFileSync(ogImagePath), "빌드된 OG 이미지가 원본과 다릅니다.");

for (const deployedAsset of [
  "manifest.webmanifest",
  "chords/major/c.png",
  "chords/major/c.webp",
  "favicon.svg",
]) {
  requireFile(join(distDirectory, deployedAsset));
}

const manifest = JSON.parse(read(join(distDirectory, "manifest.webmanifest"))) as {
  start_url?: string;
  scope?: string;
};
assert.equal(manifest.start_url, BASE_PATH);
assert.equal(manifest.scope, BASE_PATH);

const workflow = read(resolve(projectDirectory, ".github", "workflows", "deploy.yml"));
assert.match(workflow, /push:\s*\n\s*branches:\s*\n\s*- main/);
assert.doesNotMatch(workflow, /continue-on-error\s*:\s*true/);
assert.doesNotMatch(workflow, /if:\s*always\(\)/);
for (const actionPin of ACTION_PINS) assert.ok(workflow.includes(actionPin), `${actionPin} 고정이 필요합니다.`);
const commandOffsets = ["npm run verify", "npm run check:images", "npm run build"].map((command) => workflow.indexOf(command));
assert.ok(commandOffsets.every((offset) => offset >= 0), "필수 CI 검증 명령이 모두 필요합니다.");
assert.ok(
  commandOffsets[0] < commandOffsets[1] && commandOffsets[1] < commandOffsets[2],
  "CI 명령은 verify → check:images → build 순서여야 합니다.",
);
for (const command of ["npm run check:pwa", "npm run check:deploy"]) {
  assert.ok(workflow.includes(command), `${command}가 배포 전에 필요합니다.`);
}
const configureOffset = workflow.indexOf("actions/configure-pages@");
const uploadOffset = workflow.indexOf("actions/upload-pages-artifact@");
for (const command of [
  "npm run verify",
  "npm run check:images",
  "npm run build",
  "npm run check:pwa",
  "npm run check:deploy",
]) {
  assert.ok(workflow.indexOf(command) < uploadOffset, `${command}는 Pages 아티팩트 업로드 전에 실행해야 합니다.`);
}
assert.ok(configureOffset >= 0 && configureOffset < uploadOffset, "Configure Pages는 아티팩트 업로드 전에 실행해야 합니다.");
assert.match(workflow, /path:\s*dist/);
assert.match(workflow, /include-hidden-files:\s*true/);
assert.match(workflow, /persist-credentials:\s*false/);
assert.match(workflow, /build:\s*\n\s*permissions:\s*\n\s*contents:\s*read\s*\n\s*pages:\s*read/);
assert.match(workflow, /deploy:\s*\n\s*if:\s*github\.ref\s*==\s*["']refs\/heads\/main["']/);
assert.match(workflow, /needs:\s*build/);
assert.match(workflow, /environment:\s*\n\s*name:\s*github-pages\s*\n\s*url:\s*\$\{\{\s*steps\.deployment\.outputs\.page_url\s*}}/);
assert.match(workflow, /pages:\s*write/);
assert.match(workflow, /id-token:\s*write/);

console.log(
  [
    "✓ Phase 10 GitHub Pages 배포 검사 통과",
    `  base: ${BASE_PATH}`,
    "  router: HashRouter",
    "  .nojekyll: public/dist 빈 파일",
    `  OG: ${ogMetadata.width}×${ogMetadata.height}, ${statSync(ogImagePath).size.toLocaleString()}B`,
    "  CI: verify → check:images → build → PWA/deploy 검사 → Pages 배포",
  ].join("\n"),
);

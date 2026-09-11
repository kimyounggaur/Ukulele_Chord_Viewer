import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const BASE_PATH = "/Ukulele_Chord_Viewer/";
const distDirectory = resolve(process.cwd(), "dist");
const manifestPath = join(distDirectory, "manifest.webmanifest");
const serviceWorkerPath = join(distDirectory, "sw.js");
const indexPath = join(distDirectory, "index.html");

function requireFile(path: string) {
  assert.ok(existsSync(path), `필수 PWA 파일이 없습니다: ${relative(process.cwd(), path)}`);
}

function collectCacheableImages(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectCacheableImages(absolutePath);
    return [".png", ".jpg", ".jpeg", ".svg", ".webp"].includes(extname(entry.name).toLowerCase())
      ? [relative(distDirectory, absolutePath).replace(/\\/g, "/")]
      : [];
  });
}

function readPngSize(path: string) {
  const bytes = readFileSync(path);
  const pngSignature = "89504e470d0a1a0a";
  assert.equal(bytes.subarray(0, 8).toString("hex"), pngSignature, `${path}는 유효한 PNG여야 합니다.`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

[manifestPath, serviceWorkerPath, indexPath].forEach(requireFile);

const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  id?: string;
  name?: string;
  short_name?: string;
  description?: string;
  lang?: string;
  theme_color?: string;
  background_color?: string;
  display?: string;
  orientation?: string;
  start_url?: string;
  scope?: string;
  icons?: Array<{ src?: string; sizes?: string; type?: string; purpose?: string }>;
};

assert.equal(manifest.id, BASE_PATH, "manifest id에 GitHub Pages base 경로가 필요합니다.");
assert.equal(manifest.start_url, BASE_PATH, "manifest start_url에 GitHub Pages base 경로가 필요합니다.");
assert.equal(manifest.scope, BASE_PATH, "manifest scope에 GitHub Pages base 경로가 필요합니다.");
assert.equal(manifest.name, "우쿨렐레 코드 뷰어");
assert.equal(manifest.short_name, "우쿨렐레 코드");
assert.equal(manifest.lang, "ko");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.orientation, "any");
assert.equal(manifest.theme_color, "#E8ECF3");
assert.equal(manifest.background_color, "#E8ECF3");

const requiredIcons = [
  { src: "pwa-192x192.png", size: 192, purpose: "any" },
  { src: "pwa-512x512.png", size: 512, purpose: "any" },
  { src: "pwa-maskable-512x512.png", size: 512, purpose: "maskable" },
];

for (const requiredIcon of requiredIcons) {
  const manifestIcon = manifest.icons?.find(({ src }) => src === requiredIcon.src);
  assert.ok(manifestIcon, `manifest에 ${requiredIcon.src}가 필요합니다.`);
  assert.equal(manifestIcon.type, "image/png");
  assert.equal(manifestIcon.sizes, `${requiredIcon.size}x${requiredIcon.size}`);
  assert.ok(manifestIcon.purpose?.split(/\s+/).includes(requiredIcon.purpose));

  const iconPath = join(distDirectory, requiredIcon.src);
  requireFile(iconPath);
  assert.deepEqual(
    readPngSize(iconPath),
    { width: requiredIcon.size, height: requiredIcon.size },
    `${requiredIcon.src} 크기가 manifest 선언과 일치해야 합니다.`,
  );
}

const appleTouchIconPath = join(distDirectory, "apple-touch-icon.png");
requireFile(appleTouchIconPath);
assert.deepEqual(readPngSize(appleTouchIconPath), { width: 180, height: 180 });
requireFile(join(distDirectory, "favicon.svg"));

const indexHtml = readFileSync(indexPath, "utf8");
assert.match(indexHtml, /<link[^>]+rel=["']manifest["'][^>]+href=["']\/Ukulele_Chord_Viewer\/manifest\.webmanifest["']/);
assert.match(indexHtml, /<meta[^>]+name=["']theme-color["'][^>]+content=["']#E8ECF3["']/);

const serviceWorker = readFileSync(serviceWorkerPath, "utf8");
const cachedChordImages = collectCacheableImages(join(distDirectory, "chords"));
assert.ok(cachedChordImages.length > 0, "캐시할 코드 이미지가 없습니다.");
const missingFromPrecache = cachedChordImages.filter((imagePath) => !serviceWorker.includes(imagePath));
assert.deepEqual(missingFromPrecache, [], `서비스 워커 precache 누락: ${missingFromPrecache.join(", ")}`);

for (const requiredAsset of ["assets/main-footer-authors.jpg", "chords/manifest.json"]) {
  assert.ok(serviceWorker.includes(requiredAsset), `${requiredAsset}가 서비스 워커 precache에 필요합니다.`);
}

const maximumFileSize = 6 * 1024 * 1024;
const oversizedPrecacheFiles = (function collectFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(absolutePath);
    const extension = extname(entry.name).toLowerCase();
    const cacheable = [".js", ".css", ".html", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".woff2", ".json"]
      .includes(extension);
    return cacheable && statSync(absolutePath).size > maximumFileSize
      ? [relative(distDirectory, absolutePath).replace(/\\/g, "/")]
      : [];
  });
})(distDirectory);
assert.deepEqual(oversizedPrecacheFiles, [], "6 MiB precache 제한을 넘는 파일이 없어야 합니다.");

for (const asset of [
  "pwa-192x192.png",
  "pwa-512x512.png",
  "pwa-maskable-512x512.png",
  "apple-touch-icon.png",
  "favicon.svg",
]) {
  assert.ok(serviceWorker.includes(asset), `${asset}가 서비스 워커 precache에 필요합니다.`);
}

const viteConfig = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");
assert.match(viteConfig, /registerType:\s*["']prompt["']/);
assert.doesNotMatch(viteConfig, /registerType:\s*["']autoUpdate["']/);

const updateBanner = readFileSync(resolve(process.cwd(), "src/components/PwaUpdateBanner.tsx"), "utf8");
assert.match(updateBanner, /새 버전이 있습니다/);
assert.match(updateBanner, /updateServiceWorker\(true\)/);

console.log(`✓ PWA manifest, 아이콘, 수동 업데이트, 오프라인 precache 검사 통과 (${cachedChordImages.length}개 코드 이미지)`);

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import sharp from "sharp";
import { chords } from "../src/data/chords";

const EXPECTED_IMAGE_COUNT = 80;
const DETAIL_MAX_PX = 720;
const THUMBNAIL_MAX_PX = 240;
const publicDirectory = resolve(process.cwd(), "public");
const chordsDirectory = resolve(publicDirectory, "chords");
const sourceDirectory = resolve(process.cwd(), "source-assets", "chords");
const publicManifestPath = resolve(chordsDirectory, "manifest.json");
const runtimeDimensionsPath = resolve(process.cwd(), "src", "data", "chordImageDimensions.json");

interface ImageDimensions {
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

interface ManifestImage extends ImageDimensions {
  file: string;
  webp: string;
  thumbnail: string;
}

interface ChordImageManifest {
  count: number;
  images: ManifestImage[];
}

const referencedFallbacks = new Set(
  chords.flatMap((chord) => (chord.imageFile ? [chord.imageFile.replace(/\\/g, "/")] : [])),
);

function replaceExtension(imageFile: string, suffix: string): string {
  return imageFile.slice(0, -extname(imageFile).length) + suffix;
}

function collectFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(absolute);
    return [relative(publicDirectory, absolute).replace(/\\/g, "/")];
  });
}

function assertWithinLimit(
  imageFile: string,
  width: number | undefined,
  height: number | undefined,
  limit: number,
) {
  if (!width || !height) throw new Error(`${imageFile}: 이미지 크기를 읽을 수 없습니다.`);
  if (width > limit || height > limit) {
    throw new Error(`${imageFile}: ${width}×${height}px은 최대 ${limit}px을 초과합니다.`);
  }
}

function assertMatchingDimensions(
  fallbackFile: string,
  fallback: { width?: number; height?: number },
  variantFile: string,
  variant: { width?: number; height?: number },
  maxPixels: number,
) {
  if (!fallback.width || !fallback.height || !variant.width || !variant.height) return;
  const scale = Math.min(1, maxPixels / Math.max(fallback.width, fallback.height));
  const expectedWidth = Math.round(fallback.width * scale);
  const expectedHeight = Math.round(fallback.height * scale);
  if (
    Math.abs(variant.width - expectedWidth) > 1 ||
    Math.abs(variant.height - expectedHeight) > 1
  ) {
    throw new Error(
      `${variantFile}: ${fallbackFile} 비율의 예상 크기 ${expectedWidth}×${expectedHeight}px과 다릅니다 ` +
        `(${variant.width}×${variant.height}px).`,
    );
  }
}

async function assertVisualMatch(
  expected: sharp.Sharp,
  actualFile: string,
  label: string,
  maxMeanError: number,
  maxStrongPixelRatio: number,
) {
  const [expectedPixels, actualPixels] = await Promise.all([
    expected.flatten({ background: "#ffffff" }).raw().toBuffer(),
    sharp(actualFile, { failOn: "error" }).flatten({ background: "#ffffff" }).raw().toBuffer(),
  ]);
  if (expectedPixels.length !== actualPixels.length) {
    throw new Error(`${label}: 디코딩된 픽셀 크기가 기준 이미지와 다릅니다.`);
  }

  let absoluteError = 0;
  let strongPixels = 0;
  const pixelCount = expectedPixels.length / 3;
  for (let offset = 0; offset < expectedPixels.length; offset += 3) {
    let pixelError = 0;
    for (let channel = 0; channel < 3; channel += 1) {
      const difference = Math.abs(expectedPixels[offset + channel] - actualPixels[offset + channel]);
      absoluteError += difference;
      pixelError = Math.max(pixelError, difference);
    }
    if (pixelError > 32) strongPixels += 1;
  }

  const meanError = absoluteError / expectedPixels.length;
  const strongPixelRatio = strongPixels / pixelCount;
  if (meanError > maxMeanError || strongPixelRatio > maxStrongPixelRatio) {
    throw new Error(
      `${label}: 원본과 시각 내용이 다릅니다 ` +
        `(평균 오차 ${meanError.toFixed(3)}, 강한 오차 ${(strongPixelRatio * 100).toFixed(3)}%).`,
    );
  }
}

if (referencedFallbacks.size !== EXPECTED_IMAGE_COUNT) {
  throw new Error(
    `코드 데이터의 이미지 참조는 ${EXPECTED_IMAGE_COUNT}개여야 합니다 (현재 ${referencedFallbacks.size}개).`,
  );
}

const manifest = JSON.parse(readFileSync(publicManifestPath, "utf8")) as ChordImageManifest;
const runtimeDimensions = JSON.parse(
  readFileSync(runtimeDimensionsPath, "utf8"),
) as Record<string, ImageDimensions>;
if (manifest.count !== EXPECTED_IMAGE_COUNT || manifest.images.length !== EXPECTED_IMAGE_COUNT) {
  throw new Error("공개 이미지 manifest의 항목 수가 코드 데이터와 다릅니다.");
}
if (Object.keys(runtimeDimensions).length !== EXPECTED_IMAGE_COUNT) {
  throw new Error("런타임 이미지 크기 데이터의 항목 수가 코드 데이터와 다릅니다.");
}
const manifestByFile = new Map(manifest.images.map((image) => [image.file, image]));
if (manifestByFile.size !== manifest.images.length) {
  throw new Error("공개 이미지 manifest에 중복 경로가 있습니다.");
}

const expectedDetails = new Set(
  [...referencedFallbacks].map((imageFile) => replaceExtension(imageFile, ".webp")),
);
const expectedThumbnails = new Set(
  [...referencedFallbacks].map((imageFile) => replaceExtension(imageFile, ".thumb.webp")),
);
const expectedRasterFiles = new Set([
  ...referencedFallbacks,
  ...expectedDetails,
  ...expectedThumbnails,
]);
const allFiles = collectFiles(chordsDirectory);
const actualRasterFiles = allFiles.filter((file) =>
  [".png", ".jpg", ".jpeg", ".webp"].includes(extname(file).toLowerCase()),
);
const sourceRasterFiles = collectFiles(sourceDirectory).filter((file) =>
  [".png", ".jpg", ".jpeg"].includes(extname(file).toLowerCase()),
);
const missing = [...expectedRasterFiles].filter(
  (imageFile) => !existsSync(resolve(publicDirectory, imageFile)),
);
const unexpected = actualRasterFiles.filter((imageFile) => !expectedRasterFiles.has(imageFile));

if (missing.length > 0) {
  throw new Error(`누락된 코드 이미지 ${missing.length}개:\n${missing.join("\n")}`);
}
if (unexpected.length > 0) {
  throw new Error(`참조되지 않은 코드 래스터 이미지 ${unexpected.length}개:\n${unexpected.join("\n")}`);
}
if (sourceRasterFiles.length !== EXPECTED_IMAGE_COUNT) {
  throw new Error(
    `고해상도 원본은 ${EXPECTED_IMAGE_COUNT}개여야 합니다 (현재 ${sourceRasterFiles.length}개).`,
  );
}

for (const fallbackFile of referencedFallbacks) {
  const detailFile = replaceExtension(fallbackFile, ".webp");
  const thumbnailFile = replaceExtension(fallbackFile, ".thumb.webp");
  const sourceFile = resolve(sourceDirectory, fallbackFile.replace(/^chords\//, ""));
  if (!existsSync(sourceFile)) throw new Error(`${fallbackFile}: 고해상도 원본이 없습니다.`);
  const [source, fallback, detail, thumbnail] = await Promise.all([
    sharp(sourceFile).metadata(),
    sharp(resolve(publicDirectory, fallbackFile)).metadata(),
    sharp(resolve(publicDirectory, detailFile)).metadata(),
    sharp(resolve(publicDirectory, thumbnailFile)).metadata(),
  ]);
  const manifestImage = manifestByFile.get(fallbackFile);
  const runtimeImage = runtimeDimensions[fallbackFile];
  if (!manifestImage || !runtimeImage) {
    throw new Error(`${fallbackFile}: manifest 또는 런타임 크기 데이터가 없습니다.`);
  }
  if (
    manifestImage.webp !== detailFile
    || manifestImage.thumbnail !== thumbnailFile
    || [manifestImage.file, manifestImage.webp, manifestImage.thumbnail].some(
      (file) => /^[A-Za-z]:|^[/\\]|\\/.test(file),
    )
  ) {
    throw new Error(`${fallbackFile}: manifest 경로가 상대 POSIX 경로 규칙과 다릅니다.`);
  }

  assertWithinLimit(fallbackFile, fallback.width, fallback.height, DETAIL_MAX_PX);
  assertWithinLimit(detailFile, detail.width, detail.height, DETAIL_MAX_PX);
  assertWithinLimit(thumbnailFile, thumbnail.width, thumbnail.height, THUMBNAIL_MAX_PX);
  assertMatchingDimensions("고해상도 원본", source, fallbackFile, fallback, DETAIL_MAX_PX);
  assertMatchingDimensions(fallbackFile, fallback, detailFile, detail, DETAIL_MAX_PX);
  assertMatchingDimensions(fallbackFile, fallback, thumbnailFile, thumbnail, THUMBNAIL_MAX_PX);

  if (detail.format !== "webp" || thumbnail.format !== "webp") {
    throw new Error(`${fallbackFile}: WebP 파생본 형식이 올바르지 않습니다.`);
  }
  if (
    source.hasAlpha !== fallback.hasAlpha ||
    fallback.hasAlpha !== detail.hasAlpha ||
    fallback.hasAlpha !== thumbnail.hasAlpha
  ) {
    throw new Error(`${fallbackFile}: 파생본의 알파 채널 보존 상태가 다릅니다.`);
  }

  const actualDimensions: ImageDimensions = {
    width: fallback.width!,
    height: fallback.height!,
    thumbnailWidth: thumbnail.width!,
    thumbnailHeight: thumbnail.height!,
  };
  for (const [key, value] of Object.entries(actualDimensions) as [keyof ImageDimensions, number][]) {
    if (manifestImage[key] !== value || runtimeImage[key] !== value) {
      throw new Error(`${fallbackFile}: ${key} 메타데이터가 실제 이미지(${value})와 다릅니다.`);
    }
  }

  await assertVisualMatch(
    sharp(sourceFile, { failOn: "error" }).resize({
      width: DETAIL_MAX_PX,
      height: DETAIL_MAX_PX,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    }),
    resolve(publicDirectory, fallbackFile),
    fallbackFile,
    2,
    0.001,
  );
  await assertVisualMatch(
    sharp(resolve(publicDirectory, fallbackFile), { failOn: "error" }),
    resolve(publicDirectory, detailFile),
    detailFile,
    0,
    0,
  );
  await assertVisualMatch(
    sharp(resolve(publicDirectory, fallbackFile), { failOn: "error" }).resize({
      width: THUMBNAIL_MAX_PX,
      height: THUMBNAIL_MAX_PX,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    }),
    resolve(publicDirectory, thumbnailFile),
    thumbnailFile,
    2,
    0.001,
  );
}

const manifestOnly = [...manifestByFile.keys()].filter((file) => !referencedFallbacks.has(file));
const runtimeOnly = Object.keys(runtimeDimensions).filter((file) => !referencedFallbacks.has(file));
if (manifestOnly.length > 0 || runtimeOnly.length > 0) {
  throw new Error("manifest 또는 런타임 크기 데이터에 참조되지 않은 이미지가 있습니다.");
}

console.log(
  `코드 이미지 검사 통과: 고해상도 원본 ${sourceRasterFiles.length}개 + 폴백 ${referencedFallbacks.size}개 + ` +
    `상세 WebP ${expectedDetails.size}개 + ` +
    `썸네일 WebP ${expectedThumbnails.size}개 (총 ${expectedRasterFiles.size}개).`,
);

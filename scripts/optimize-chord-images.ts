import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import sharp from "sharp";

const SOURCE_CHORDS_DIRECTORY = resolve(process.cwd(), "source-assets", "chords");
const PUBLIC_CHORDS_DIRECTORY = resolve(process.cwd(), "public", "chords");
const PUBLIC_MANIFEST_PATH = join(PUBLIC_CHORDS_DIRECTORY, "manifest.json");
const RUNTIME_DIMENSIONS_PATH = resolve(
  process.cwd(),
  "src",
  "data",
  "chordImageDimensions.json",
);
const DETAIL_MAX_PX = 720;
const THUMBNAIL_MAX_PX = 240;
const WEBP_QUALITY = 82;
const PNG_PALETTE_COLORS = 16;
const UI_IMAGE_FILES = [
  "public/assets/ukulele-style-icon.png",
  "public/assets/main-footer-authors.jpg",
] as const;

async function collectRasterSources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) return collectRasterSources(absolute);
      return [".png", ".jpg", ".jpeg"].includes(extname(entry.name).toLowerCase())
        ? [absolute]
        : [];
    }),
  );
  return files.flat().sort((left, right) => left.localeCompare(right));
}

function replaceExtension(filePath: string, suffix: string): string {
  return filePath.slice(0, -extname(filePath).length) + suffix;
}

async function writeOnlyWhenChanged(filePath: string, output: Buffer): Promise<boolean> {
  let current: Buffer | undefined;
  try {
    current = await readFile(filePath);
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : undefined;
    if (code !== "ENOENT") throw error;
  }

  if (current?.equals(output)) return false;
  await writeFile(filePath, output);
  return true;
}

async function optimizeSource(sourcePath: string) {
  const beforeBytes = (await stat(sourcePath)).size;
  const extension = extname(sourcePath).toLowerCase();
  const relativeSourcePath = relative(SOURCE_CHORDS_DIRECTORY, sourcePath).replace(/\\/g, "/");
  const outputPath = join(
    PUBLIC_CHORDS_DIRECTORY,
    relativeSourcePath,
  );
  await mkdir(dirname(outputPath), { recursive: true });
  const resized = sharp(sourcePath, { failOn: "error" }).resize({
    width: DETAIL_MAX_PX,
    height: DETAIL_MAX_PX,
    fit: "inside",
    withoutEnlargement: true,
    kernel: sharp.kernel.lanczos3,
  });

  const fallback =
    extension === ".png"
      ? await resized
          .clone()
          .png({
            compressionLevel: 9,
            effort: 10,
            palette: true,
            quality: 100,
            colors: PNG_PALETTE_COLORS,
            dither: 0,
          })
          .toBuffer()
      : await resized.clone().jpeg({ quality: WEBP_QUALITY, mozjpeg: true }).toBuffer();

  // The full-size diagram is lossless because this flat artwork needs crisp edges.
  const detailWebp = await sharp(fallback)
    .webp({ lossless: true, effort: 6 })
    .toBuffer();
  const thumbnailWebp = await sharp(fallback)
    .resize({
      width: THUMBNAIL_MAX_PX,
      height: THUMBNAIL_MAX_PX,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality: WEBP_QUALITY, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toBuffer();

  const detailPath = replaceExtension(outputPath, ".webp");
  const thumbnailPath = replaceExtension(outputPath, ".thumb.webp");
  const [detailMetadata, thumbnailMetadata] = await Promise.all([
    sharp(fallback).metadata(),
    sharp(thumbnailWebp).metadata(),
  ]);
  if (
    !detailMetadata.width ||
    !detailMetadata.height ||
    !thumbnailMetadata.width ||
    !thumbnailMetadata.height
  ) {
    throw new Error(`${relativeSourcePath}: 파생 이미지 크기를 읽을 수 없습니다.`);
  }

  const changed = [
    await writeOnlyWhenChanged(outputPath, fallback),
    await writeOnlyWhenChanged(detailPath, detailWebp),
    await writeOnlyWhenChanged(thumbnailPath, thumbnailWebp),
  ].filter(Boolean).length;

  return {
    beforeBytes,
    afterBytes: fallback.byteLength + detailWebp.byteLength + thumbnailWebp.byteLength,
    changed,
    image: {
      file: `chords/${relativeSourcePath}`,
      webp: `chords/${replaceExtension(relativeSourcePath, ".webp")}`,
      thumbnail: `chords/${replaceExtension(relativeSourcePath, ".thumb.webp")}`,
      width: detailMetadata.width,
      height: detailMetadata.height,
      thumbnailWidth: thumbnailMetadata.width,
      thumbnailHeight: thumbnailMetadata.height,
    },
  };
}

const sources = await collectRasterSources(SOURCE_CHORDS_DIRECTORY);
if (sources.length === 0) throw new Error("최적화할 코드 PNG/JPG 파일이 없습니다.");

let beforeBytes = 0;
let afterBytes = 0;
let changedFiles = 0;
const images: Awaited<ReturnType<typeof optimizeSource>>["image"][] = [];
for (const sourcePath of sources) {
  const result = await optimizeSource(sourcePath);
  beforeBytes += result.beforeBytes;
  afterBytes += result.afterBytes;
  changedFiles += result.changed;
  images.push(result.image);
}

const manifest = {
  version: 2,
  generatedFrom: "source-assets/chords",
  count: images.length,
  transforms: {
    detailMaxPixels: DETAIL_MAX_PX,
    thumbnailMaxPixels: THUMBNAIL_MAX_PX,
    thumbnailWebpQuality: WEBP_QUALITY,
    fallbackPaletteColors: PNG_PALETTE_COLORS,
  },
  images,
};
const dimensions = Object.fromEntries(
  images.map(({ file, width, height, thumbnailWidth, thumbnailHeight }) => [
    file,
    { width, height, thumbnailWidth, thumbnailHeight },
  ]),
);
const generatedFiles = await Promise.all([
  writeOnlyWhenChanged(
    PUBLIC_MANIFEST_PATH,
    Buffer.from(`${JSON.stringify(manifest)}\n`),
  ),
  writeOnlyWhenChanged(
    RUNTIME_DIMENSIONS_PATH,
    Buffer.from(`${JSON.stringify(dimensions, null, 2)}\n`),
  ),
]);
changedFiles += generatedFiles.filter(Boolean).length;

let uiWebpBytes = 0;
for (const relativeInputPath of UI_IMAGE_FILES) {
  const inputPath = resolve(process.cwd(), relativeInputPath);
  const outputPath = replaceExtension(inputPath, ".webp");
  const output = await sharp(inputPath)
    .webp({ quality: WEBP_QUALITY, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toBuffer();
  uiWebpBytes += output.byteLength;
  if (await writeOnlyWhenChanged(outputPath, output)) changedFiles += 1;
}

const mib = (bytes: number) => (bytes / 1024 / 1024).toFixed(3);
console.log(
  [
    `코드 이미지 최적화 완료: ${sources.length}개 원본`,
    `입력 폴백 합계: ${mib(beforeBytes)} MiB`,
    `PNG/JPG + 상세 WebP + 썸네일 WebP 합계: ${mib(afterBytes)} MiB`,
    `변경된 파일: ${changedFiles}개`,
    `PNG 팔레트 ${PNG_PALETTE_COLORS}색 / 상세 WebP 무손실 최대 ${DETAIL_MAX_PX}px`,
    `썸네일 WebP 최대 ${THUMBNAIL_MAX_PX}px / 품질 ${WEBP_QUALITY}`,
    `UI WebP 2개 합계: ${mib(uiWebpBytes)} MiB`,
  ].join("\n"),
);

console.log(
  "원본 위치: " + relative(process.cwd(), SOURCE_CHORDS_DIRECTORY).replace(/\\/g, "/"),
);

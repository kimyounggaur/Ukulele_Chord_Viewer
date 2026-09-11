import { existsSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { chords } from "../src/data/chords";

const publicDirectory = resolve(process.cwd(), "public");
const referenced = new Set(
  chords.flatMap((chord) => (chord.imageFile ? [chord.imageFile.replace(/\\/g, "/")] : [])),
);
const missing = [...referenced].filter(
  (imageFile) => !existsSync(resolve(publicDirectory, imageFile)),
);

function collectImages(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return collectImages(absolute);
    return [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(extname(entry.name).toLowerCase())
      ? [relative(publicDirectory, absolute).replace(/\\/g, "/")]
      : [];
  });
}

const orphaned = collectImages(resolve(publicDirectory, "chords")).filter(
  (imageFile) => !imageFile.startsWith("chords/placeholders/") && !referenced.has(imageFile),
);

if (orphaned.length > 0) {
  console.warn("참조되지 않는 코드 이미지 (" + orphaned.length + "개)");
  orphaned.forEach((imageFile) => console.warn("- " + imageFile));
}

if (missing.length > 0) {
  console.error("존재하지 않는 코드 이미지 (" + missing.length + "개)");
  missing.forEach((imageFile) => console.error("- " + imageFile));
  process.exitCode = 1;
} else {
  console.log("코드 이미지 검사 통과: " + referenced.size + "개 참조가 모두 존재합니다.");
}

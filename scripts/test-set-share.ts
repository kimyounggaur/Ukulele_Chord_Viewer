import assert from "node:assert/strict";
import {
  decodeLessonSetShareData,
  encodeLessonSetShareData,
  importLessonSetShareData,
  LessonSetShareError,
  MAX_SHARED_DATA_LENGTH,
  MAX_SHARED_TITLE_LENGTH,
  tryDecodeLessonSetShareData,
} from "../src/lessonSets/shareCodec";

function encodeRaw(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

const title = `🎵한글 수업 ${"가".repeat(50)}`;
const encoded = encodeLessonSetShareData({ title, chordIds: ["C", "minor-a", "G7"] });
assert.match(encoded, /^[A-Za-z0-9_-]+$/, "공유 값은 padding 없는 base64url이어야 합니다.");
assert.ok(encoded.length <= MAX_SHARED_DATA_LENGTH);

const decoded = decodeLessonSetShareData(encoded);
assert.deepEqual(Object.keys(decoded), ["v", "t", "c"], "공유 payload에는 v/t/c만 있어야 합니다.");
assert.equal(decoded.v, 1);
assert.equal(Array.from(decoded.t).length, MAX_SHARED_TITLE_LENGTH, "제목은 코드포인트 기준 40자로 잘라야 합니다.");
assert.ok(decoded.t.startsWith("🎵한글 수업"), "UTF-8 제목이 왕복되어야 합니다.");
assert.deepEqual(decoded.c, ["C", "Am", "G7"], "알려진 레거시 코드 ID는 현재 ID로 이관해야 합니다.");

const imported = importLessonSetShareData(encoded, [
  { id: "source-id", title: "기존", chordIds: ["D"], createdAt: 1 },
], { id: "fresh-id", createdAt: 999 });
assert.equal(imported.lessonSet.id, "fresh-id", "가져온 세트는 새로운 로컬 ID를 받아야 합니다.");
assert.equal(imported.lessonSet.createdAt, 999);
assert.equal(imported.lessonSets.length, 2);

assert.throws(
  () => decodeLessonSetShareData("abc="),
  LessonSetShareError,
  "padding과 base64url 외 문자를 거부해야 합니다.",
);
assert.throws(
  () => decodeLessonSetShareData("a".repeat(MAX_SHARED_DATA_LENGTH + 1)),
  LessonSetShareError,
  "과도하게 긴 입력을 디코딩 전에 거부해야 합니다.",
);
assert.throws(() => decodeLessonSetShareData(encodeRaw({ v: 2, t: "수업", c: ["C"] })), LessonSetShareError);
assert.throws(() => decodeLessonSetShareData(encodeRaw({ v: 1, t: "수업", c: ["Nope"] })), LessonSetShareError);
assert.throws(() => decodeLessonSetShareData(encodeRaw({ v: 1, t: "수업", c: ["C", "major-c"] })), LessonSetShareError);
assert.throws(() => decodeLessonSetShareData(encodeRaw({ v: 1, t: "수업", c: ["C"], x: true })), LessonSetShareError);
assert.throws(() => decodeLessonSetShareData(encodeRaw({ v: 1, t: " 앞뒤 공백 ", c: ["C"] })), LessonSetShareError);
assert.throws(() => decodeLessonSetShareData(encodeRaw({ v: 1, t: "가".repeat(41), c: ["C"] })), LessonSetShareError);
assert.equal(tryDecodeLessonSetShareData("not+base64"), null, "안전 디코더는 잘못된 값에 null을 반환해야 합니다.");

console.log("Lesson set share codec checks passed.");

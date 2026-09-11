import assert from "node:assert/strict";
import {
  addChordToLessonSet,
  createLessonSet,
  createLessonSetId,
  deleteLessonSet,
  importLessonSet,
  LESSON_SETS_STORAGE_KEY,
  MAX_LESSON_SET_NOTE_LENGTH,
  MAX_LESSON_SET_TITLE_LENGTH,
  moveChordInLessonSet,
  normalizeLessonSets,
  parseStoredLessonSets,
  readStoredLessonSets,
  removeChordFromLessonSet,
  renameLessonSet,
  updateLessonSetNote,
  writeStoredLessonSets,
} from "../src/lessonSets/storage";
import type { LessonSetStorage } from "../src/lessonSets/storage";

class MemoryStorage implements LessonSetStorage {
  values = new Map<string, string>();
  writes = 0;

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
    this.writes += 1;
  }
}

assert.equal(LESSON_SETS_STORAGE_KEY, "ukv.sets", "저장 키는 명세와 정확히 일치해야 합니다.");

const normalized = normalizeLessonSets([
  {
    id: "week-1",
    title: `  1주차\n${"가".repeat(100)}  `,
    chordIds: ["major-c", "Am", "C", "unknown", "minor-a"],
    note: ` 메모\r\n${"나".repeat(2_100)} `,
    createdAt: 100.9,
  },
  { id: "week-1", title: "중복", chordIds: ["D"], createdAt: 200 },
  { id: "bad id", title: "제외", chordIds: [], createdAt: 300 },
  { id: "bad-time", title: "제외", chordIds: [], createdAt: -1 },
]);
assert.equal(normalized.length, 1, "손상 항목과 중복 세트 ID를 제거해야 합니다.");
assert.equal(Array.from(normalized[0].title).length, MAX_LESSON_SET_TITLE_LENGTH);
assert.equal(Array.from(normalized[0].note ?? "").length, MAX_LESSON_SET_NOTE_LENGTH);
assert.deepEqual(normalized[0].chordIds, ["C", "Am"], "레거시 ID를 이관하고 첫 순서를 유지해야 합니다.");
assert.equal(normalized[0].createdAt, 100);
assert.deepEqual(parseStoredLessonSets("{broken"), [], "깨진 JSON은 빈 목록으로 복구해야 합니다.");

const storage = new MemoryStorage();
storage.values.set(
  LESSON_SETS_STORAGE_KEY,
  JSON.stringify([{ id: "legacy", title: "레거시", chordIds: ["major-c", "C"], createdAt: 1 }]),
);
const loaded = readStoredLessonSets(() => storage);
assert.deepEqual(loaded[0].chordIds, ["C"]);
assert.equal(storage.writes, 1, "정규화가 필요한 저장 데이터는 한 번 복구 저장해야 합니다.");
assert.equal(storage.values.get(LESSON_SETS_STORAGE_KEY), JSON.stringify(loaded));

const fallback = [{ id: "memory", title: "메모리", chordIds: ["D"], createdAt: 2 }];
assert.deepEqual(
  readStoredLessonSets(() => {
    throw new Error("getter blocked");
  }, fallback),
  fallback,
  "storage 접근자가 예외를 던져도 메모리 값을 유지해야 합니다.",
);
assert.deepEqual(
  readStoredLessonSets(
    () => ({ getItem: () => { throw new Error("read blocked"); }, setItem: () => undefined }),
    fallback,
  ),
  fallback,
  "storage 읽기 예외도 복구해야 합니다.",
);
assert.equal(
  writeStoredLessonSets(
    () => ({ getItem: () => null, setItem: () => { throw new Error("quota"); } }),
    fallback,
  ),
  false,
  "storage 쓰기 실패를 throw하지 않고 보고해야 합니다.",
);

const created = createLessonSet(
  [],
  { title: " 1주차 ", chordIds: ["major-c", "Am", "C"], note: " 준비물 " },
  { id: "set-1", createdAt: 123 },
);
assert.deepEqual(created.lessonSet, {
  id: "set-1",
  title: "1주차",
  chordIds: ["C", "Am"],
  note: "준비물",
  createdAt: 123,
});

let lessonSets = created.lessonSets;
lessonSets = renameLessonSet(lessonSets, "set-1", "  새 이름  ");
lessonSets = updateLessonSetNote(lessonSets, "set-1", "  바뀐 메모  ");
lessonSets = addChordToLessonSet(lessonSets, "set-1", "minor-d");
lessonSets = addChordToLessonSet(lessonSets, "set-1", "Dm");
assert.equal(lessonSets[0].title, "새 이름");
assert.equal(lessonSets[0].note, "바뀐 메모");
assert.deepEqual(lessonSets[0].chordIds, ["C", "Am", "Dm"], "추가는 끝에 배치하고 중복을 막아야 합니다.");

lessonSets = moveChordInLessonSet(lessonSets, "set-1", 2, 0);
assert.deepEqual(lessonSets[0].chordIds, ["Dm", "C", "Am"], "코드 순서를 이동해야 합니다.");
lessonSets = removeChordFromLessonSet(lessonSets, "set-1", "major-c");
assert.deepEqual(lessonSets[0].chordIds, ["Dm", "Am"]);
lessonSets = updateLessonSetNote(lessonSets, "set-1", "  ");
assert.equal("note" in lessonSets[0], false, "빈 메모는 선택 필드 자체를 제거해야 합니다.");

const imported = importLessonSet(
  lessonSets,
  { title: "공유 세트", chordIds: ["G", "minor-a"] },
  { id: "imported-new-id", createdAt: 456 },
);
assert.equal(imported.lessonSet.id, "imported-new-id");
assert.deepEqual(imported.lessonSet.chordIds, ["G", "Am"]);
assert.deepEqual(deleteLessonSet(imported.lessonSets, "set-1"), [imported.lessonSet]);

assert.match(createLessonSetId(), /^[A-Za-z0-9._:-]+$/, "생성 ID는 저장소의 안전한 문자만 사용해야 합니다.");

console.log("Lesson set storage and mutation checks passed.");

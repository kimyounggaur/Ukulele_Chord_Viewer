import assert from "node:assert/strict";
import {
  FAVORITES_STORAGE_KEY,
  MAX_RECENT_CHORDS,
  RECENT_STORAGE_KEY,
  addRecentChordId,
  normalizeChordIds,
  parseStoredChordIds,
  readStoredChordIds,
  toCurrentChordId,
  toggleFavoriteId,
  writeStoredChordIds,
  type ChordIdStorage,
} from "../src/storage/chordIds";

class MemoryStorage implements ChordIdStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

assert.equal(toCurrentChordId("major-c"), "C", "legacyId는 현재 chord.id로 마이그레이션해야 합니다.");
assert.equal(toCurrentChordId("unknown-chord"), null, "미등록 ID는 제거해야 합니다.");

assert.deepEqual(
  normalizeChordIds(["major-c", "C", "minor-a", "Am", "unknown-chord", 42]),
  ["C", "Am"],
  "레거시 마이그레이션 뒤 중복과 잘못된 값을 정리해야 합니다.",
);
assert.deepEqual(parseStoredChordIds("{broken"), [], "깨진 JSON은 빈 목록으로 복구해야 합니다.");
assert.deepEqual(parseStoredChordIds('{"id":"C"}'), [], "배열이 아닌 JSON은 빈 목록으로 복구해야 합니다.");
assert.deepEqual(parseStoredChordIds('["C","unknown-chord","major-c"]'), ["C"]);
assert.deepEqual(normalizeChordIds(["C"], 0), [], "길이 제한 0은 빈 목록이어야 합니다.");

assert.deepEqual(toggleFavoriteId(["C"], "major-c"), [], "같은 코드의 레거시 ID도 토글 제거해야 합니다.");
assert.deepEqual(toggleFavoriteId(["C"], "minor-a"), ["C", "Am"], "즐겨찾기를 중복 없이 추가해야 합니다.");

const thirteenChordIds = ["C", "D", "E", "F", "G", "A", "B", "C7", "D7", "E7", "F7", "G7", "A7"];
assert.equal(addRecentChordId(thirteenChordIds.slice(0, 12), "A7").length, MAX_RECENT_CHORDS);
assert.equal(addRecentChordId(["C", "D", "E"], "D")[0], "D", "재방문한 코드는 MRU 선두로 이동해야 합니다.");
assert.deepEqual(addRecentChordId(["C", "D", "E"], "D"), ["D", "C", "E"]);

const storage = new MemoryStorage();
storage.values.set(FAVORITES_STORAGE_KEY, '["major-c","C","unknown-chord"]');
assert.deepEqual(readStoredChordIds(() => storage, FAVORITES_STORAGE_KEY), ["C"]);
assert.equal(storage.values.get(FAVORITES_STORAGE_KEY), '["C"]', "읽은 데이터는 현재 ID 배열로 즉시 정리해야 합니다.");

storage.values.set(RECENT_STORAGE_KEY, JSON.stringify(thirteenChordIds));
assert.deepEqual(
  readStoredChordIds(() => storage, RECENT_STORAGE_KEY, [], MAX_RECENT_CHORDS),
  thirteenChordIds.slice(0, MAX_RECENT_CHORDS),
  "최근 목록은 12개로 제한해야 합니다.",
);

const fallback = ["major-c", "minor-a"];
assert.deepEqual(
  readStoredChordIds(() => { throw new Error("localStorage getter blocked"); }, FAVORITES_STORAGE_KEY, fallback),
  ["C", "Am"],
  "localStorage getter 예외에도 정리된 인메모리 값을 유지해야 합니다.",
);
assert.deepEqual(
  readStoredChordIds(() => ({
    getItem() { throw new Error("getItem blocked"); },
    setItem() { throw new Error("unused"); },
  }), FAVORITES_STORAGE_KEY, fallback),
  ["C", "Am"],
  "getItem 예외에도 인메모리 값을 유지해야 합니다.",
);

const memoryAfterFailedWrite = toggleFavoriteId(["C"], "minor-a");
assert.equal(
  writeStoredChordIds(() => ({
    getItem() { return null; },
    setItem() { throw new Error("quota exceeded"); },
  }), FAVORITES_STORAGE_KEY, memoryAfterFailedWrite),
  false,
  "setItem 예외는 호출자에게 실패로만 알려야 합니다.",
);
assert.deepEqual(memoryAfterFailedWrite, ["C", "Am"], "저장 실패가 계산된 인메모리 상태를 훼손하면 안 됩니다.");

assert.equal(writeStoredChordIds(() => storage, FAVORITES_STORAGE_KEY, ["major-c", "C", "minor-a"]), true);
assert.equal(storage.values.get(FAVORITES_STORAGE_KEY), '["C","Am"]');

console.log("✓ 코드 ID 저장소 정리·마이그레이션·MRU·예외 복구 검사 통과");

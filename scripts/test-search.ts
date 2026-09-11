import assert from "node:assert/strict";
import { staticChords } from "../src/data/chords";
import { normalizeChordSearchText } from "../src/search/normalize";
import {
  rankChordSearchMatch,
  searchChords,
  SEARCH_MATCH_RANK,
} from "../src/search/searchChords";

function ids(query: string): string[] {
  return searchChords(staticChords, query).map((chord) => chord.id);
}

export function runSearchTests(): void {
  assert.equal(normalizeChordSearchText("  Ｃ ♯ ｍ７ "), "c#m7", "NFKC·공백·♯ 정규화");
  assert.equal(normalizeChordSearchText("Dbm7"), normalizeChordSearchText("C#m7"), "Db=C#");
  assert.equal(normalizeChordSearchText("Bb"), normalizeChordSearchText("A#"), "Bb=A#");
  assert.equal(normalizeChordSearchText("Ab7"), normalizeChordSearchText("G#7"), "Ab=G#");
  assert.equal(normalizeChordSearchText("C M7"), normalizeChordSearchText("Cmaj7"), "M7=maj7");
  assert.equal(
    normalizeChordSearchText("C 메이저 세븐"),
    normalizeChordSearchText("Cmaj7"),
    "메이저세븐=maj7",
  );

  assert.deepEqual(ids("Dbm7"), ids("C#m7"), "이명동음 검색 결과가 같아야 합니다.");
  assert.ok(ids("C#m7").includes("C#m7"), "C#m7 검색 결과가 존재해야 합니다.");
  assert.deepEqual(ids("Bb"), ids("A#"), "Bb와 A# 검색 결과가 같아야 합니다.");
  assert.ok(ids("A#").includes("A#"), "A#/Bb 검색 결과가 실제로 존재해야 합니다.");
  assert.deepEqual(ids("C M7"), ids("Cmaj7"), "M7 검색 결과가 같아야 합니다.");
  assert.deepEqual(ids("C메이저세븐"), ids("Cmaj7"), "한국어 성질 동의어 결과가 같아야 합니다.");
  assert.equal(ids("다장조")[0], "C", "한국어 코드명 정확 일치");
  assert.equal(ids("가단조")[0], "Am", "한국어 코드명 정확 일치");

  const amResults = searchChords(staticChords, "am");
  assert.equal(amResults[0]?.id, "Am", "'am'의 첫 결과는 정확 일치하는 Am이어야 합니다.");

  const normalizedAm = normalizeChordSearchText("am");
  const ranks = amResults.map((chord) => rankChordSearchMatch(chord, normalizedAm));
  assert.deepEqual(ranks, [...ranks].sort((first, second) => first - second), "검색 등급 순서");

  for (const rank of [SEARCH_MATCH_RANK.exact, SEARCH_MATCH_RANK.prefix, SEARCH_MATCH_RANK.contains]) {
    const sourceIndices = amResults
      .filter((chord) => rankChordSearchMatch(chord, normalizedAm) === rank)
      .map((chord) => staticChords.indexOf(chord));
    assert.deepEqual(
      sourceIndices,
      [...sourceIndices].sort((first, second) => first - second),
      `동일 등급 ${rank}의 원본 순서 보존`,
    );
  }

  assert.deepEqual(searchChords(staticChords, ""), staticChords, "빈 검색은 원본 순서를 유지합니다.");
}

runSearchTests();
console.log("✓ 검색 정규화·이명동음·한국어·안정 정렬 검사 통과");

import assert from "node:assert/strict";
import { chordPath, qualityPath, readRouteSegment, readVoicingIndex } from "../src/routing/routes";

assert.equal(chordPath("Am"), "/c/Am");
assert.equal(chordPath("C#m7"), "/c/C%23m7");
assert.equal(chordPath("C#m7", 1), "/c/C%23m7?v=1");
assert.equal(qualityPath("major"), "/q/major");
assert.equal(readRouteSegment("C%23m7"), "C#m7");
assert.equal(readRouteSegment("%E0%A4%A"), null, "잘못된 URL 인코딩은 안전하게 거부");
assert.equal(readVoicingIndex("?v=1", 2), 1);
assert.equal(readVoicingIndex("?v=1oops", 2), 0);
assert.equal(readVoicingIndex("?v=-1", 2), 0);
assert.equal(readVoicingIndex("?v=2", 2), 0);

console.log("✓ 해시 라우트·샵 코드·운지 쿼리 검사 통과");

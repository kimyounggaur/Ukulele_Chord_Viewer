import assert from "node:assert/strict";
import { staticChords } from "../src/data/chords";
import { describeVoicing } from "../src/a11y/describeVoicing";

const chord = (id: string) => {
  const found = staticChords.find((candidate) => candidate.id === id);
  assert.ok(found, `${id} 코드가 존재해야 합니다.`);
  return found;
};

assert.match(describeVoicing(chord("C")), /1번 A줄 3프렛 3번 손가락, 나머지 개방현/);
assert.match(describeVoicing(chord("C6")), /모든 줄 개방현/);
assert.match(describeVoicing(chord("B")), /2번 E줄부터 1번 A줄까지 바레/);

function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  return channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(first: string, second: string) {
  const [bright, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (bright + 0.05) / (dark + 0.05);
}

assert.ok(contrast("#1A202C", "#FFFFFF") >= 4.5, "고대비 본문 텍스트");
assert.ok(contrast("#4A5568", "#FFFFFF") >= 4.5, "고대비 보조 텍스트");
assert.ok(contrast("#2B6CB0", "#FFFFFF") >= 3, "포커스 링 UI 대비");

console.log("✓ 운지 자동 설명과 고대비 팔레트 WCAG 대비 검사 통과");

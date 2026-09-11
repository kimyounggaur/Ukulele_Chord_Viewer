import assert from "node:assert/strict";
import { staticChords } from "../src/data/chords";
import { voicingToMidi } from "../src/audio/chordToNotes";

const expectedHighG: Record<string, number[]> = {
  C: [67, 60, 64, 72],
  F: [69, 60, 65, 69],
  G: [67, 62, 67, 71],
  Am: [69, 60, 64, 69],
};

for (const [chordId, expected] of Object.entries(expectedHighG)) {
  const chord = staticChords.find((candidate) => candidate.id === chordId);
  assert.ok(chord, `${chordId} 코드가 존재해야 합니다.`);
  assert.deepEqual(voicingToMidi(chord.voicings[0]), expected, `${chordId} High G MIDI 변환`);
}

const cChord = staticChords.find((chord) => chord.id === "C");
assert.ok(cChord);
assert.deepEqual(voicingToMidi(cChord.voicings[0], true), [55, 60, 64, 72], "C Low G MIDI 변환");

console.log("✓ C, F, G, Am High G와 C Low G 오디오 음정 변환 통과");

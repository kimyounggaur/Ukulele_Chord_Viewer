import { chords } from "../src/data/chords";
import {
  NOTE_NAMES_SHARP,
  expectedPitchClasses,
  notesForChord,
  pitchClassesOfVoicing,
} from "../src/data/theory";

function sorted(values: Set<number>): number[] {
  return [...values].sort((left, right) => left - right);
}

function noteList(values: Set<number>): string {
  return sorted(values).map((value) => NOTE_NAMES_SHARP[value]).join(" ");
}

function setsEqual(left: Set<number>, right: Set<number>): boolean {
  const leftValues = sorted(left);
  const rightValues = sorted(right);
  return leftValues.length === rightValues.length &&
    leftValues.every((value, index) => value === rightValues[index]);
}

function suggestVoicing(
  expected: Set<number>,
  current: readonly number[],
): [number, number, number, number] | null {
  let best: { frets: [number, number, number, number]; score: number } | null = null;
  const choices = [-1, 0, 1, 2, 3, 4, 5, 6, 7];
  for (const g of choices) for (const c of choices) for (const e of choices) for (const a of choices) {
    const frets: [number, number, number, number] = [g, c, e, a];
    if (frets.filter((fret) => fret >= 0).length < 3) continue;
    const actual = new Set<number>();
    frets.forEach((fret, index) => {
      if (fret >= 0) actual.add(([67, 60, 64, 69][index] + fret) % 12);
    });
    if (!setsEqual(expected, actual)) continue;
    const played = frets.filter((fret) => fret > 0);
    const span = played.length ? Math.max(...played) - Math.min(...played) : 0;
    const distance = frets.reduce(
      (sum, fret, index) =>
        sum + Math.abs((fret < 0 ? 8 : fret) - (current[index] < 0 ? 8 : current[index])),
      0,
    );
    const score = distance * 10 + span * 3 + Math.max(0, ...frets) + frets.filter((fret) => fret < 0).length * 5;
    if (!best || score < best.score) best = { frets, score };
  }
  return best?.frets ?? null;
}

const failures: string[] = [];
const ids = new Set<string>();

for (const chord of chords) {
  if (ids.has(chord.id)) failures.push(chord.id + ": id가 중복됩니다.");
  ids.add(chord.id);

  const expectedNotes = notesForChord(chord.root, chord.quality);
  if (chord.notes.join("|") !== expectedNotes.join("|")) {
    failures.push(
      chord.id + ": notes 불일치 (기대 " + expectedNotes.join(" ") +
      ", 실제 " + chord.notes.join(" ") + ")",
    );
  }

  chord.voicings.forEach((voicing, voicingIndex) => {
    if (voicing.frets.length !== 4 || voicing.fingers.length !== 4) {
      failures.push(chord.id + ": voicing " + voicingIndex + "가 GCEA 4현 튜플이 아닙니다.");
      return;
    }
    const expected = expectedPitchClasses(chord.root, chord.quality);
    const actual = pitchClassesOfVoicing(voicing);
    if (!setsEqual(expected, actual)) {
      const suggestion = suggestVoicing(expected, voicing.frets);
      failures.push(
        chord.id + " v" + voicingIndex + ": 기대 [" + noteList(expected) +
        "], 실제 [" + noteList(actual) + "], GCEA [" + voicing.frets.join(",") +
        "]" + (suggestion ? ", 추천 [" + suggestion.join(",") + "]" : ""),
      );
    }
  });
}

if (failures.length > 0) {
  console.error("코드 데이터 검증 실패 (" + failures.length + "건)");
  failures.forEach((failure) => console.error("- " + failure));
  process.exitCode = 1;
} else {
  console.log(
    "코드 데이터 검증 통과: " + chords.length +
    "개 코드, " + chords.reduce((count, chord) => count + chord.voicings.length, 0) +
    "개 운지, 줄 순서 [G,C,E,A]",
  );
}

import type { ChordQuality, ChordVoicing } from "./types";

export const OPEN_MIDI_HIGH_G = [67, 60, 64, 69] as const;
export const NOTE_NAMES_SHARP = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export const QUALITY_FORMULAS: Record<ChordQuality, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  sus4: [0, 5, 7],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sixth: [0, 4, 7, 9],
  minor6: [0, 3, 7, 9],
  dom7sus4: [0, 5, 7, 10],
  add9: [0, 2, 4, 7],
  min7flat5: [0, 3, 6, 10],
};

const ENHARMONIC_ROOTS: Record<string, string> = {
  CB: "B", "B#": "C", DB: "C#", EB: "D#", FB: "E", "E#": "F", GB: "F#", AB: "G#", BB: "A#",
};

export function normalizeRoot(root: string): string {
  const value = root.trim().replace(/♯/g, "#").replace(/♭/g, "b");
  const letter = value.slice(0, 1).toUpperCase();
  const accidental = value.slice(1) === "b" ? "B" : value.slice(1);
  const key = letter + accidental;
  return ENHARMONIC_ROOTS[key] ?? letter + (accidental === "B" ? "b" : accidental);
}

export function rootPitchClass(root: string): number {
  const normalized = normalizeRoot(root);
  const flatKey = normalized.slice(0, 1) + (normalized.slice(1) === "b" ? "B" : normalized.slice(1));
  const sharpName = ENHARMONIC_ROOTS[flatKey] ?? normalized;
  const index = NOTE_NAMES_SHARP.indexOf(sharpName as (typeof NOTE_NAMES_SHARP)[number]);
  if (index < 0) throw new Error(`지원하지 않는 코드 루트: ${root}`);
  return index;
}

export function expectedPitchClasses(root: string, quality: ChordQuality): Set<number> {
  const rootPc = rootPitchClass(root);
  return new Set(QUALITY_FORMULAS[quality].map((interval) => (rootPc + interval) % 12));
}

export function notesForChord(root: string, quality: ChordQuality): string[] {
  const rootPc = rootPitchClass(root);
  return QUALITY_FORMULAS[quality].map((interval) => NOTE_NAMES_SHARP[(rootPc + interval) % 12]);
}

export function pitchClassesOfVoicing(voicing: ChordVoicing): Set<number> {
  const result = new Set<number>();
  voicing.frets.forEach((fret, stringIndex) => {
    if (fret >= 0) result.add((OPEN_MIDI_HIGH_G[stringIndex] + fret) % 12);
  });
  return result;
}

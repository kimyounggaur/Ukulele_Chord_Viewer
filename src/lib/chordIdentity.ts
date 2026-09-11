import type { Chord } from "../data/types";

export function chordStorageKey(chord: Chord): string {
  return chord.legacyId ?? chord.id;
}

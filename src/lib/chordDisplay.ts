import type { Chord } from "../data/types";
import { qualityById } from "../data/chordQualities";

export function getChordDisplayTitle(chord: Chord): string {
  if (chord.displayName === chord.root) {
    return `${chord.root} ${qualityById[chord.quality].label}`;
  }

  return chord.displayName;
}

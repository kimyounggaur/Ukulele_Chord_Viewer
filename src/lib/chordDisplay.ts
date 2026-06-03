import type { ChordShape } from "../data/chordTypes";
import { qualityById } from "../data/chordQualities";

export function getChordDisplayTitle(chord: ChordShape): string {
  if (chord.title === chord.root) {
    return `${chord.root} ${qualityById[chord.quality].label}`;
  }

  return chord.title;
}

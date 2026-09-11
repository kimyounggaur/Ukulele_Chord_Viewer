// Compatibility exports for modules that still use the original vocabulary.
export type {
  Chord,
  ChordQuality,
  ChordVoicing,
  Finger,
  Fret,
  StringIndex,
} from "./types";

import type { Chord, ChordQuality, Finger } from "./types";

export const UKULELE_TUNING = [
  { string: 4, label: "G" },
  { string: 3, label: "C" },
  { string: 2, label: "E" },
  { string: 1, label: "A" },
] as const;

export type UkuleleString = (typeof UKULELE_TUNING)[number]["string"];
export type FingerNumber = Exclude<Finger, 0>;
export type ChordQualityId = ChordQuality;
export type ChordShape = Chord;

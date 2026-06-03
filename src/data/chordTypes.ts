export const UKULELE_TUNING = [
  { string: 4, label: "G" },
  { string: 3, label: "C" },
  { string: 2, label: "E" },
  { string: 1, label: "A" },
] as const;

export type UkuleleString = (typeof UKULELE_TUNING)[number]["string"];
export type FingerNumber = 1 | 2 | 3 | 4;

export type ChordQualityId =
  | "major"
  | "seventh"
  | "minor"
  | "minor7"
  | "sus4"
  | "major7"
  | "sixth"
  | "seventh-sus4"
  | "add9"
  | "minor7-flat5"
  | "diminish"
  | "augment"
  | "minor6";

export type FretMark = number | "x";

export interface FingerPosition {
  string: UkuleleString;
  fret: number;
  finger?: FingerNumber;
  muted?: boolean;
}

export interface ChordShape {
  id: string;
  title: string;
  root: string;
  quality: ChordQualityId;
  positions: FingerPosition[];
  baseFret?: number;
  image?: string;
  tags?: string[];
}

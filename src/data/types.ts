// Every fret tuple in the application uses string order [4:G, 3:C, 2:E, 1:A].
export type StringIndex = 0 | 1 | 2 | 3;
export type Fret = number; // 0 = open, -1 = muted
export type Finger = 0 | 1 | 2 | 3 | 4; // 0 = unused

export type ChordQuality =
  | "major"
  | "minor"
  | "dom7"
  | "maj7"
  | "min7"
  | "sus4"
  | "dim7"
  | "aug"
  | "sixth"
  | "minor6"
  | "dom7sus4"
  | "add9"
  | "min7flat5";

export interface ChordVoicing {
  frets: [Fret, Fret, Fret, Fret];
  fingers: [Finger, Finger, Finger, Finger];
  baseFret: number;
  barre?: { fret: number; from: StringIndex; to: StringIndex };
  difficulty: 1 | 2 | 3;
  label?: string;
}

export interface Chord {
  id: string;
  root: string;
  quality: ChordQuality;
  displayName: string;
  koreanName: string;
  voicings: ChordVoicing[];
  imageFile?: string;
  notes: string[];
  tags?: string[];
  /** Previous storage/hotspot key retained to migrate browser-local data safely. */
  legacyId?: string;
}

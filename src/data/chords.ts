import { qualityById } from "./chordQualities";
import { notesForChord } from "./theory";
import type { Chord, ChordQuality, ChordVoicing, Finger, StringIndex } from "./types";
import { rootToSlug } from "../lib/slug";

const NATURAL_ROOTS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const CHROMATIC_ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const MIN7_IMAGE_ROOTS = ["A", "B", "C", "C#", "D", "E", "F", "F#", "G", "G#"] as const;
const MIN7_ROOTS = [...MIN7_IMAGE_ROOTS, "A#"] as const;
const APPENDIX_B_FLAT_ROOTS = [...NATURAL_ROOTS, "A#"] as const;

type FretTuple = readonly [number, number, number, number];
type FingerTuple = readonly [Finger, Finger, Finger, Finger];

interface Pattern {
  frets: FretTuple;
  fingers?: FingerTuple;
  baseFret?: number;
  label?: string;
}

interface QualityBuildConfig {
  quality: ChordQuality;
  idSuffix: string;
  displaySuffix: string;
  legacyQuality: string;
  imageDirectory?: string;
  imageRoots?: readonly string[];
  roots: readonly string[];
  aliases?: readonly string[];
  patterns: Record<string, Pattern>;
}

const KOREAN_ROOTS: Record<string, string> = {
  C: "다",
  "C#": "올림다",
  D: "라",
  "D#": "올림라",
  E: "마",
  F: "바",
  "F#": "올림바",
  G: "사",
  "G#": "올림사",
  A: "가",
  "A#": "올림가",
  B: "나",
};

const KOREAN_QUALITIES: Record<ChordQuality, string> = {
  major: "장조",
  minor: "단조",
  dom7: "도미넌트 세븐",
  maj7: "메이저 세븐",
  min7: "마이너 세븐",
  sus4: "서스포",
  dim7: "디미니시드 세븐",
  aug: "어그먼트",
  sixth: "식스",
  minor6: "마이너 식스",
  dom7sus4: "세븐 서스포",
  add9: "애드나인",
  min7flat5: "마이너 세븐 플랫 파이브",
};

function inferDifficulty(frets: FretTuple): 1 | 2 | 3 {
  const played = frets.filter((fret) => fret > 0);
  if (played.length <= 1 && Math.max(0, ...played) <= 3) return 1;
  if (Math.max(0, ...played) <= 3) return 2;
  return 3;
}

function inferBarre(frets: FretTuple, fingers: FingerTuple): ChordVoicing["barre"] {
  for (const finger of [1, 2, 3, 4] as const) {
    const indices = fingers
      .map((value, index) => ({ value, index: index as StringIndex }))
      .filter(({ value, index }) => value === finger && frets[index] > 0)
      .map(({ index }) => index);
    if (indices.length >= 2) {
      const fret = frets[indices[0]];
      if (indices.every((index) => frets[index] === fret)) {
        return { fret, from: indices[0], to: indices[indices.length - 1] };
      }
    }
  }
  return undefined;
}

function voicingFromPattern(pattern: Pattern): ChordVoicing {
  const fingers: FingerTuple = pattern.fingers ?? [0, 0, 0, 0];
  const barre = inferBarre(pattern.frets, fingers);
  return {
    frets: [...pattern.frets],
    fingers: [...fingers],
    baseFret: pattern.baseFret ?? 1,
    difficulty: inferDifficulty(pattern.frets),
    label: pattern.label ?? "기본형",
    ...(barre ? { barre } : {}),
  };
}

function buildChord(config: QualityBuildConfig, root: string): Chord {
  const pattern = config.patterns[root];
  if (!pattern) throw new Error(config.quality + " " + root + " 운지 데이터가 없습니다.");
  const displayName = root + config.displaySuffix;
  const hasImage = Boolean(config.imageDirectory && config.imageRoots?.includes(root));
  const quality = qualityById[config.quality];
  return {
    id: root + config.idSuffix,
    root,
    quality: config.quality,
    displayName,
    koreanName: (KOREAN_ROOTS[root] ?? root) + KOREAN_QUALITIES[config.quality],
    voicings: [voicingFromPattern(pattern)],
    ...(hasImage
      ? { imageFile: "chords/" + config.imageDirectory + "/" + rootToSlug(root) + ".png" }
      : {}),
    notes: notesForChord(root, config.quality),
    tags: [
      root,
      displayName,
      quality.label,
      quality.shortLabel,
      ...quality.aliases,
      ...(config.aliases ?? []),
      "GCEA",
      "ukulele",
      "우쿨렐레",
    ],
    legacyId: config.legacyQuality + "-" + rootToSlug(root),
  };
}

const majorPatterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] },
  "C#": { frets: [1, 1, 1, 4], fingers: [1, 1, 1, 4] },
  D: { frets: [2, 2, 2, 0], fingers: [1, 2, 3, 0] },
  "D#": { frets: [0, 3, 3, 1], fingers: [0, 2, 3, 1] },
  E: { frets: [4, 4, 4, 2], fingers: [2, 3, 4, 1] },
  F: { frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] },
  "F#": { frets: [3, 1, 2, 1], fingers: [3, 1, 2, 1] },
  G: { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] },
  "G#": { frets: [5, 3, 4, 3], fingers: [3, 1, 2, 1] },
  A: { frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] },
  "A#": { frets: [3, 2, 1, 1], fingers: [3, 2, 1, 1] },
  B: { frets: [4, 3, 2, 2], fingers: [4, 3, 1, 1] },
};

const dom7Patterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] },
  "C#": { frets: [1, 1, 1, 2], fingers: [1, 1, 1, 2] },
  D: { frets: [2, 2, 2, 3], fingers: [1, 1, 1, 3] },
  "D#": { frets: [3, 3, 3, 4], fingers: [1, 1, 1, 4] },
  E: { frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] },
  F: { frets: [2, 3, 1, 3], fingers: [2, 3, 1, 4] },
  "F#": { frets: [3, 4, 2, 4], fingers: [2, 3, 1, 4] },
  G: { frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] },
  "G#": { frets: [1, 3, 2, 3], fingers: [1, 3, 2, 4] },
  A: { frets: [0, 1, 0, 0], fingers: [0, 1, 0, 0] },
  "A#": { frets: [1, 2, 1, 1], fingers: [1, 2, 1, 1] },
  B: { frets: [2, 3, 2, 2], fingers: [1, 3, 1, 1] },
};

const minorPatterns: Record<string, Pattern> = {
  C: { frets: [0, 3, 3, 3], fingers: [0, 1, 2, 3] },
  "C#": { frets: [1, 1, 0, 4], fingers: [1, 1, 0, 4] },
  D: { frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] },
  "D#": { frets: [3, 3, 2, 1], fingers: [3, 4, 2, 1] },
  E: { frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1] },
  F: { frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] },
  "F#": { frets: [2, 1, 2, 0], fingers: [2, 1, 3, 0] },
  G: { frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] },
  "G#": { frets: [4, 3, 4, 2], fingers: [3, 1, 4, 2] },
  A: { frets: [2, 0, 0, 0], fingers: [2, 0, 0, 0] },
  "A#": { frets: [3, 1, 1, 1], fingers: [3, 1, 1, 1] },
  B: { frets: [4, 2, 2, 2], fingers: [3, 1, 1, 1] },
};

const min7Patterns: Record<string, Pattern> = {
  A: { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] },
  B: { frets: [2, 2, 2, 2], fingers: [1, 1, 1, 1] },
  C: { frets: [3, 3, 3, 3], fingers: [1, 1, 1, 1] },
  "C#": { frets: [4, 4, 4, 4], fingers: [1, 1, 1, 1] },
  D: { frets: [2, 2, 1, 3], fingers: [2, 3, 1, 4] },
  E: { frets: [0, 2, 0, 2], fingers: [0, 1, 0, 2] },
  F: { frets: [1, 3, 1, 3], fingers: [1, 3, 1, 4] },
  "F#": { frets: [2, 4, 2, 4], fingers: [1, 3, 1, 4] },
  G: { frets: [0, 2, 1, 1], fingers: [0, 2, 1, 1] },
  "G#": { frets: [1, 3, 2, 2], fingers: [1, 3, 2, 2] },
  "A#": { frets: [1, 1, 1, 1], fingers: [1, 1, 1, 1] },
};

const sus4Patterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 1, 3], fingers: [0, 0, 1, 3] },
  D: { frets: [0, 2, 3, 0], fingers: [0, 1, 3, 0] },
  E: { frets: [4, 4, 0, 0], fingers: [3, 4, 0, 0] },
  F: { frets: [3, 0, 1, 1], fingers: [3, 0, 1, 1] },
  G: { frets: [0, 2, 3, 3], fingers: [0, 1, 2, 3] },
  A: { frets: [2, 2, 0, 0], fingers: [1, 2, 0, 0] },
  "A#": { frets: [3, 3, 1, 1], fingers: [3, 4, 1, 1] },
  B: { frets: [4, 4, 2, 2], fingers: [3, 4, 1, 1] },
};

const maj7Patterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 0, 2], fingers: [0, 0, 0, 2] },
  D: { frets: [2, 2, 2, 4], fingers: [1, 1, 1, 4] },
  E: { frets: [1, 3, 0, 2], fingers: [1, 3, 0, 2] },
  F: { frets: [2, 4, 1, 3], fingers: [2, 4, 1, 3] },
  G: { frets: [0, 2, 2, 2], fingers: [0, 1, 1, 1] },
  A: { frets: [1, 1, 0, 0], fingers: [1, 2, 0, 0] },
  "A#": { frets: [3, 2, 1, 0], fingers: [3, 2, 1, 0] },
  B: { frets: [3, 3, 2, 2], fingers: [2, 3, 1, 1] },
};

const sixthPatterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] },
  D: { frets: [2, 2, 2, 2], fingers: [1, 1, 1, 1] },
  E: { frets: [4, 4, 4, 4], fingers: [1, 1, 1, 1] },
  F: { frets: [2, 2, 1, 3], fingers: [2, 3, 1, 4] },
  G: { frets: [0, 2, 0, 2], fingers: [0, 1, 0, 2] },
  A: { frets: [2, 4, 2, 4], fingers: [1, 3, 1, 4] },
  B: { frets: [1, 3, 2, 2], fingers: [1, 4, 2, 3] },
};

const dom7Sus4Patterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 1, 1], fingers: [0, 0, 1, 2] },
  D: { frets: [2, 2, 3, 3], fingers: [1, 1, 3, 4] },
  E: { frets: [2, 2, 0, 2], fingers: [1, 2, 0, 3] },
  F: { frets: [3, 3, 1, 3], fingers: [2, 3, 1, 4] },
  G: { frets: [0, 2, 1, 3], fingers: [0, 2, 1, 3] },
  A: { frets: [0, 2, 0, 0], fingers: [0, 2, 0, 0] },
  B: { frets: [2, 4, 2, 2], fingers: [1, 3, 1, 1] },
};

const add9Patterns: Record<string, Pattern> = {
  C: { frets: [0, 2, 0, 3], fingers: [0, 1, 0, 3] },
  D: { frets: [2, 4, 2, 5], fingers: [1, 3, 1, 4] },
  E: { frets: [1, 4, 2, 2], fingers: [1, 4, 2, 2] },
  F: { frets: [0, 0, 1, 0], fingers: [0, 0, 1, 0] },
  G: { frets: [2, 2, 3, 2], fingers: [1, 1, 2, 1] },
  A: { frets: [2, 1, 0, 2], fingers: [2, 1, 0, 3] },
  B: { frets: [4, 3, 2, 4], fingers: [3, 2, 1, 4] },
};

const min7Flat5Patterns: Record<string, Pattern> = {
  C: { frets: [3, 3, 2, 3], fingers: [2, 3, 1, 4] },
  D: { frets: [1, 2, 1, 3], fingers: [1, 2, 1, 4] },
  E: { frets: [0, 2, 0, 1], fingers: [0, 2, 0, 1] },
  F: { frets: [1, 3, 1, 2], fingers: [1, 4, 2, 3] },
  G: { frets: [0, 1, 1, 1], fingers: [0, 1, 1, 1] },
  A: { frets: [2, 3, 3, 3], fingers: [1, 2, 3, 4] },
  B: { frets: [2, 2, 1, 2], fingers: [2, 3, 1, 4] },
};

const dim7Patterns: Record<string, Pattern> = {
  C: { frets: [2, 3, 2, 3], fingers: [1, 3, 2, 4] },
  D: { frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },
  E: { frets: [0, 1, 0, 1], fingers: [0, 1, 0, 2] },
  F: { frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },
  G: { frets: [0, 1, 0, 1], fingers: [0, 1, 0, 2] },
  A: { frets: [2, 3, 2, 3], fingers: [1, 3, 2, 4] },
  B: { frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },
};

const augPatterns: Record<string, Pattern> = {
  C: { frets: [1, 0, 0, 3], fingers: [1, 0, 0, 3] },
  D: { frets: [3, 2, 2, 1], fingers: [4, 2, 3, 1] },
  E: { frets: [1, 0, 0, 3], fingers: [1, 0, 0, 3] },
  F: { frets: [2, 1, 1, 0], fingers: [3, 1, 2, 0] },
  G: { frets: [0, 3, 3, 2], fingers: [0, 3, 4, 2] },
  A: { frets: [2, 1, 1, 0], fingers: [3, 1, 2, 0] },
  B: { frets: [0, 3, 3, 2], fingers: [0, 2, 3, 1] },
};

const minor6Patterns: Record<string, Pattern> = {
  C: { frets: [2, 3, 3, 3], fingers: [1, 2, 3, 4] },
  D: { frets: [2, 2, 1, 2], fingers: [2, 3, 1, 4] },
  E: { frets: [4, 4, 3, 4], fingers: [2, 3, 1, 4] },
  F: { frets: [1, 2, 1, 3], fingers: [1, 2, 1, 4] },
  G: { frets: [0, 2, 0, 1], fingers: [0, 2, 0, 1] },
  A: { frets: [2, 4, 2, 3], fingers: [1, 3, 1, 2] },
  B: { frets: [1, 2, 2, 2], fingers: [1, 2, 3, 4] },
};

const qualityConfigs: QualityBuildConfig[] = [
  { quality: "major", idSuffix: "", displaySuffix: "", legacyQuality: "major", imageDirectory: "major", roots: CHROMATIC_ROOTS, imageRoots: NATURAL_ROOTS, patterns: majorPatterns },
  { quality: "dom7", idSuffix: "7", displaySuffix: "7", legacyQuality: "seventh", imageDirectory: "seventh", roots: CHROMATIC_ROOTS, imageRoots: NATURAL_ROOTS, patterns: dom7Patterns },
  { quality: "minor", idSuffix: "m", displaySuffix: "m", legacyQuality: "minor", imageDirectory: "minor", roots: CHROMATIC_ROOTS, imageRoots: NATURAL_ROOTS, patterns: minorPatterns },
  { quality: "min7", idSuffix: "m7", displaySuffix: "m7", legacyQuality: "minor7", imageDirectory: "minor7", roots: MIN7_ROOTS, imageRoots: MIN7_IMAGE_ROOTS, patterns: min7Patterns },
  { quality: "sus4", idSuffix: "sus4", displaySuffix: "sus4", legacyQuality: "sus4", imageDirectory: "sus4", roots: APPENDIX_B_FLAT_ROOTS, imageRoots: NATURAL_ROOTS, patterns: sus4Patterns },
  { quality: "maj7", idSuffix: "maj7", displaySuffix: "M7", legacyQuality: "major7", imageDirectory: "major7", roots: APPENDIX_B_FLAT_ROOTS, imageRoots: NATURAL_ROOTS, patterns: maj7Patterns, aliases: ["maj7"] },
  { quality: "sixth", idSuffix: "6", displaySuffix: "6", legacyQuality: "sixth", imageDirectory: "sixth", roots: NATURAL_ROOTS, imageRoots: NATURAL_ROOTS, patterns: sixthPatterns },
  { quality: "dom7sus4", idSuffix: "7sus4", displaySuffix: "7sus4", legacyQuality: "seventh-sus4", imageDirectory: "seventh-sus4", roots: NATURAL_ROOTS, imageRoots: NATURAL_ROOTS, patterns: dom7Sus4Patterns },
  { quality: "add9", idSuffix: "add9", displaySuffix: "add9", legacyQuality: "add9", imageDirectory: "add9", roots: NATURAL_ROOTS, imageRoots: NATURAL_ROOTS, patterns: add9Patterns, aliases: ["add2"] },
  { quality: "min7flat5", idSuffix: "m7b5", displaySuffix: "m7(b5)", legacyQuality: "minor7-flat5", imageDirectory: "minor7-flat5", roots: NATURAL_ROOTS, imageRoots: NATURAL_ROOTS, patterns: min7Flat5Patterns },
  { quality: "dim7", idSuffix: "dim7", displaySuffix: "dim", legacyQuality: "diminish", roots: NATURAL_ROOTS, patterns: dim7Patterns },
  { quality: "aug", idSuffix: "aug", displaySuffix: "aug", legacyQuality: "augment", roots: NATURAL_ROOTS, patterns: augPatterns },
  { quality: "minor6", idSuffix: "m6", displaySuffix: "m6", legacyQuality: "minor6", imageDirectory: "minor6", roots: NATURAL_ROOTS, imageRoots: NATURAL_ROOTS, patterns: minor6Patterns },
];

export const chords: Chord[] = qualityConfigs.flatMap((config) =>
  config.roots.map((root) => buildChord(config, root)),
);

// Kept during the migration so existing imports and external consumers remain stable.
export const staticChords = chords;

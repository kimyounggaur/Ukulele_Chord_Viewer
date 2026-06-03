import type {
  ChordQualityId,
  ChordShape,
  FingerNumber,
  FretMark,
  UkuleleString,
} from "./chordTypes";
import { qualityById } from "./chordQualities";
import { rootToSlug } from "../lib/slug";

const NATURAL_ROOTS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const MINOR7_ROOTS = ["A", "B", "C", "C#", "D", "E", "F#", "G", "G#"] as const;
const STRING_ORDER = [4, 3, 2, 1] as const satisfies readonly UkuleleString[];

type FretTuple = readonly [FretMark, FretMark, FretMark, FretMark];
type FingerTuple = readonly [
  FingerNumber | 0,
  FingerNumber | 0,
  FingerNumber | 0,
  FingerNumber | 0,
];

interface Pattern {
  frets: FretTuple;
  fingers?: FingerTuple;
  baseFret?: number;
}

interface QualityBuildConfig {
  quality: ChordQualityId;
  suffix: string;
  imageQuality?: string;
  imageRoots?: readonly string[];
  roots?: readonly string[];
  aliases?: readonly string[];
  patterns: Record<string, Pattern>;
}

function positionsFromGCEA(pattern: Pattern): ChordShape["positions"] {
  return pattern.frets.map((fret, index) => {
    const finger = pattern.fingers?.[index];
    const string = STRING_ORDER[index];

    if (fret === "x") {
      return { string, fret: 0, muted: true };
    }

    return {
      string,
      fret,
      ...(fret > 0 && finger ? { finger } : {}),
    };
  });
}

function imagePath(quality: string, root: string): string {
  return `/chords/${quality}/${rootToSlug(root)}.png`;
}

function buildChord(config: QualityBuildConfig, root: string): ChordShape {
  const quality = qualityById[config.quality];
  const title = `${root}${config.suffix}`;
  const imageQuality = config.imageQuality ?? config.quality;
  const hasImage = config.imageRoots?.includes(root) ?? true;
  const fallbackPattern = config.patterns[root] ?? config.patterns.C;

  return {
    id: `${config.quality}-${rootToSlug(root)}`,
    title,
    root,
    quality: config.quality,
    positions: positionsFromGCEA(fallbackPattern),
    ...(fallbackPattern.baseFret ? { baseFret: fallbackPattern.baseFret } : {}),
    ...(hasImage ? { image: imagePath(imageQuality, root) } : {}),
    tags: [
      root,
      title,
      quality.label,
      quality.shortLabel,
      ...quality.aliases,
      ...(config.aliases ?? []),
      "GCEA",
      "ukulele",
    ],
  };
}

const majorPatterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] },
  D: { frets: [2, 2, 2, 0], fingers: [1, 2, 3, 0] },
  E: { frets: [4, 4, 4, 2], fingers: [2, 3, 4, 1] },
  F: { frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] },
  G: { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] },
  A: { frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] },
  B: { frets: [4, 3, 2, 2], fingers: [4, 3, 1, 1] },
};

const seventhPatterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] },
  D: { frets: [2, 2, 2, 3], fingers: [1, 1, 1, 3] },
  E: { frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] },
  F: { frets: [2, 3, 1, 0], fingers: [2, 3, 1, 0] },
  G: { frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] },
  A: { frets: [0, 1, 0, 0], fingers: [0, 1, 0, 0] },
  B: { frets: [2, 3, 2, 2], fingers: [1, 3, 1, 1] },
};

const minorPatterns: Record<string, Pattern> = {
  C: { frets: [0, 3, 3, 3], fingers: [0, 1, 2, 3] },
  D: { frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] },
  E: { frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1] },
  F: { frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] },
  G: { frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] },
  A: { frets: [2, 0, 0, 0], fingers: [2, 0, 0, 0] },
  B: { frets: [4, 2, 2, 2], fingers: [3, 1, 1, 1] },
};

const minor7Patterns: Record<string, Pattern> = {
  A: { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] },
  B: { frets: [2, 2, 2, 2], fingers: [1, 1, 1, 1] },
  C: { frets: [3, 3, 3, 3], fingers: [1, 1, 1, 1] },
  "C#": { frets: [4, 4, 4, 4], fingers: [1, 1, 1, 1] },
  D: { frets: [2, 2, 1, 3], fingers: [2, 3, 1, 4] },
  E: { frets: [0, 2, 0, 2], fingers: [0, 1, 0, 2] },
  "F#": { frets: [2, 4, 2, 4], fingers: [1, 3, 1, 4] },
  G: { frets: [0, 2, 1, 1], fingers: [0, 2, 1, 1] },
  "G#": { frets: [1, 3, 2, 2], fingers: [1, 3, 2, 2] },
};

const sus4Patterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 1, 3], fingers: [0, 0, 1, 3] },
  D: { frets: [0, 2, 3, 0], fingers: [0, 1, 3, 0] },
  E: { frets: [4, 4, 0, 2], fingers: [3, 4, 0, 1] },
  F: { frets: [3, 0, 1, 1], fingers: [3, 0, 1, 1] },
  G: { frets: [0, 2, 3, 3], fingers: [0, 1, 2, 3] },
  A: { frets: [2, 2, 0, 0], fingers: [1, 2, 0, 0] },
  B: { frets: [4, 4, 2, 2], fingers: [3, 4, 1, 1] },
};

const major7Patterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 0, 2], fingers: [0, 0, 0, 2] },
  D: { frets: [2, 2, 2, 4], fingers: [1, 1, 1, 4] },
  E: { frets: [1, 3, 0, 2], fingers: [1, 3, 0, 2] },
  F: { frets: [2, 4, 1, 3], fingers: [2, 4, 1, 3] },
  G: { frets: [0, 2, 2, 2], fingers: [0, 1, 1, 1] },
  A: { frets: [1, 1, 0, 0], fingers: [1, 2, 0, 0] },
  B: { frets: [3, 3, 2, 2], fingers: [2, 3, 1, 1] },
};

const sixthPatterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] },
  D: { frets: [2, 2, 2, 2], fingers: [1, 1, 1, 1] },
  E: { frets: [4, 4, 4, 4], fingers: [1, 1, 1, 1] },
  F: { frets: [2, 2, 1, 3], fingers: [2, 3, 1, 4] },
  G: { frets: [0, 2, 0, 2], fingers: [0, 1, 0, 2] },
  A: { frets: [2, 4, 2, 4], fingers: [1, 3, 1, 4] },
  B: { frets: [4, 3, 4, 4], fingers: [2, 1, 3, 4] },
};

const seventhSus4Patterns: Record<string, Pattern> = {
  C: { frets: [0, 0, 1, 1], fingers: [0, 0, 1, 2] },
  D: { frets: [2, 2, 3, 3], fingers: [1, 1, 3, 4] },
  E: { frets: [2, 4, 0, 2], fingers: [1, 3, 0, 2] },
  F: { frets: [3, 3, 1, 1], fingers: [3, 4, 1, 1] },
  G: { frets: [0, 2, 1, 3], fingers: [0, 2, 1, 3] },
  A: { frets: [0, 2, 0, 0], fingers: [0, 2, 0, 0] },
  B: { frets: [2, 4, 2, 2], fingers: [1, 3, 1, 1] },
};

const add9Patterns: Record<string, Pattern> = {
  C: { frets: [0, 2, 0, 3], fingers: [0, 1, 0, 3] },
  D: { frets: [2, 2, 0, 0], fingers: [1, 2, 0, 0] },
  E: { frets: [4, 4, 2, 2], fingers: [3, 4, 1, 1] },
  F: { frets: [2, 0, 3, 0], fingers: [1, 0, 3, 0] },
  G: { frets: [0, 2, 3, 0], fingers: [0, 1, 3, 0] },
  A: { frets: [2, 1, 2, 2], fingers: [2, 1, 3, 4] },
  B: { frets: [4, 3, 4, 4], fingers: [2, 1, 3, 4] },
};

const minor7Flat5Patterns: Record<string, Pattern> = {
  C: { frets: [2, 3, 3, 3], fingers: [1, 2, 3, 4] },
  D: { frets: [1, 2, 1, 3], fingers: [1, 2, 1, 4] },
  E: { frets: [0, 1, 0, 1], fingers: [0, 1, 0, 2] },
  F: { frets: [1, 2, 1, 2], fingers: [1, 3, 1, 4] },
  G: { frets: [0, 1, 1, 1], fingers: [0, 1, 1, 1] },
  A: { frets: [2, 3, 2, 3], fingers: [1, 3, 1, 4] },
  B: { frets: [1, 2, 2, 2], fingers: [1, 2, 3, 4] },
};

const diminishPatterns: Record<string, Pattern> = {
  C: { frets: [2, 3, 2, 3], fingers: [1, 3, 2, 4] },
  D: { frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },
  E: { frets: [0, 1, 0, 1], fingers: [0, 1, 0, 2] },
  F: { frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },
  G: { frets: [0, 1, 2, 1], fingers: [0, 1, 3, 2] },
  A: { frets: [2, 3, 2, 3], fingers: [1, 3, 2, 4] },
  B: { frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },
};

const augmentPatterns: Record<string, Pattern> = {
  C: { frets: [1, 0, 0, 3], fingers: [1, 0, 0, 3] },
  D: { frets: [3, 2, 2, 1], fingers: [4, 2, 3, 1] },
  E: { frets: [1, 0, 0, 3], fingers: [1, 0, 0, 3], baseFret: 5 },
  F: { frets: [2, 1, 1, 0], fingers: [3, 1, 2, 0] },
  G: { frets: [0, 3, 3, 2], fingers: [0, 3, 4, 2] },
  A: { frets: [3, 2, 1, 1], fingers: [4, 3, 1, 1] },
  B: { frets: [0, 3, 2, 2], fingers: [0, 4, 2, 3] },
};

const minor6Patterns: Record<string, Pattern> = {
  C: { frets: [2, 3, 3, 3], fingers: [1, 2, 3, 4] },
  D: { frets: [2, 2, 1, 2], fingers: [2, 3, 1, 4] },
  E: { frets: [0, 4, 3, 4], fingers: [0, 3, 1, 4] },
  F: { frets: [1, 2, 1, 3], fingers: [1, 2, 1, 4] },
  G: { frets: [0, 2, 3, 3], fingers: [0, 1, 3, 4] },
  A: { frets: [2, 4, 2, 3], fingers: [1, 3, 1, 2] },
  B: { frets: [1, 2, 2, 2], fingers: [1, 2, 3, 4] },
};

const qualityConfigs: QualityBuildConfig[] = [
  {
    quality: "major",
    suffix: "",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    patterns: majorPatterns,
  },
  {
    quality: "seventh",
    suffix: "7",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    patterns: seventhPatterns,
  },
  {
    quality: "minor",
    suffix: "m",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    patterns: minorPatterns,
  },
  {
    quality: "minor7",
    suffix: "m7",
    roots: MINOR7_ROOTS,
    imageRoots: MINOR7_ROOTS,
    patterns: minor7Patterns,
  },
  {
    quality: "sus4",
    suffix: "sus4",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    patterns: sus4Patterns,
  },
  {
    quality: "major7",
    suffix: "M7",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    patterns: major7Patterns,
    aliases: ["maj7"],
  },
  {
    quality: "sixth",
    suffix: "6",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    patterns: sixthPatterns,
  },
  {
    quality: "seventh-sus4",
    suffix: "7sus4",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    patterns: seventhSus4Patterns,
  },
  {
    quality: "add9",
    suffix: "add9",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    patterns: add9Patterns,
    aliases: ["add2"],
  },
  {
    quality: "minor7-flat5",
    suffix: "m7(b5)",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    imageQuality: "minor7-flat5",
    patterns: minor7Flat5Patterns,
    aliases: ["m7-5"],
  },
  {
    quality: "diminish",
    suffix: "dim",
    roots: NATURAL_ROOTS,
    imageRoots: [],
    patterns: diminishPatterns,
  },
  {
    quality: "augment",
    suffix: "aug",
    roots: NATURAL_ROOTS,
    imageRoots: [],
    patterns: augmentPatterns,
  },
  {
    quality: "minor6",
    suffix: "m6",
    roots: NATURAL_ROOTS,
    imageRoots: NATURAL_ROOTS,
    patterns: minor6Patterns,
  },
];

export const staticChords: ChordShape[] = qualityConfigs.flatMap((config) =>
  (config.roots ?? NATURAL_ROOTS).map((root) => buildChord(config, root)),
);

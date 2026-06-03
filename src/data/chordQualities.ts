import type { ChordQualityId } from "./chordTypes";

export interface ChordQuality {
  id: ChordQualityId;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  softColor: string;
  aliases: string[];
}

export const MAIN_QUALITY_IDS = [
  "major",
  "seventh",
  "minor",
  "minor7",
  "sus4",
  "major7",
  "sixth",
  "seventh-sus4",
  "add9",
  "minor7-flat5",
  "diminish",
  "augment",
] as const satisfies readonly ChordQualityId[];

export const chordQualities: ChordQuality[] = [
  {
    id: "major",
    label: "Major",
    shortLabel: "Major",
    description: "bright open triads",
    color: "#ff7daf",
    softColor: "#fff1f7",
    aliases: ["maj", "major"],
  },
  {
    id: "seventh",
    label: "7",
    shortLabel: "7",
    description: "dominant seventh",
    color: "#ff9d6c",
    softColor: "#fff4ed",
    aliases: ["7th", "dominant"],
  },
  {
    id: "minor",
    label: "minor",
    shortLabel: "minor",
    description: "minor triads",
    color: "#7bc7ff",
    softColor: "#eff9ff",
    aliases: ["m", "minor"],
  },
  {
    id: "minor7",
    label: "minor7",
    shortLabel: "m7",
    description: "minor seventh",
    color: "#8dcf7a",
    softColor: "#f3fbef",
    aliases: ["m7", "minor 7"],
  },
  {
    id: "sus4",
    label: "sus4",
    shortLabel: "sus4",
    description: "suspended fourth",
    color: "#c58cff",
    softColor: "#f8f1ff",
    aliases: ["suspended"],
  },
  {
    id: "major7",
    label: "Major 7",
    shortLabel: "M7",
    description: "major seventh",
    color: "#f4c84d",
    softColor: "#fff9df",
    aliases: ["maj7", "major7", "M7"],
  },
  {
    id: "sixth",
    label: "6",
    shortLabel: "6",
    description: "sixth chords",
    color: "#42c9b7",
    softColor: "#edfcfa",
    aliases: ["6th", "sixth"],
  },
  {
    id: "seventh-sus4",
    label: "7sus4",
    shortLabel: "7sus4",
    description: "dominant suspended",
    color: "#ff82d2",
    softColor: "#fff0fb",
    aliases: ["7 sus4", "sus7"],
  },
  {
    id: "add9",
    label: "add2",
    shortLabel: "add2",
    description: "added ninth",
    color: "#64a7ff",
    softColor: "#eff6ff",
    aliases: ["add9", "add 9", "add 2"],
  },
  {
    id: "minor7-flat5",
    label: "m7(b5)",
    shortLabel: "m7(b5)",
    description: "half-diminished",
    color: "#ad9b78",
    softColor: "#fbf7ef",
    aliases: ["m7-5", "half diminished"],
  },
  {
    id: "diminish",
    label: "diminish",
    shortLabel: "dim",
    description: "diminished shapes",
    color: "#8a95a5",
    softColor: "#f4f6f8",
    aliases: ["dim", "diminished"],
  },
  {
    id: "augment",
    label: "Augment",
    shortLabel: "aug",
    description: "augmented shapes",
    color: "#ef6f6c",
    softColor: "#fff0ef",
    aliases: ["aug", "augmented"],
  },
  {
    id: "minor6",
    label: "minor 6",
    shortLabel: "m6",
    description: "minor sixth source set",
    color: "#6f8cff",
    softColor: "#f1f4ff",
    aliases: ["m6", "minor6"],
  },
];

export const qualityById = chordQualities.reduce<Record<ChordQualityId, ChordQuality>>(
  (accumulator, quality) => {
    accumulator[quality.id] = quality;
    return accumulator;
  },
  {} as Record<ChordQualityId, ChordQuality>,
);

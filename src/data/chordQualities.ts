import type { ChordQuality } from "./types";

export interface ChordQualityInfo {
  id: ChordQuality;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  darkColor: string;
  softColor: string;
  aliases: string[];
}

export const MAIN_QUALITY_IDS = [
  "major",
  "dom7",
  "minor",
  "min7",
  "sus4",
  "maj7",
  "sixth",
  "dom7sus4",
  "add9",
  "min7flat5",
  "dim7",
  "aug",
] as const satisfies readonly ChordQuality[];

export const chordQualities: ChordQualityInfo[] = [
  { id: "major", label: "Major", shortLabel: "Major", description: "메이저", color: "#f97316", darkColor: "#FF6B6B", softColor: "#fff7ed", aliases: ["maj", "major", "메이저", "장조"] },
  { id: "dom7", label: "7", shortLabel: "7", description: "도미넌트 세븐", color: "#f59e0b", darkColor: "#FFD93D", softColor: "#fffbeb", aliases: ["7th", "dominant", "dom7", "세븐"] },
  { id: "minor", label: "minor", shortLabel: "m", description: "마이너", color: "#38bdf8", darkColor: "#4ECDC4", softColor: "#f0f9ff", aliases: ["m", "minor", "마이너", "단조"] },
  { id: "min7", label: "minor7", shortLabel: "m7", description: "마이너 세븐", color: "#22c55e", darkColor: "#FF8FAB", softColor: "#f0fdf4", aliases: ["m7", "minor7", "마이너세븐"] },
  { id: "sus4", label: "sus4", shortLabel: "sus4", description: "서스포", color: "#a855f7", darkColor: "#68D391", softColor: "#faf5ff", aliases: ["suspended", "서스포"] },
  { id: "maj7", label: "Major 7", shortLabel: "M7", description: "메이저 세븐", color: "#f43f5e", darkColor: "#A79BFF", softColor: "#fff1f2", aliases: ["maj7", "major7", "M7", "메이저세븐"] },
  { id: "sixth", label: "6", shortLabel: "6", description: "식스", color: "#14b8a6", darkColor: "#68D391", softColor: "#f0fdfa", aliases: ["6th", "sixth", "식스"] },
  { id: "dom7sus4", label: "7sus4", shortLabel: "7sus4", description: "세븐 서스포", color: "#ec4899", darkColor: "#FF8FAB", softColor: "#fdf2f8", aliases: ["7 sus4", "sus7"] },
  { id: "add9", label: "add2", shortLabel: "add2", description: "애드나인", color: "#3b82f6", darkColor: "#90CDF4", softColor: "#eff6ff", aliases: ["add9", "add 9", "add2", "add 2"] },
  { id: "min7flat5", label: "m7(b5)", shortLabel: "m7(b5)", description: "하프 디미니시드", color: "#a78b7c", darkColor: "#A0AEC0", softColor: "#faf7f5", aliases: ["m7-5", "m7b5", "half diminished"] },
  { id: "dim7", label: "diminish", shortLabel: "dim7", description: "디미니시드 세븐", color: "#64748b", darkColor: "#A0AEC0", softColor: "#f8fafc", aliases: ["dim", "dim7", "diminished", "디미니시"] },
  { id: "aug", label: "Augment", shortLabel: "aug", description: "어그먼트", color: "#ef4444", darkColor: "#F6AD55", softColor: "#fff0ef", aliases: ["aug", "augmented", "어그먼트"] },
  { id: "minor6", label: "minor 6", shortLabel: "m6", description: "마이너 식스", color: "#6f8cff", darkColor: "#A79BFF", softColor: "#f1f4ff", aliases: ["m6", "minor6", "마이너식스"] },
];

export const qualityById = chordQualities.reduce<Record<ChordQuality, ChordQualityInfo>>(
  (result, quality) => {
    result[quality.id] = quality;
    return result;
  },
  {} as Record<ChordQuality, ChordQualityInfo>,
);

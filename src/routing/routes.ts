import type { ChordQuality } from "../data/types";

export function chordPath(chordId: string, voicingIndex = 0): string {
  const query = voicingIndex > 0 ? `?v=${voicingIndex}` : "";
  return `/c/${encodeURIComponent(chordId)}${query}`;
}

export function qualityPath(quality: ChordQuality): string {
  return `/q/${quality}`;
}

export function lessonSetPath(setId: string): string {
  return `/sets/${encodeURIComponent(setId)}`;
}

export function lessonSetPlayPath(setId: string): string {
  return `${lessonSetPath(setId)}/play`;
}

export function lessonSetPrintPath(setId: string): string {
  return `${lessonSetPath(setId)}/print`;
}

export function readRouteSegment(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function readVoicingIndex(search: string, voicingCount: number): number {
  const rawValue = new URLSearchParams(search).get("v");
  if (!rawValue || !/^\d+$/.test(rawValue)) return 0;
  const value = Number(rawValue);
  return Number.isSafeInteger(value) && value < voicingCount ? value : 0;
}

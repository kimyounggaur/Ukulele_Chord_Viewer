import { useMemo } from "react";
import type { ChordQualityId, ChordShape } from "../data/chordTypes";
import { qualityById } from "../data/chordQualities";
import { normalizeSearchText } from "../lib/slug";

export function useChordSearch(
  chords: readonly ChordShape[],
  searchTerm: string,
  selectedQualityId: ChordQualityId | null,
): ChordShape[] {
  return useMemo(() => {
    const normalizedTerm = normalizeSearchText(searchTerm);

    return chords.filter((chord) => {
      const qualityMatches = selectedQualityId ? chord.quality === selectedQualityId : true;

      if (!qualityMatches) {
        return false;
      }

      if (!normalizedTerm) {
        return true;
      }

      const quality = qualityById[chord.quality];
      const searchable = [
        chord.title,
        chord.root,
        chord.quality,
        quality.label,
        quality.shortLabel,
        ...quality.aliases,
        ...(chord.tags ?? []),
      ]
        .map(normalizeSearchText)
        .join("|");

      return searchable.includes(normalizedTerm);
    });
  }, [chords, searchTerm, selectedQualityId]);
}

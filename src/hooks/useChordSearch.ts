import { useMemo } from "react";
import type { Chord, ChordQuality } from "../data/types";
import { searchChords } from "../search/searchChords";

export function useChordSearch(
  chords: readonly Chord[],
  searchTerm: string,
  selectedQualityId: ChordQuality | null,
): Chord[] {
  return useMemo(() => {
    const inQuality = selectedQualityId
      ? chords.filter((chord) => chord.quality === selectedQualityId)
      : chords;
    return searchChords(inQuality, searchTerm);
  }, [chords, searchTerm, selectedQualityId]);
}

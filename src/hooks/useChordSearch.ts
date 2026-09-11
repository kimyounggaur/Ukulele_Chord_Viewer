import { useMemo } from "react";
import type { Chord, ChordQuality } from "../data/types";
import { MAIN_QUALITY_IDS, qualityById } from "../data/chordQualities";
import { normalizeSearchText } from "../lib/slug";

const MAIN_QUALITY_SET = new Set<ChordQuality>(MAIN_QUALITY_IDS);
const ROOT_ONLY_PATTERN = /^[a-g](#|b)?$/;

function getCodeNameAliases(chord: Chord): string[] {
  const quality = qualityById[chord.quality];

  return [
    chord.displayName,
    chord.koreanName,
    `${chord.root}${quality.label}`,
    `${chord.root}${quality.shortLabel}`,
    ...quality.aliases.map((alias) => `${chord.root}${alias}`),
    chord.root,
  ].map(normalizeSearchText);
}

export function useChordSearch(
  chords: readonly Chord[],
  searchTerm: string,
  selectedQualityId: ChordQuality | null,
): Chord[] {
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

      const normalizedRoot = normalizeSearchText(chord.root);

      if (ROOT_ONLY_PATTERN.test(normalizedTerm)) {
        return normalizedRoot === normalizedTerm && MAIN_QUALITY_SET.has(chord.quality);
      }

      const codeNameMatches = getCodeNameAliases(chord).some((alias) =>
        alias.startsWith(normalizedTerm),
      );

      if (codeNameMatches) {
        return true;
      }

      const quality = qualityById[chord.quality];
      const searchable = [
        chord.displayName,
        chord.koreanName,
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

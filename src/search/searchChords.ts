import { qualityById } from "../data/chordQualities";
import type { Chord } from "../data/types";
import { normalizeChordSearchText } from "./normalize";

export const SEARCH_MATCH_RANK = {
  exact: 0,
  prefix: 1,
  contains: 2,
  none: Number.POSITIVE_INFINITY,
} as const;

export type SearchMatchRank = (typeof SEARCH_MATCH_RANK)[keyof typeof SEARCH_MATCH_RANK];

export function getChordSearchAliases(chord: Chord): string[] {
  const quality = qualityById[chord.quality];
  const aliases = [
    chord.id,
    chord.displayName,
    chord.koreanName,
    chord.root,
    chord.quality,
    quality.label,
    quality.shortLabel,
    quality.description,
    ...quality.aliases,
    `${chord.root}${quality.label}`,
    `${chord.root}${quality.shortLabel}`,
    `${chord.root}${quality.description}`,
    ...quality.aliases.map((alias) => `${chord.root}${alias}`),
    ...(chord.tags ?? []),
  ];

  return [...new Set(aliases.map(normalizeChordSearchText).filter(Boolean))];
}

export function rankChordSearchMatch(chord: Chord, normalizedQuery: string): SearchMatchRank {
  const aliases = getChordSearchAliases(chord);

  if (aliases.some((alias) => alias === normalizedQuery)) {
    return SEARCH_MATCH_RANK.exact;
  }

  if (aliases.some((alias) => alias.startsWith(normalizedQuery))) {
    return SEARCH_MATCH_RANK.prefix;
  }

  if (aliases.some((alias) => alias.includes(normalizedQuery))) {
    return SEARCH_MATCH_RANK.contains;
  }

  return SEARCH_MATCH_RANK.none;
}

/**
 * Finds chords using a forgiving query. Sorting is stable by construction:
 * only the match rank can move a result ahead of another one, and original
 * input order is used for all ties.
 */
export function searchChords(chords: readonly Chord[], query: string): Chord[] {
  const normalizedQuery = normalizeChordSearchText(query);

  if (!normalizedQuery) {
    return [...chords];
  }

  return chords
    .map((chord, index) => ({
      chord,
      index,
      rank: rankChordSearchMatch(chord, normalizedQuery),
    }))
    .filter(({ rank }) => rank !== SEARCH_MATCH_RANK.none)
    .sort((first, second) => first.rank - second.rank || first.index - second.index)
    .map(({ chord }) => chord);
}

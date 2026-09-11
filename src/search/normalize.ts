const ENHARMONIC_ROOTS: Readonly<Record<string, string>> = {
  "A#": "A#",
  Bb: "A#",
  B: "B",
  Cb: "B",
  "B#": "C",
  C: "C",
  "C#": "C#",
  Db: "C#",
  D: "D",
  "D#": "D#",
  Eb: "D#",
  E: "E",
  Fb: "E",
  "E#": "F",
  F: "F",
  "F#": "F#",
  Gb: "F#",
  G: "G",
  "G#": "G#",
  Ab: "G#",
  A: "A",
};

/**
 * Converts only a leading Latin note name to the sharp spelling used by the
 * chord data. The rest of the search text is intentionally left untouched.
 */
export function normalizeLeadingRoot(value: string): string {
  const match = /^([a-g])([#b]?)/.exec(value);

  if (!match) {
    return value;
  }

  const root = match[1].toUpperCase() + match[2];
  const normalizedRoot = ENHARMONIC_ROOTS[root] ?? root;
  return normalizedRoot.toLowerCase() + value.slice(match[0].length);
}

/**
 * Normalizes forgiving chord-search input while retaining the conventional
 * distinction between `M7` (major seven) and `m7` (minor seven).
 */
export function normalizeChordSearchText(value: string): string {
  const compact = value
    .normalize("NFKC")
    .trim()
    .replace(/[♯]/gu, "#")
    .replace(/[♭]/gu, "b")
    .replace(/\s+/gu, "")
    .replace(/(?:M7|△7|Δ7)/gu, "maj7")
    .replace(/메이저(?:세븐|7)/gu, "maj7")
    .toLowerCase()
    .replace(/major7/gu, "maj7");

  return normalizeLeadingRoot(compact);
}

// Short alias for consumers that are scoped to the search module.
export const normalizeSearchText = normalizeChordSearchText;

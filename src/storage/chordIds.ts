import { staticChords } from "../data/chords";

export const FAVORITES_STORAGE_KEY = "ukv.favorites";
export const RECENT_STORAGE_KEY = "ukv.recent";
export const MAX_RECENT_CHORDS = 12;

export interface ChordIdStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type ChordIdStorageAccessor = () => ChordIdStorage | null;

const currentIdByStoredId = new Map<string, string>();

for (const chord of staticChords) {
  currentIdByStoredId.set(chord.id, chord.id);
  if (chord.legacyId) currentIdByStoredId.set(chord.legacyId, chord.id);
}

/** Returns a registered current ID, migrating a legacy ID when necessary. */
export function toCurrentChordId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return currentIdByStoredId.get(value.trim()) ?? null;
}

/**
 * Canonicalizes IDs, removes unknown values and duplicates, and preserves the
 * first occurrence's order. A finite limit truncates the cleaned result.
 */
export function normalizeChordIds(value: unknown, limit = Number.POSITIVE_INFINITY): string[] {
  if (!Array.isArray(value)) return [];

  const normalizedLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : Number.POSITIVE_INFINITY;
  if (normalizedLimit === 0) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of value) {
    const chordId = toCurrentChordId(candidate);
    if (!chordId || seen.has(chordId)) continue;
    seen.add(chordId);
    result.push(chordId);
    if (result.length >= normalizedLimit) break;
  }

  return result;
}

/** Parses persisted JSON without allowing malformed data to escape. */
export function parseStoredChordIds(rawValue: string | null, limit = Number.POSITIVE_INFINITY): string[] {
  if (rawValue === null) return [];
  try {
    return normalizeChordIds(JSON.parse(rawValue), limit);
  } catch {
    return [];
  }
}

export function serializeChordIds(chordIds: readonly string[]): string {
  return JSON.stringify(normalizeChordIds(chordIds));
}

/** Pure favorite toggle used by the hook and storage tests. */
export function toggleFavoriteId(chordIds: readonly string[], chordId: string): string[] {
  const current = normalizeChordIds(chordIds);
  const canonicalId = toCurrentChordId(chordId);
  if (!canonicalId) return current;
  return current.includes(canonicalId)
    ? current.filter((candidate) => candidate !== canonicalId)
    : [...current, canonicalId];
}

/** Pure MRU update. The most recently viewed chord is always first. */
export function addRecentChordId(
  chordIds: readonly string[],
  chordId: string,
  limit = MAX_RECENT_CHORDS,
): string[] {
  const canonicalId = toCurrentChordId(chordId);
  const current = normalizeChordIds(chordIds);
  if (!canonicalId) return normalizeChordIds(current, limit);
  return normalizeChordIds([canonicalId, ...current.filter((candidate) => candidate !== canonicalId)], limit);
}

/**
 * Reads and repairs an ID list. The accessor itself is called inside the try
 * block because browsers may throw while evaluating `window.localStorage`.
 */
export function readStoredChordIds(
  getStorage: ChordIdStorageAccessor,
  key: string,
  fallback: readonly string[] = [],
  limit = Number.POSITIVE_INFINITY,
): string[] {
  const safeFallback = normalizeChordIds(fallback, limit);

  try {
    const storage = getStorage();
    if (!storage) return safeFallback;
    const rawValue = storage.getItem(key);
    if (rawValue === null) return safeFallback;

    const chordIds = parseStoredChordIds(rawValue, limit);
    const canonicalValue = JSON.stringify(chordIds);
    if (rawValue !== canonicalValue) {
      try {
        storage.setItem(key, canonicalValue);
      } catch {
        // The cleaned in-memory value remains usable when repair cannot persist.
      }
    }
    return chordIds;
  } catch {
    return safeFallback;
  }
}

/** Persists a canonical list and reports failure without throwing. */
export function writeStoredChordIds(
  getStorage: ChordIdStorageAccessor,
  key: string,
  chordIds: readonly string[],
  limit = Number.POSITIVE_INFINITY,
): boolean {
  const canonicalValue = JSON.stringify(normalizeChordIds(chordIds, limit));
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(key, canonicalValue);
    return true;
  } catch {
    return false;
  }
}

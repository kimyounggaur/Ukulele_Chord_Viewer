import { normalizeChordIds, toCurrentChordId } from "../storage/chordIds";
import type {
  LessonSet,
  LessonSetDraft,
  LessonSetIdentity,
  LessonSetMutationResult,
} from "./types";

export const LESSON_SETS_STORAGE_KEY = "ukv.sets";
export const MAX_LESSON_SET_TITLE_LENGTH = 80;
export const MAX_LESSON_SET_NOTE_LENGTH = 2_000;
export const DEFAULT_LESSON_SET_TITLE = "이름 없는 세트";

export interface LessonSetStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type LessonSetStorageAccessor = () => LessonSetStorage | null;

let fallbackIdSequence = 0;

export function truncateCodePoints(value: string, maximum: number): string {
  if (maximum <= 0) return "";
  return Array.from(value).slice(0, Math.floor(maximum)).join("");
}

function withoutUnsafeControls(value: string, preserveLineBreaks: boolean): string {
  const normalized = value.normalize("NFKC");
  if (preserveLineBreaks) {
    return normalized
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  }
  return normalized.replace(/[\u0000-\u001F\u007F]/g, " ");
}

export function normalizeLessonSetTitle(
  value: unknown,
  fallback = DEFAULT_LESSON_SET_TITLE,
): string {
  if (typeof value !== "string") return fallback;
  const normalized = withoutUnsafeControls(value, false).replace(/\s+/g, " ").trim();
  return truncateCodePoints(normalized, MAX_LESSON_SET_TITLE_LENGTH) || fallback;
}

export function normalizeLessonSetNote(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = withoutUnsafeControls(value, true).trim();
  const truncated = truncateCodePoints(normalized, MAX_LESSON_SET_NOTE_LENGTH);
  return truncated || undefined;
}

export function isValidLessonSetId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    value === value.trim() &&
    /^[A-Za-z0-9._:-]+$/.test(value)
  );
}

function normalizeCreatedAt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

/**
 * Uses Web Crypto when available and a timestamp/counter/random fallback in
 * older or privacy-restricted browsers. Callers may inject an ID in tests.
 */
export function createLessonSetId(): string {
  try {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // Some embedded browsers expose crypto but throw when it is accessed.
  }

  fallbackIdSequence = (fallbackIdSequence + 1) % Number.MAX_SAFE_INTEGER;
  const timePart = Date.now().toString(36);
  const sequencePart = fallbackIdSequence.toString(36);
  const randomPart = Math.random().toString(36).slice(2, 12) || "0";
  return `ls_${timePart}_${sequencePart}_${randomPart}`;
}

export function normalizeLessonSet(value: unknown): LessonSet | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (!isValidLessonSetId(candidate.id) || typeof candidate.title !== "string") return null;

  const createdAt = normalizeCreatedAt(candidate.createdAt);
  if (createdAt === null) return null;

  const lessonSet: LessonSet = {
    id: candidate.id,
    title: normalizeLessonSetTitle(candidate.title),
    chordIds: normalizeChordIds(candidate.chordIds),
    createdAt,
  };
  const note = normalizeLessonSetNote(candidate.note);
  if (note) lessonSet.note = note;
  return lessonSet;
}

/** Keeps the first occurrence of each set ID and preserves both set and chord order. */
export function normalizeLessonSets(value: unknown): LessonSet[] {
  if (!Array.isArray(value)) return [];
  const result: LessonSet[] = [];
  const seenIds = new Set<string>();

  for (const candidate of value) {
    const lessonSet = normalizeLessonSet(candidate);
    if (!lessonSet || seenIds.has(lessonSet.id)) continue;
    seenIds.add(lessonSet.id);
    result.push(lessonSet);
  }
  return result;
}

export function parseStoredLessonSets(rawValue: string | null): LessonSet[] {
  if (rawValue === null) return [];
  try {
    return normalizeLessonSets(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

export function serializeLessonSets(lessonSets: readonly LessonSet[]): string {
  return JSON.stringify(normalizeLessonSets(lessonSets));
}

/**
 * Reads and opportunistically repairs persisted data. Invoke this from an
 * effect (rather than a React state initializer) to avoid writes during render.
 */
export function readStoredLessonSets(
  getStorage: LessonSetStorageAccessor,
  fallback: readonly LessonSet[] = [],
): LessonSet[] {
  const safeFallback = normalizeLessonSets(fallback);
  try {
    const storage = getStorage();
    if (!storage) return safeFallback;
    const rawValue = storage.getItem(LESSON_SETS_STORAGE_KEY);
    if (rawValue === null) return safeFallback;

    const lessonSets = parseStoredLessonSets(rawValue);
    const canonicalValue = JSON.stringify(lessonSets);
    if (canonicalValue !== rawValue) {
      try {
        storage.setItem(LESSON_SETS_STORAGE_KEY, canonicalValue);
      } catch {
        // The repaired in-memory result is still useful when persistence fails.
      }
    }
    return lessonSets;
  } catch {
    return safeFallback;
  }
}

export function writeStoredLessonSets(
  getStorage: LessonSetStorageAccessor,
  lessonSets: readonly LessonSet[],
): boolean {
  const canonicalValue = serializeLessonSets(lessonSets);
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(LESSON_SETS_STORAGE_KEY, canonicalValue);
    return true;
  } catch {
    return false;
  }
}

function makeUniqueLessonSetId(lessonSets: readonly LessonSet[], requestedId?: string): string {
  const usedIds = new Set(lessonSets.map(({ id }) => id));
  if (isValidLessonSetId(requestedId) && !usedIds.has(requestedId)) return requestedId;

  let nextId = createLessonSetId();
  while (usedIds.has(nextId)) nextId = createLessonSetId();
  return nextId;
}

function makeLessonSet(
  lessonSets: readonly LessonSet[],
  draft: LessonSetDraft,
  identity: LessonSetIdentity = {},
): LessonSet {
  const createdAt = normalizeCreatedAt(identity.createdAt) ?? Date.now();
  const lessonSet: LessonSet = {
    id: makeUniqueLessonSetId(lessonSets, identity.id),
    title: normalizeLessonSetTitle(draft.title),
    chordIds: normalizeChordIds(draft.chordIds ?? []),
    createdAt,
  };
  const note = normalizeLessonSetNote(draft.note);
  if (note) lessonSet.note = note;
  return lessonSet;
}

/** Pure collection mutation when `identity` supplies deterministic ID/time values. */
export function createLessonSet(
  lessonSets: readonly LessonSet[],
  draft: LessonSetDraft,
  identity: LessonSetIdentity = {},
): LessonSetMutationResult {
  const current = normalizeLessonSets(lessonSets);
  const lessonSet = makeLessonSet(current, draft, identity);
  return { lessonSets: [...current, lessonSet], lessonSet };
}

function updateLessonSet(
  lessonSets: readonly LessonSet[],
  lessonSetId: string,
  update: (lessonSet: LessonSet) => LessonSet,
): LessonSet[] {
  return normalizeLessonSets(lessonSets).map((lessonSet) =>
    lessonSet.id === lessonSetId ? update(lessonSet) : lessonSet,
  );
}

export function renameLessonSet(
  lessonSets: readonly LessonSet[],
  lessonSetId: string,
  title: string,
): LessonSet[] {
  return updateLessonSet(lessonSets, lessonSetId, (lessonSet) => ({
    ...lessonSet,
    title: normalizeLessonSetTitle(title, lessonSet.title),
  }));
}

export function updateLessonSetNote(
  lessonSets: readonly LessonSet[],
  lessonSetId: string,
  note: string,
): LessonSet[] {
  return updateLessonSet(lessonSets, lessonSetId, (lessonSet) => {
    const normalizedNote = normalizeLessonSetNote(note);
    if (normalizedNote) return { ...lessonSet, note: normalizedNote };
    const { note: _removedNote, ...withoutNote } = lessonSet;
    return withoutNote;
  });
}

export function addChordToLessonSet(
  lessonSets: readonly LessonSet[],
  lessonSetId: string,
  chordId: string,
): LessonSet[] {
  const canonicalId = toCurrentChordId(chordId);
  if (!canonicalId) return normalizeLessonSets(lessonSets);
  return updateLessonSet(lessonSets, lessonSetId, (lessonSet) => ({
    ...lessonSet,
    chordIds: lessonSet.chordIds.includes(canonicalId)
      ? lessonSet.chordIds
      : [...lessonSet.chordIds, canonicalId],
  }));
}

export function removeChordFromLessonSet(
  lessonSets: readonly LessonSet[],
  lessonSetId: string,
  chordId: string,
): LessonSet[] {
  const canonicalId = toCurrentChordId(chordId);
  if (!canonicalId) return normalizeLessonSets(lessonSets);
  return updateLessonSet(lessonSets, lessonSetId, (lessonSet) => ({
    ...lessonSet,
    chordIds: lessonSet.chordIds.filter((candidate) => candidate !== canonicalId),
  }));
}

export function moveChordInLessonSet(
  lessonSets: readonly LessonSet[],
  lessonSetId: string,
  fromIndex: number,
  toIndex: number,
): LessonSet[] {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
    return normalizeLessonSets(lessonSets);
  }

  return updateLessonSet(lessonSets, lessonSetId, (lessonSet) => {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= lessonSet.chordIds.length ||
      toIndex >= lessonSet.chordIds.length ||
      fromIndex === toIndex
    ) {
      return lessonSet;
    }

    const chordIds = [...lessonSet.chordIds];
    const [movedChordId] = chordIds.splice(fromIndex, 1);
    chordIds.splice(toIndex, 0, movedChordId);
    return { ...lessonSet, chordIds };
  });
}

export function deleteLessonSet(
  lessonSets: readonly LessonSet[],
  lessonSetId: string,
): LessonSet[] {
  return normalizeLessonSets(lessonSets).filter(({ id }) => id !== lessonSetId);
}

/** Imported identity/timestamps are intentionally ignored; every import is a new local set. */
export function importLessonSet(
  lessonSets: readonly LessonSet[],
  imported: Pick<LessonSetDraft, "title" | "chordIds" | "note">,
  identity: LessonSetIdentity = {},
): LessonSetMutationResult {
  return createLessonSet(
    lessonSets,
    {
      title: imported.title,
      chordIds: imported.chordIds,
      note: imported.note,
    },
    identity,
  );
}

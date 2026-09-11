import { useCallback, useEffect, useState } from "react";
import {
  addChordToLessonSet as addChordToLessonSetCollection,
  createLessonSet as createLessonSetCollection,
  deleteLessonSet as deleteLessonSetCollection,
  importLessonSet as importLessonSetCollection,
  LESSON_SETS_STORAGE_KEY,
  moveChordInLessonSet as moveChordInLessonSetCollection,
  normalizeLessonSets,
  parseStoredLessonSets,
  readStoredLessonSets,
  removeChordFromLessonSet as removeChordFromLessonSetCollection,
  renameLessonSet as renameLessonSetCollection,
  updateLessonSetNote as updateLessonSetNoteCollection,
  writeStoredLessonSets,
} from "../lessonSets/storage";
import type { LessonSet, LessonSetDraft } from "../lessonSets/types";

type LessonSetsListener = (lessonSets: LessonSet[]) => void;

let lessonSetsInMemory: LessonSet[] = [];
let lessonSetsNeedPersistence = false;
const lessonSetsListeners = new Set<LessonSetsListener>();
let stopListeningForStorage: (() => void) | null = null;

function browserStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function publishLessonSets(nextLessonSets: readonly LessonSet[]) {
  lessonSetsInMemory = normalizeLessonSets(nextLessonSets);
  for (const listener of lessonSetsListeners) listener([...lessonSetsInMemory]);
}

function loadLessonSets() {
  if (lessonSetsNeedPersistence) {
    lessonSetsNeedPersistence = !writeStoredLessonSets(browserStorage, lessonSetsInMemory);
    return [...lessonSetsInMemory];
  }

  lessonSetsInMemory = readStoredLessonSets(browserStorage, lessonSetsInMemory);
  return [...lessonSetsInMemory];
}

function commitLessonSets(nextLessonSets: readonly LessonSet[]) {
  const next = normalizeLessonSets(nextLessonSets);
  lessonSetsNeedPersistence = !writeStoredLessonSets(browserStorage, next);
  publishLessonSets(next);
}

function startStorageListener() {
  if (stopListeningForStorage || typeof window === "undefined") return;

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== LESSON_SETS_STORAGE_KEY && event.key !== null) return;
    const next = event.key === null ? [] : parseStoredLessonSets(event.newValue);
    lessonSetsNeedPersistence = false;
    publishLessonSets(next);

    if (event.newValue !== null && event.newValue !== JSON.stringify(next)) {
      lessonSetsNeedPersistence = !writeStoredLessonSets(browserStorage, next);
    }
  };

  window.addEventListener("storage", handleStorage);
  stopListeningForStorage = () => {
    window.removeEventListener("storage", handleStorage);
    stopListeningForStorage = null;
  };
}

function subscribeToLessonSets(listener: LessonSetsListener) {
  lessonSetsListeners.add(listener);
  startStorageListener();
  listener(loadLessonSets());

  return () => {
    lessonSetsListeners.delete(listener);
    if (lessonSetsListeners.size === 0) stopListeningForStorage?.();
  };
}

export function useLessonSets() {
  const [lessonSets, setLessonSets] = useState<LessonSet[]>(loadLessonSets);

  useEffect(() => subscribeToLessonSets(setLessonSets), []);

  const createSet = useCallback((draft: LessonSetDraft) => {
    const result = createLessonSetCollection(lessonSetsInMemory, draft);
    commitLessonSets(result.lessonSets);
    return result.lessonSet;
  }, []);

  const renameSet = useCallback((lessonSetId: string, title: string) => {
    commitLessonSets(renameLessonSetCollection(lessonSetsInMemory, lessonSetId, title));
  }, []);

  const updateSetNote = useCallback((lessonSetId: string, note: string) => {
    commitLessonSets(updateLessonSetNoteCollection(lessonSetsInMemory, lessonSetId, note));
  }, []);

  const addChordToSet = useCallback((lessonSetId: string, chordId: string) => {
    commitLessonSets(addChordToLessonSetCollection(lessonSetsInMemory, lessonSetId, chordId));
  }, []);

  const removeChordFromSet = useCallback((lessonSetId: string, chordId: string) => {
    commitLessonSets(removeChordFromLessonSetCollection(lessonSetsInMemory, lessonSetId, chordId));
  }, []);

  const moveChordInSet = useCallback((lessonSetId: string, fromIndex: number, toIndex: number) => {
    commitLessonSets(
      moveChordInLessonSetCollection(lessonSetsInMemory, lessonSetId, fromIndex, toIndex),
    );
  }, []);

  const deleteSet = useCallback((lessonSetId: string) => {
    commitLessonSets(deleteLessonSetCollection(lessonSetsInMemory, lessonSetId));
  }, []);

  const importSet = useCallback((imported: Pick<LessonSetDraft, "title" | "chordIds" | "note">) => {
    const result = importLessonSetCollection(lessonSetsInMemory, imported);
    commitLessonSets(result.lessonSets);
    return result.lessonSet;
  }, []);

  return {
    lessonSets,
    createSet,
    renameSet,
    updateSetNote,
    addChordToSet,
    removeChordFromSet,
    moveChordInSet,
    deleteSet,
    importSet,
  };
}

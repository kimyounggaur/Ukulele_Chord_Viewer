import { useCallback, useEffect, useState } from "react";
import {
  MAX_RECENT_CHORDS,
  RECENT_STORAGE_KEY,
  addRecentChordId,
  normalizeChordIds,
  parseStoredChordIds,
  readStoredChordIds,
  toCurrentChordId,
  writeStoredChordIds,
} from "../storage/chordIds";

type RecentChordsListener = (recentChordIds: string[]) => void;

let recentChordIdsInMemory: string[] = [];
let recentChordsNeedPersistence = false;
const recentChordsListeners = new Set<RecentChordsListener>();
let stopListeningForStorage: (() => void) | null = null;

function browserStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function publishRecentChords(nextRecentChordIds: readonly string[]) {
  recentChordIdsInMemory = normalizeChordIds(nextRecentChordIds, MAX_RECENT_CHORDS);
  for (const listener of recentChordsListeners) listener([...recentChordIdsInMemory]);
}

function loadRecentChords() {
  if (recentChordsNeedPersistence) {
    recentChordsNeedPersistence = !writeStoredChordIds(
      browserStorage,
      RECENT_STORAGE_KEY,
      recentChordIdsInMemory,
      MAX_RECENT_CHORDS,
    );
    return [...recentChordIdsInMemory];
  }

  recentChordIdsInMemory = readStoredChordIds(
    browserStorage,
    RECENT_STORAGE_KEY,
    recentChordIdsInMemory,
    MAX_RECENT_CHORDS,
  );
  return [...recentChordIdsInMemory];
}

function commitRecentChords(nextRecentChordIds: readonly string[]) {
  const next = normalizeChordIds(nextRecentChordIds, MAX_RECENT_CHORDS);
  recentChordsNeedPersistence = !writeStoredChordIds(
    browserStorage,
    RECENT_STORAGE_KEY,
    next,
    MAX_RECENT_CHORDS,
  );
  publishRecentChords(next);
}

function startStorageListener() {
  if (stopListeningForStorage || typeof window === "undefined") return;

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== RECENT_STORAGE_KEY && event.key !== null) return;
    const next = event.key === null ? [] : parseStoredChordIds(event.newValue, MAX_RECENT_CHORDS);
    recentChordsNeedPersistence = false;
    publishRecentChords(next);

    if (event.newValue !== null && event.newValue !== JSON.stringify(next)) {
      recentChordsNeedPersistence = !writeStoredChordIds(
        browserStorage,
        RECENT_STORAGE_KEY,
        next,
        MAX_RECENT_CHORDS,
      );
    }
  };

  window.addEventListener("storage", handleStorage);
  stopListeningForStorage = () => {
    window.removeEventListener("storage", handleStorage);
    stopListeningForStorage = null;
  };
}

function subscribeToRecentChords(listener: RecentChordsListener) {
  recentChordsListeners.add(listener);
  startStorageListener();
  listener(loadRecentChords());

  return () => {
    recentChordsListeners.delete(listener);
    if (recentChordsListeners.size === 0) stopListeningForStorage?.();
  };
}

export function useRecentChords() {
  const [recentChordIds, setRecentChordIds] = useState<string[]>(loadRecentChords);

  useEffect(() => subscribeToRecentChords(setRecentChordIds), []);

  const addRecentChord = useCallback((chordId: string) => {
    if (!toCurrentChordId(chordId)) return false;
    commitRecentChords(addRecentChordId(recentChordIdsInMemory, chordId));
    return true;
  }, []);

  const clearRecentChords = useCallback(() => commitRecentChords([]), []);

  return { recentChordIds, addRecentChord, clearRecentChords };
}

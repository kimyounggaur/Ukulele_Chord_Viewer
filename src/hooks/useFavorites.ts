import { useCallback, useEffect, useState } from "react";
import {
  FAVORITES_STORAGE_KEY,
  normalizeChordIds,
  parseStoredChordIds,
  readStoredChordIds,
  toCurrentChordId,
  toggleFavoriteId,
  writeStoredChordIds,
} from "../storage/chordIds";

type FavoritesListener = (favoriteIds: string[]) => void;

let favoriteIdsInMemory: string[] = [];
let favoritesNeedPersistence = false;
const favoritesListeners = new Set<FavoritesListener>();
let stopListeningForStorage: (() => void) | null = null;

function browserStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function publishFavorites(nextFavoriteIds: readonly string[]) {
  favoriteIdsInMemory = normalizeChordIds(nextFavoriteIds);
  for (const listener of favoritesListeners) listener([...favoriteIdsInMemory]);
}

function loadFavorites() {
  if (favoritesNeedPersistence) {
    favoritesNeedPersistence = !writeStoredChordIds(
      browserStorage,
      FAVORITES_STORAGE_KEY,
      favoriteIdsInMemory,
    );
    return [...favoriteIdsInMemory];
  }

  favoriteIdsInMemory = readStoredChordIds(
    browserStorage,
    FAVORITES_STORAGE_KEY,
    favoriteIdsInMemory,
  );
  return [...favoriteIdsInMemory];
}

function commitFavorites(nextFavoriteIds: readonly string[]) {
  const next = normalizeChordIds(nextFavoriteIds);
  favoritesNeedPersistence = !writeStoredChordIds(browserStorage, FAVORITES_STORAGE_KEY, next);
  publishFavorites(next);
}

function startStorageListener() {
  if (stopListeningForStorage || typeof window === "undefined") return;

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== FAVORITES_STORAGE_KEY && event.key !== null) return;
    const next = event.key === null ? [] : parseStoredChordIds(event.newValue);
    favoritesNeedPersistence = false;
    publishFavorites(next);

    if (event.newValue !== null && event.newValue !== JSON.stringify(next)) {
      favoritesNeedPersistence = !writeStoredChordIds(browserStorage, FAVORITES_STORAGE_KEY, next);
    }
  };

  window.addEventListener("storage", handleStorage);
  stopListeningForStorage = () => {
    window.removeEventListener("storage", handleStorage);
    stopListeningForStorage = null;
  };
}

function subscribeToFavorites(listener: FavoritesListener) {
  favoritesListeners.add(listener);
  startStorageListener();
  listener(loadFavorites());

  return () => {
    favoritesListeners.delete(listener);
    if (favoritesListeners.size === 0) stopListeningForStorage?.();
  };
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(loadFavorites);

  useEffect(() => subscribeToFavorites(setFavoriteIds), []);

  const isFavorite = useCallback(
    (chordId: string) => {
      const canonicalId = toCurrentChordId(chordId);
      return canonicalId ? favoriteIds.includes(canonicalId) : false;
    },
    [favoriteIds],
  );

  const toggleFavorite = useCallback((chordId: string) => {
    const canonicalId = toCurrentChordId(chordId);
    if (!canonicalId) return false;
    const next = toggleFavoriteId(favoriteIdsInMemory, canonicalId);
    commitFavorites(next);
    return next.includes(canonicalId);
  }, []);

  return { favoriteIds, isFavorite, toggleFavorite };
}

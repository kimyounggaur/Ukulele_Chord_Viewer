import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

export interface RouteScrollSnapshot {
  scrollTop: number;
  selectedCardId: string | null;
  restoreVersion: number;
}

export interface UseRouteScrollMemoryOptions {
  locationKey: string;
  visitToken: object;
  onRestoreSelectedCard?: (cardId: string | null) => void;
}

export interface RouteScrollMemory<T extends HTMLElement> {
  scrollContainerRef: RefObject<T>;
  hasSnapshot: boolean;
  restoredSelectedCardId: string | null;
  rememberSelectedCard: (cardId: string | null) => void;
  saveScrollPosition: () => void;
}

const scrollMemory = new Map<string, RouteScrollSnapshot>();
let restoredVersions = new WeakMap<object, number>();

export function clearRouteScrollMemory(locationKey?: string) {
  if (locationKey !== undefined) {
    scrollMemory.delete(locationKey);
    return;
  }

  scrollMemory.clear();
  restoredVersions = new WeakMap<object, number>();
}

/**
 * Stores the scrollTop of the app's real inner scroller per history entry.
 * Call rememberSelectedCard before navigating to associate focus restoration
 * with the same entry; onRestoreSelectedCard receives it after scrolling back.
 */
export function useRouteScrollMemory<T extends HTMLElement = HTMLDivElement>({
  locationKey,
  visitToken,
  onRestoreSelectedCard,
}: UseRouteScrollMemoryOptions): RouteScrollMemory<T> {
  const scrollContainerRef = useRef<T>(null);
  const selectedCardIdRef = useRef<string | null>(null);
  const restoreCallbackRef = useRef(onRestoreSelectedCard);
  const snapshotForRestore = scrollMemory.get(locationKey);
  const restoredVersion = restoredVersions.get(visitToken) ?? 0;
  const shouldRestore = Boolean(
    snapshotForRestore
    && snapshotForRestore.restoreVersion > restoredVersion,
  );
  const restoredSelectedCardId = shouldRestore ? snapshotForRestore?.selectedCardId ?? null : null;

  restoreCallbackRef.current = onRestoreSelectedCard;

  const saveScrollPosition = useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    scrollMemory.set(locationKey, {
      scrollTop: element.scrollTop,
      selectedCardId: selectedCardIdRef.current,
      restoreVersion: scrollMemory.get(locationKey)?.restoreVersion ?? 0,
    });
  }, [locationKey]);

  const rememberSelectedCard = useCallback((cardId: string | null) => {
    selectedCardIdRef.current = cardId;
    const element = scrollContainerRef.current;
    const previous = scrollMemory.get(locationKey);

    scrollMemory.set(locationKey, {
      scrollTop: element?.scrollTop ?? previous?.scrollTop ?? 0,
      selectedCardId: cardId,
      restoreVersion: (previous?.restoreVersion ?? 0) + 1,
    });
  }, [locationKey]);

  useLayoutEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return undefined;

    const snapshot = scrollMemory.get(locationKey);
    const restoredForVisit = restoredVersions.get(visitToken) ?? 0;
    const pendingRestore = Boolean(
      snapshot
      && snapshot.restoreVersion > restoredForVisit,
    );
    selectedCardIdRef.current = snapshot?.selectedCardId ?? null;
    let readyToSave = false;
    const frame = window.requestAnimationFrame(() => {
      if (pendingRestore && snapshot) {
        element.scrollTop = snapshot.scrollTop;
        restoredVersions.set(visitToken, snapshot.restoreVersion);
        restoreCallbackRef.current?.(snapshot.selectedCardId);
      }

      readyToSave = true;
    });
    const handleScroll = () => {
      readyToSave = true;
      scrollMemory.set(locationKey, {
        scrollTop: element.scrollTop,
        selectedCardId: selectedCardIdRef.current,
        restoreVersion: scrollMemory.get(locationKey)?.restoreVersion ?? 0,
      });
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      element.removeEventListener("scroll", handleScroll);

      // Strict Mode tears down the first effect before its restore frame runs;
      // skip that cleanup so a temporary position cannot replace saved state.
      if (readyToSave) {
        scrollMemory.set(locationKey, {
          scrollTop: element.scrollTop,
          selectedCardId: selectedCardIdRef.current,
          restoreVersion: scrollMemory.get(locationKey)?.restoreVersion ?? 0,
        });
      }
    };
  }, [locationKey, visitToken]);

  return {
    scrollContainerRef,
    hasSnapshot: Boolean(snapshotForRestore),
    restoredSelectedCardId,
    rememberSelectedCard,
    saveScrollPosition,
  };
}

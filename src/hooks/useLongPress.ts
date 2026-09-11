import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

interface LongPressOptions<T extends HTMLElement> {
  onLongPress?: (target: T) => void;
  delayMs?: number;
  movementThreshold?: number;
}

export function useLongPress<T extends HTMLElement>({
  onLongPress,
  delayMs = 600,
  movementThreshold = 10,
}: LongPressOptions<T>) {
  const timerRef = useRef<number | null>(null);
  const suppressionResetTimerRef = useRef<number | null>(null);
  const startRef = useRef({ x: 0, y: 0, pointerId: -1 });
  const suppressNextClickRef = useRef(false);
  const callbackRef = useRef(onLongPress);
  callbackRef.current = onLongPress;

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetSuppressionAfterClick = useCallback(() => {
    if (suppressionResetTimerRef.current !== null) {
      window.clearTimeout(suppressionResetTimerRef.current);
    }
    suppressionResetTimerRef.current = window.setTimeout(() => {
      suppressNextClickRef.current = false;
      suppressionResetTimerRef.current = null;
    }, 0);
  }, []);

  useEffect(() => {
    const handleDocumentPointerEnd = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== startRef.current.pointerId) return;
      cancelTimer();
      startRef.current.pointerId = -1;
      resetSuppressionAfterClick();
    };
    document.addEventListener("pointerup", handleDocumentPointerEnd, true);
    document.addEventListener("pointercancel", handleDocumentPointerEnd, true);
    return () => {
      cancelTimer();
      if (suppressionResetTimerRef.current !== null) {
        window.clearTimeout(suppressionResetTimerRef.current);
      }
      document.removeEventListener("pointerup", handleDocumentPointerEnd, true);
      document.removeEventListener("pointercancel", handleDocumentPointerEnd, true);
    };
  }, [cancelTimer, resetSuppressionAfterClick]);

  const onPointerDown = useCallback((event: PointerEvent<T>) => {
    if (!callbackRef.current || !event.isPrimary || event.button !== 0) return;
    cancelTimer();
    suppressNextClickRef.current = false;
    startRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    const target = event.currentTarget;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      suppressNextClickRef.current = true;
      callbackRef.current?.(target);
    }, delayMs);
  }, [cancelTimer, delayMs]);

  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    if (startRef.current.pointerId !== event.pointerId) return;
    const moved = Math.hypot(
      event.clientX - startRef.current.x,
      event.clientY - startRef.current.y,
    );
    if (moved > movementThreshold) cancelTimer();
  }, [cancelTimer, movementThreshold]);

  const onPointerEnd = useCallback((event: PointerEvent<T>) => {
    if (startRef.current.pointerId !== event.pointerId) return;
    cancelTimer();
    resetSuppressionAfterClick();
  }, [cancelTimer, resetSuppressionAfterClick]);

  const consumeSuppressedClick = useCallback((event: MouseEvent<T>) => {
    if (!suppressNextClickRef.current) return false;
    suppressNextClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }, []);

  return {
    longPressHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
    consumeSuppressedClick,
  };
}

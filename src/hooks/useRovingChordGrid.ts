import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export interface GridFocusRequest {
  id: string;
  nonce: number | string;
}

export function useRovingChordGrid(
  chordIds: readonly string[],
  columns: number,
  focusRequest?: GridFocusRequest | null,
  onFocusRequestHandled?: (request: GridFocusRequest) => void,
) {
  const [activeId, setActiveId] = useState<string | null>(chordIds[0] ?? null);
  const buttonsRef = useRef(new Map<string, HTMLButtonElement>());
  const handledFocusRequestRef = useRef<string | null>(null);
  const handledCallbackRef = useRef(onFocusRequestHandled);
  handledCallbackRef.current = onFocusRequestHandled;

  useEffect(() => {
    if (!activeId || !chordIds.includes(activeId)) setActiveId(chordIds[0] ?? null);
  }, [activeId, chordIds]);

  const focusChord = useCallback((id: string) => {
    setActiveId(id);
    const button = buttonsRef.current.get(id);
    button?.focus();
    button?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, []);

  useLayoutEffect(() => {
    if (!focusRequest || !chordIds.includes(focusRequest.id)) return undefined;
    const requestKey = `${focusRequest.id}:${focusRequest.nonce}`;
    if (handledFocusRequestRef.current === requestKey) return undefined;
    setActiveId(focusRequest.id);
    const frame = window.requestAnimationFrame(() => {
      if (handledFocusRequestRef.current === requestKey) return;
      handledFocusRequestRef.current = requestKey;
      focusChord(focusRequest.id);
      handledCallbackRef.current?.(focusRequest);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [chordIds, focusChord, focusRequest]);

  const registerButton = useCallback((id: string, button: HTMLButtonElement | null) => {
    if (button) buttonsRef.current.set(id, button);
    else buttonsRef.current.delete(id);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const index = chordIds.indexOf(id);
    if (index < 0) return;
    const rowStart = Math.floor(index / columns) * columns;
    const rowEnd = Math.min(rowStart + columns - 1, chordIds.length - 1);
    let target = index;

    switch (event.key) {
      case "ArrowLeft":
        if (index > rowStart) target = index - 1;
        break;
      case "ArrowRight":
        if (index < rowEnd) target = index + 1;
        break;
      case "ArrowUp":
        if (index - columns >= 0) target = index - columns;
        break;
      case "ArrowDown":
        if (index + columns < chordIds.length) target = index + columns;
        break;
      case "Home":
        target = event.ctrlKey ? 0 : rowStart;
        break;
      case "End":
        target = event.ctrlKey ? chordIds.length - 1 : rowEnd;
        break;
      default:
        return;
    }

    event.preventDefault();
    if (target !== index) focusChord(chordIds[target]);
  }, [chordIds, columns, focusChord]);

  return { activeId, setActiveId, registerButton, handleKeyDown };
}

import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";

const AudioSettingsPanel = lazy(() => import("./AudioSettingsPanel").then(
  ({ AudioSettingsPanel: component }) => ({ default: component }),
));

interface AudioSettingsControlProps {
  initiallyOpen?: boolean;
  highContrast: boolean;
  onToggleContrast: () => void;
}

export function AudioSettingsControl({
  initiallyOpen = false,
  highContrast,
  onToggleContrast,
}: AudioSettingsControlProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (initiallyOpen) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [initiallyOpen]);

  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeAndRestoreFocus();
      }
    };
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (panelRef.current && event.target instanceof Node && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closeAndRestoreFocus, open]);

  return (
    <div className="audio-settings" ref={panelRef}>
      <button
        ref={triggerRef}
        type="button"
        data-chord-audio="true"
        className="audio-settings-trigger"
        aria-label="앱 설정"
        aria-expanded={open}
        aria-controls="audio-settings-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <Settings2 size={18} aria-hidden="true" />
      </button>
      {open ? (
        <Suspense
          fallback={(
            <div id="audio-settings-panel" className="audio-settings-panel" role="status" aria-live="polite">
              설정을 불러오는 중입니다.
            </div>
          )}
        >
          <AudioSettingsPanel
            highContrast={highContrast}
            onToggleContrast={onToggleContrast}
            onClose={closeAndRestoreFocus}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

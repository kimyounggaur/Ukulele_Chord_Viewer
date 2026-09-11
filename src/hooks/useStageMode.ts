import { useCallback, useEffect, useRef, useState } from "react";

export function useStageMode() {
  const [stageMode, setStageMode] = useState(false);
  const enteredNativeFullscreen = useRef(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        enteredNativeFullscreen.current = true;
        setStageMode(true);
      } else if (enteredNativeFullscreen.current) {
        enteredNativeFullscreen.current = false;
        setStageMode(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!stageMode) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("#audio-settings-panel, [aria-modal='true']")) return;
      setStageMode(false);
      enteredNativeFullscreen.current = false;
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stageMode]);

  const toggleStageMode = useCallback(async () => {
    if (stageMode) {
      setStageMode(false);
      enteredNativeFullscreen.current = false;
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => undefined);
      }
      return;
    }

    // The teaching layout is useful even when the embedding browser denies Fullscreen API access.
    setStageMode(true);
    const root = document.getElementById("app-root");
    if (!root?.requestFullscreen) return;
    try {
      await root.requestFullscreen();
      enteredNativeFullscreen.current = true;
    } catch {
      enteredNativeFullscreen.current = false;
    }
  }, [stageMode]);

  return { stageMode, toggleStageMode };
}

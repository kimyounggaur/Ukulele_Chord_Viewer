import { useCallback, useEffect, useState } from "react";

type ContrastPreference = "system" | "default" | "high";
const STORAGE_KEY = "ukv.contrast";

function loadPreference(): ContrastPreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "high" || stored === "default" ? stored : "system";
  } catch {
    return "system";
  }
}

function systemPrefersHighContrast() {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-contrast: more)").matches;
}

export function useContrastMode() {
  const [preference, setPreference] = useState<ContrastPreference>(loadPreference);
  const [systemHigh, setSystemHigh] = useState(systemPrefersHighContrast);
  const highContrast = preference === "high" || (preference === "system" && systemHigh);

  useEffect(() => {
    const media = matchMedia("(prefers-contrast: more)");
    const update = () => setSystemHigh(media.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    document.body.dataset.contrast = highContrast ? "high" : "default";
  }, [highContrast]);

  const toggleContrast = useCallback(() => {
    setPreference((current) => {
      const isCurrentlyHigh = current === "high" || (current === "system" && systemPrefersHighContrast());
      const next = isCurrentlyHigh ? "default" : "high";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Keep the preference in memory when storage is unavailable.
      }
      return next;
    });
  }, []);

  return { highContrast, toggleContrast };
}

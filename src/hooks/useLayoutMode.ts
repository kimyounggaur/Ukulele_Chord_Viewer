import { useEffect, useState } from "react";

export type LayoutMode = "phone-portrait" | "phone-landscape" | "tablet" | "desktop" | "stage";

export const LAYOUT_COLUMNS: Record<LayoutMode, number> = {
  "phone-portrait": 3,
  "phone-landscape": 6,
  tablet: 5,
  desktop: 6,
  stage: 4,
};

export function classifyLayoutMode(width: number, height: number, stage = false): LayoutMode {
  if (stage) return "stage";
  if (Math.min(width, height) < 600) {
    return width > height ? "phone-landscape" : "phone-portrait";
  }
  return width < 1200 ? "tablet" : "desktop";
}

function readViewport(stage: boolean): LayoutMode {
  if (typeof window === "undefined") return stage ? "stage" : "desktop";
  return classifyLayoutMode(window.innerWidth, window.innerHeight, stage);
}

export function useLayoutMode(stage = false): LayoutMode {
  const [mode, setMode] = useState(() => readViewport(stage));

  useEffect(() => {
    const update = () => setMode(readViewport(stage));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(update);
    observer?.observe(document.documentElement);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      observer?.disconnect();
    };
  }, [stage]);

  return mode;
}

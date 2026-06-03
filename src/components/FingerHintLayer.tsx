import type { CSSProperties } from "react";
import { FINGER_NAMES, type FingerHotspot } from "../data/fingerHotspots";

interface FingerHintLayerProps {
  hotspots: readonly FingerHotspot[];
  size?: "thumb" | "large";
}

export function FingerHintLayer({ hotspots, size = "thumb" }: FingerHintLayerProps) {
  if (hotspots.length === 0) {
    return null;
  }

  return (
    <div className="finger-hint-layer" aria-hidden="true">
      {hotspots.map((hotspot, index) => {
        const fingerName = FINGER_NAMES[hotspot.finger];
        const placementClass = hotspot.y > 68 ? "is-low" : "";
        const edgeClass =
          hotspot.x < 13 ? "is-left-edge" : hotspot.x > 87 ? "is-right-edge" : "";

        return (
          <span
            key={`${hotspot.finger}-${index}-${hotspot.x}-${hotspot.y}`}
            className={[
              "finger-hotspot",
              size === "large" ? "is-large" : "",
              placementClass,
              edgeClass,
            ].join(" ")}
            style={
              {
                "--finger-x": `${hotspot.x}%`,
                "--finger-y": `${hotspot.y}%`,
                "--finger-w": `${hotspot.width}%`,
                "--finger-h": `${hotspot.height}%`,
              } as CSSProperties
            }
          >
            <span className="finger-tooltip">{fingerName}</span>
          </span>
        );
      })}
    </div>
  );
}

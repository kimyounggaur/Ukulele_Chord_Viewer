import { useEffect, useMemo, useState } from "react";
import type { Chord } from "../data/types";
import { fingerHotspotsByChordId } from "../data/fingerHotspots";
import { asset } from "../lib/asset";
import { ChordImage } from "./ChordImage";
import { ChordSvg } from "./ChordSvg";
import { FingerHintLayer } from "./FingerHintLayer";

export interface ChordDiagramProps {
  chord: Chord;
  voicingIndex?: number;
  size?: "sm" | "md" | "lg";
  forcePrimitive?: boolean;
  uploadedImageUrl?: string;
  showNotes?: boolean;
  priority?: boolean;
}

function queryForcesSvg(): boolean {
  if (typeof window === "undefined") return false;
  const documentQuery = new URLSearchParams(window.location.search);
  const hashQuery = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
  return documentQuery.get("render") === "svg" || hashQuery.get("render") === "svg";
}

export function ChordDiagram({
  chord,
  voicingIndex = 0,
  size = "sm",
  forcePrimitive = false,
  uploadedImageUrl,
  showNotes = true,
  priority = false,
}: ChordDiagramProps) {
  const voicing = chord.voicings[voicingIndex] ?? chord.voicings[0];
  const sources = useMemo(
    () =>
      [uploadedImageUrl, chord.imageFile ? asset(chord.imageFile) : undefined].filter(
        (source, index, all): source is string =>
          Boolean(source) && all.indexOf(source) === index,
      ),
    [chord.imageFile, uploadedImageUrl],
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const useSvg = forcePrimitive || queryForcesSvg() || sourceIndex >= sources.length;
  const fingerHotspots = fingerHotspotsByChordId[chord.legacyId ?? chord.id] ?? [];

  useEffect(() => {
    setSourceIndex(0);
  }, [chord.id, uploadedImageUrl]);

  return (
    <div className={"chord-diagram chord-diagram-" + size} data-renderer={useSvg ? "svg" : "image"}>
      {useSvg ? (
        <ChordSvg
          chord={chord}
          voicing={voicing}
          showNotes={showNotes}
          className="chord-svg"
        />
      ) : (
        <ChordImage
          src={sources[sourceIndex]}
          alt={chord.displayName + " 우쿨렐레 코드 다이어그램"}
          size={size === "lg" ? "large" : "thumb"}
          priority={priority}
          onError={() => setSourceIndex((current) => current + 1)}
          overlay={<FingerHintLayer hotspots={fingerHotspots} size={size === "lg" ? "large" : "thumb"} />}
        />
      )}
    </div>
  );
}

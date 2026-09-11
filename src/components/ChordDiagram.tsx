import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Chord } from "../data/types";
import { fingerHotspotsByChordId } from "../data/fingerHotspots";
import { asset } from "../lib/asset";
import { ChordImage } from "./ChordImage";
import { ChordSvg } from "./ChordSvg";
import { FingerHintLayer } from "./FingerHintLayer";
import { useChordAudio } from "../audio/ChordAudioProvider";
import { describeVoicing } from "../a11y/describeVoicing";
import chordImageDimensions from "../data/chordImageDimensions.json";

export interface ChordDiagramProps {
  chord: Chord;
  voicingIndex?: number;
  size?: "sm" | "md" | "lg";
  forcePrimitive?: boolean;
  uploadedImageUrl?: string;
  showNotes?: boolean;
  priority?: boolean;
  ariaHidden?: boolean;
}

function queryForcesSvg(): boolean {
  if (typeof window === "undefined") return false;
  const documentQuery = new URLSearchParams(window.location.search);
  const hashQuery = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
  return documentQuery.get("render") === "svg" || hashQuery.get("render") === "svg";
}

interface DiagramImageSource {
  src: string;
  webpSrc?: string;
  width: number;
  height: number;
}

interface ChordImageDimensions {
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

const dimensionsByImage = chordImageDimensions as Record<string, ChordImageDimensions>;

function replaceImageExtension(imageFile: string, suffix: string) {
  return imageFile.replace(/\.[^.]+$/, suffix);
}

export function ChordDiagram({
  chord,
  voicingIndex = 0,
  size = "sm",
  forcePrimitive = false,
  uploadedImageUrl,
  showNotes = true,
  priority = false,
  ariaHidden = false,
}: ChordDiagramProps) {
  const voicing = chord.voicings[voicingIndex] ?? chord.voicings[0];
  const sources = useMemo<DiagramImageSource[]>(() => {
    const nextSources: DiagramImageSource[] = [];
    if (uploadedImageUrl) {
      nextSources.push({ src: uploadedImageUrl, width: 800, height: 600 });
    }

    if (chord.imageFile) {
      const dimensions = dimensionsByImage[chord.imageFile];
      const useDetail = size === "lg";
      nextSources.push({
        src: asset(chord.imageFile),
        webpSrc: asset(
          replaceImageExtension(chord.imageFile, useDetail ? ".webp" : ".thumb.webp"),
        ),
        width: useDetail ? dimensions?.width ?? 720 : dimensions?.thumbnailWidth ?? 240,
        height: useDetail ? dimensions?.height ?? 540 : dimensions?.thumbnailHeight ?? 180,
      });
    }

    return nextSources;
  }, [chord.imageFile, size, uploadedImageUrl]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [fingerHintsReady, setFingerHintsReady] = useState(size === "lg");
  const useSvg = forcePrimitive || queryForcesSvg() || sourceIndex >= sources.length;
  const fingerHotspots = fingerHotspotsByChordId[chord.legacyId ?? chord.id] ?? [];
  const { playingChordId, activeStrings } = useChordAudio();
  const isPlaying = playingChordId === chord.id;
  const accessibleDescription = describeVoicing(chord, voicing);

  useEffect(() => {
    setSourceIndex(0);
  }, [chord.id, size, uploadedImageUrl]);

  useEffect(() => {
    if (size === "lg") {
      setFingerHintsReady(true);
      return undefined;
    }

    const timer = window.setTimeout(() => setFingerHintsReady(true), 400);
    return () => window.clearTimeout(timer);
  }, [size]);

  return (
    <div
      className={"chord-diagram chord-diagram-" + size}
      data-renderer={useSvg ? "svg" : "image"}
      aria-hidden={ariaHidden || undefined}
      onPointerEnter={() => setFingerHintsReady(true)}
    >
      {useSvg ? (
        <ChordSvg
          chord={chord}
          voicing={voicing}
          showNotes={showNotes}
          className="chord-svg"
        />
      ) : (
        <ChordImage
          src={sources[sourceIndex].src}
          webpSrc={sources[sourceIndex].webpSrc}
          alt={accessibleDescription}
          width={sources[sourceIndex].width}
          height={sources[sourceIndex].height}
          size={size === "lg" ? "large" : "thumb"}
          priority={priority}
          onError={() => setSourceIndex((current) => current + 1)}
          overlay={fingerHintsReady && fingerHotspots.length > 0
            ? <FingerHintLayer hotspots={fingerHotspots} size={size === "lg" ? "large" : "thumb"} />
            : undefined}
        />
      )}
      {isPlaying ? (
        <div className="chord-string-feedback" aria-hidden="true">
          {[0, 1, 2, 3].map((stringIndex) => (
            <span
              key={stringIndex}
              className={activeStrings.includes(stringIndex) ? "is-active" : ""}
              style={{ "--string-index": stringIndex } as CSSProperties}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

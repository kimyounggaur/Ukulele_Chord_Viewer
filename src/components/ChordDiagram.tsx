import type { Chord } from "../data/types";
import { fingerHotspotsByChordId } from "../data/fingerHotspots";
import { ChordImage } from "./ChordImage";
import { FingerHintLayer } from "./FingerHintLayer";
import { Fretboard } from "./Fretboard";

interface ChordDiagramProps {
  shape: Chord;
  size?: "thumb" | "large";
  uploadedImageUrl?: string;
}

export function ChordDiagram({ shape, size = "thumb", uploadedImageUrl }: ChordDiagramProps) {
  const imageSource =
    uploadedImageUrl ??
    (shape.imageFile ? `${import.meta.env.BASE_URL}${shape.imageFile}` : undefined);
  const fingerHotspots = fingerHotspotsByChordId[shape.legacyId ?? shape.id] ?? [];

  if (imageSource) {
    return (
      <ChordImage
        src={imageSource}
        alt={`${shape.displayName} 우쿨렐레 코드 다이어그램`}
        size={size}
        overlay={<FingerHintLayer hotspots={fingerHotspots} size={size} />}
      />
    );
  }

  return <Fretboard shape={shape} size={size} />;
}

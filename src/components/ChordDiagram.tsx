import type { ChordShape } from "../data/chordTypes";
import { fingerHotspotsByChordId } from "../data/fingerHotspots";
import { ChordImage } from "./ChordImage";
import { FingerHintLayer } from "./FingerHintLayer";
import { Fretboard } from "./Fretboard";

interface ChordDiagramProps {
  shape: ChordShape;
  size?: "thumb" | "large";
  uploadedImageUrl?: string;
}

export function ChordDiagram({ shape, size = "thumb", uploadedImageUrl }: ChordDiagramProps) {
  const imageSource = uploadedImageUrl ?? shape.image;
  const fingerHotspots = fingerHotspotsByChordId[shape.id] ?? [];

  if (imageSource) {
    return (
      <ChordImage
        src={imageSource}
        alt={`${shape.title} 우쿨렐레 코드 다이어그램`}
        size={size}
        overlay={<FingerHintLayer hotspots={fingerHotspots} size={size} />}
      />
    );
  }

  return <Fretboard shape={shape} size={size} />;
}

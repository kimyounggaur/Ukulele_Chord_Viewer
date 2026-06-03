import type { ChordShape } from "../data/chordTypes";
import { ChordImage } from "./ChordImage";
import { Fretboard } from "./Fretboard";

interface ChordDiagramProps {
  shape: ChordShape;
  size?: "thumb" | "large";
  uploadedImageUrl?: string;
}

export function ChordDiagram({ shape, size = "thumb", uploadedImageUrl }: ChordDiagramProps) {
  const imageSource = uploadedImageUrl ?? shape.image;

  if (imageSource) {
    return (
      <ChordImage
        src={imageSource}
        alt={`${shape.title} 우쿨렐레 코드 다이어그램`}
        size={size}
      />
    );
  }

  return <Fretboard shape={shape} size={size} />;
}

import type { ChordQualityId } from "../data/chordTypes";
import { MAIN_QUALITY_IDS, qualityById } from "../data/chordQualities";
import { QualityBubble } from "./QualityBubble";

interface QualitySelectorProps {
  selectedQualityId: ChordQualityId | null;
  onSelectQuality: (qualityId: ChordQualityId) => void;
}

export function QualitySelector({ selectedQualityId, onSelectQuality }: QualitySelectorProps) {
  return (
    <section className="screen-panel flex flex-1 items-center justify-center overflow-hidden px-2 py-4">
      <div className="quality-selector-grid">
        {MAIN_QUALITY_IDS.map((qualityId) => {
          const quality = qualityById[qualityId];
          return (
            <QualityBubble
              key={quality.id}
              quality={quality}
              active={selectedQualityId === quality.id}
              onClick={() => onSelectQuality(quality.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

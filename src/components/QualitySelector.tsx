import type { ChordQualityId } from "../data/chordTypes";
import { MAIN_QUALITY_IDS, qualityById } from "../data/chordQualities";
import { QualityBubble } from "./QualityBubble";

interface QualitySelectorProps {
  selectedQualityId: ChordQualityId | null;
  onSelectQuality: (qualityId: ChordQualityId) => void;
}

export function QualitySelector({ selectedQualityId, onSelectQuality }: QualitySelectorProps) {
  return (
    <section className="screen-panel quality-selector-screen">
      <figure className="quality-selector-art" aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}assets/ukulele-style-icon.png`}
          alt=""
          className="quality-selector-art-image"
        />
      </figure>
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
      <figure className="main-footer-image-wrap">
        <img
          src={`${import.meta.env.BASE_URL}assets/main-footer-authors.jpg`}
          alt="칼림바 연주곡집 공동 저자 소개"
          className="main-footer-image"
          loading="lazy"
        />
      </figure>
    </section>
  );
}

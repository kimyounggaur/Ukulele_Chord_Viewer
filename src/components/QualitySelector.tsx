import { useLayoutEffect, useRef } from "react";
import type { ChordQuality } from "../data/types";
import { MAIN_QUALITY_IDS, qualityById } from "../data/chordQualities";
import { QualityBubble } from "./QualityBubble";
import type { GridFocusRequest } from "../hooks/useRovingChordGrid";

interface QualitySelectorProps {
  selectedQualityId: ChordQuality | null;
  onSelectQuality: (qualityId: ChordQuality) => void;
  focusRequest?: GridFocusRequest | null;
}

export function QualitySelector({ selectedQualityId, onSelectQuality, focusRequest }: QualitySelectorProps) {
  const buttonsRef = useRef(new Map<ChordQuality, HTMLButtonElement>());

  useLayoutEffect(() => {
    if (!focusRequest) return undefined;
    const frame = window.requestAnimationFrame(() => buttonsRef.current.get(focusRequest.id as ChordQuality)?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest]);

  return (
    <section className="screen-panel quality-selector-screen" aria-labelledby="quality-selector-heading">
      <h1 id="quality-selector-heading" className="sr-only">우쿨렐레 코드 종류</h1>
      <figure className="quality-selector-art" aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}assets/ukulele-style-icon.png`}
          alt=""
          className="quality-selector-art-image"
        />
      </figure>
      <nav aria-labelledby="quality-selector-heading">
        <ul className="quality-selector-grid">
          {MAIN_QUALITY_IDS.map((qualityId) => {
            const quality = qualityById[qualityId];
            return (
              <li key={quality.id} className="quality-selector-item">
                <QualityBubble
                  quality={quality}
                  active={selectedQualityId === quality.id}
                  onClick={() => onSelectQuality(quality.id)}
                  buttonRef={(button) => {
                    if (button) buttonsRef.current.set(quality.id, button);
                    else buttonsRef.current.delete(quality.id);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </nav>
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

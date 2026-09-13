import "../styles/quality-selector.css";
import { useLayoutEffect, useRef } from "react";
import type { Chord, ChordQuality } from "../data/types";
import { MAIN_QUALITY_IDS, qualityById } from "../data/chordQualities";
import { QualityBubble } from "./QualityBubble";
import type { GridFocusRequest } from "../hooks/useRovingChordGrid";
import { asset } from "../lib/asset";
import { RecentChordStrip } from "./RecentChordStrip";

interface QualitySelectorProps {
  selectedQualityId: ChordQuality | null;
  onSelectQuality: (qualityId: ChordQuality) => void;
  focusRequest?: GridFocusRequest | null;
  onFocusRequestHandled?: (request: GridFocusRequest) => void;
  recentChords?: readonly Chord[];
  onSelectRecent?: (chordId: string) => void;
}

const EMPTY_RECENT_CHORDS: readonly Chord[] = [];

export function QualitySelector({
  selectedQualityId,
  onSelectQuality,
  focusRequest,
  onFocusRequestHandled,
  recentChords = EMPTY_RECENT_CHORDS,
  onSelectRecent,
}: QualitySelectorProps) {
  const buttonsRef = useRef(new Map<ChordQuality, HTMLButtonElement>());
  const handledFocusRequestRef = useRef<string | null>(null);
  const handledCallbackRef = useRef(onFocusRequestHandled);
  handledCallbackRef.current = onFocusRequestHandled;

  useLayoutEffect(() => {
    if (!focusRequest) return undefined;
    const requestKey = `${focusRequest.id}:${focusRequest.nonce}`;
    if (handledFocusRequestRef.current === requestKey) return undefined;
    const frame = window.requestAnimationFrame(() => {
      if (handledFocusRequestRef.current === requestKey) return;
      handledFocusRequestRef.current = requestKey;
      buttonsRef.current.get(focusRequest.id as ChordQuality)?.focus();
      handledCallbackRef.current?.(focusRequest);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest]);

  return (
    <section className="screen-panel quality-selector-screen" aria-labelledby="quality-selector-heading">
      <h1 id="quality-selector-heading" className="sr-only">우쿨렐레 코드 종류</h1>
      <figure className="quality-selector-art" aria-hidden="true">
        <picture>
          <source
            srcSet={asset("assets/ukulele-style-icon.webp")}
            type="image/webp"
          />
          <img
            src={asset("assets/ukulele-style-icon.png")}
            alt=""
            width="512"
            height="512"
            loading="eager"
            decoding="async"
            {...{ fetchpriority: "high" }}
            className="quality-selector-art-image"
          />
        </picture>
      </figure>
      {onSelectRecent ? <RecentChordStrip chords={recentChords} onSelect={onSelectRecent} /> : null}
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
        <picture>
          <source
            srcSet={asset("assets/main-footer-authors.webp")}
            type="image/webp"
          />
          <img
            src={asset("assets/main-footer-authors.jpg")}
            alt="칼림바 연주곡집 공동 저자 소개"
            width="979"
            height="144"
            className="main-footer-image"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </figure>
    </section>
  );
}

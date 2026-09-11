import { useId, type KeyboardEvent, type Ref } from "react";
import type { Chord } from "../data/types";
import { qualityById } from "../data/chordQualities";
import { getChordDisplayTitle } from "../lib/chordDisplay";
import { ChordDiagram } from "./ChordDiagram";
import { ChordPlayButton } from "./ChordPlayButton";
import { describeVoicing } from "../a11y/describeVoicing";
import { useChordAudio } from "../audio/ChordAudioProvider";

interface ChordCardProps {
  chord: Chord;
  uploadedImageUrl?: string;
  onSelect: () => void;
  featured?: boolean;
  related?: boolean;
  selectionTabIndex?: number;
  audioTabIndex?: number;
  selectionButtonRef?: Ref<HTMLButtonElement>;
  onSelectionFocus?: () => void;
  onSelectionKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

export function ChordCard({
  chord,
  uploadedImageUrl,
  onSelect,
  featured = false,
  related = false,
  selectionTabIndex,
  audioTabIndex,
  selectionButtonRef,
  onSelectionFocus,
  onSelectionKeyDown,
}: ChordCardProps) {
  const { available: audioAvailable, playChord } = useChordAudio();
  const shortcutHelpId = useId();
  const quality = qualityById[chord.quality];
  const displayTitle = getChordDisplayTitle(chord);
  const description = describeVoicing(chord);
  const minHeightClass = related
    ? ""
    : featured
      ? "min-h-[clamp(300px,43vh,520px)]"
      : "min-h-[clamp(220px,28vh,360px)]";

  return (
    <article
      className={[
        related
          ? "chord-card-shell relative h-[184px] w-[180px] shrink-0 lg:h-[156px] lg:w-full"
          : "chord-card-shell relative h-full",
        featured ? "sm:col-span-2" : "",
        minHeightClass,
      ].join(" ")}
    >
      <button
        ref={selectionButtonRef}
        type="button"
        onClick={onSelect}
        onFocus={onSelectionFocus}
        onKeyDown={(event) => {
          const isArpeggioShortcut = event.shiftKey && (event.key === "Enter" || event.key === " ");
          const isStrumShortcut = !event.altKey
            && !event.ctrlKey
            && !event.metaKey
            && event.key.toLowerCase() === "p";
          if (audioAvailable && (isArpeggioShortcut || isStrumShortcut)) {
            event.preventDefault();
            void playChord(chord, isArpeggioShortcut ? "arpeggio" : "strum");
            return;
          }
          onSelectionKeyDown?.(event);
        }}
        tabIndex={selectionTabIndex}
        aria-label={description}
        aria-describedby={shortcutHelpId}
        data-chord-id={chord.id}
        className={[
          related ? "related-chord-card" : "chord-card",
          featured ? "is-featured" : "",
          related
            ? "group flex h-full w-full flex-col p-2 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
            : "group flex h-full w-full flex-col gap-[clamp(12px,1.4vh,20px)] p-[clamp(14px,1.5vw,24px)] text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100",
        ].join(" ")}
        style={{ borderTop: `4px solid ${quality.color}` }}
      >
        <div className="flex items-center justify-between gap-2 pr-9">
          <span
            className={[
              "font-display font-extrabold text-stone-800",
              related ? "text-sm" : featured ? "text-[clamp(22px,3.2vh,34px)]" : "text-[clamp(18px,2.3vh,26px)]",
            ].join(" ")}
          >
            {displayTitle}
          </span>
        </div>
        <div className={related ? "related-chord-diagram min-h-0 flex-1" : "min-h-0 flex-1"}>
          <ChordDiagram chord={chord} size="sm" uploadedImageUrl={uploadedImageUrl} />
        </div>
      </button>
      <span id={shortcutHelpId} className="sr-only">
        P 키는 스트럼 재생, Shift+Enter 또는 Shift+Space는 아르페지오 재생입니다.
      </span>
      <ChordPlayButton chord={chord} compact className="chord-card-audio" tabIndex={audioTabIndex} />
    </article>
  );
}

import type { Chord } from "../data/types";
import { qualityById } from "../data/chordQualities";
import { getChordDisplayTitle } from "../lib/chordDisplay";
import { ChordDiagram } from "./ChordDiagram";
import { ChordPlayButton } from "./ChordPlayButton";

interface ChordCardProps {
  chord: Chord;
  uploadedImageUrl?: string;
  onSelect: () => void;
  featured?: boolean;
  related?: boolean;
}

export function ChordCard({
  chord,
  uploadedImageUrl,
  onSelect,
  featured = false,
  related = false,
}: ChordCardProps) {
  const quality = qualityById[chord.quality];
  const displayTitle = getChordDisplayTitle(chord);
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
        type="button"
        onClick={onSelect}
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
      <ChordPlayButton chord={chord} compact className="chord-card-audio" />
    </article>
  );
}

import type { ChordShape } from "../data/chordTypes";
import { qualityById } from "../data/chordQualities";
import { getChordDisplayTitle } from "../lib/chordDisplay";
import { ChordDiagram } from "./ChordDiagram";

interface ChordCardProps {
  chord: ChordShape;
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
      ? "min-h-[clamp(300px,43vh,520px)] sm:col-span-2"
      : "min-h-[clamp(220px,28vh,360px)]";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        related ? "related-chord-card" : "chord-card",
        featured ? "is-featured" : "",
        related
          ? "group flex h-[184px] w-[180px] shrink-0 flex-col p-2 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 lg:h-[156px] lg:w-full"
          : "group flex h-full flex-col gap-[clamp(12px,1.4vh,20px)] p-[clamp(14px,1.5vw,24px)] text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100",
        minHeightClass,
      ].join(" ")}
      style={{ borderTop: `4px solid ${quality.color}` }}
    >
      <div className="flex items-center justify-between gap-2">
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
        <ChordDiagram shape={chord} size="thumb" uploadedImageUrl={uploadedImageUrl} />
      </div>
    </button>
  );
}

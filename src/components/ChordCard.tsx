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
    ? "min-h-[190px]"
    : featured
      ? "min-h-[clamp(300px,43vh,520px)] sm:col-span-2"
      : "min-h-[clamp(220px,28vh,360px)]";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        related ? "related-chord-card" : "chord-card",
        "group flex h-full flex-col text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100",
        related ? "w-[180px] shrink-0 p-2 lg:w-full" : "gap-[clamp(12px,1.4vh,20px)] p-[clamp(14px,1.5vw,24px)]",
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
        <span
          className="rounded-full px-2 py-1 text-xs font-extrabold"
          style={{ color: quality.color, backgroundColor: quality.softColor }}
        >
          {quality.shortLabel}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <ChordDiagram shape={chord} size="thumb" uploadedImageUrl={uploadedImageUrl} />
      </div>
    </button>
  );
}

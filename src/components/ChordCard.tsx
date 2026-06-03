import type { ChordShape } from "../data/chordTypes";
import { qualityById } from "../data/chordQualities";
import { ChordDiagram } from "./ChordDiagram";

interface ChordCardProps {
  chord: ChordShape;
  uploadedImageUrl?: string;
  onSelect: () => void;
}

export function ChordCard({ chord, uploadedImageUrl, onSelect }: ChordCardProps) {
  const quality = qualityById[chord.quality];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-h-[210px] flex-col gap-2 rounded-lg border border-white bg-white/88 p-3 text-left shadow-neo transition duration-200 hover:scale-[1.035] focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-200"
      style={{ borderTop: `4px solid ${quality.color}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[clamp(18px,2.3vh,26px)] font-semibold text-zinc-800">
          {chord.title}
        </span>
        <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ color: quality.color, backgroundColor: quality.softColor }}>
          {quality.shortLabel}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <ChordDiagram shape={chord} size="thumb" uploadedImageUrl={uploadedImageUrl} />
      </div>
    </button>
  );
}

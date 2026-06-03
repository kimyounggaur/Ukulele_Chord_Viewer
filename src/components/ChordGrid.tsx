import type { ChordQualityId, ChordShape } from "../data/chordTypes";
import { qualityById } from "../data/chordQualities";
import { useChordSearch } from "../hooks/useChordSearch";
import { ChordCard } from "./ChordCard";
import { EmptyState } from "./EmptyState";

interface ChordGridProps {
  chords: readonly ChordShape[];
  selectedQualityId: ChordQualityId | null;
  searchTerm: string;
  onSelectChord: (chordId: string) => void;
  getUploadedImageUrl: (chordId: string) => string | undefined;
}

export function ChordGrid({
  chords,
  selectedQualityId,
  searchTerm,
  onSelectChord,
  getUploadedImageUrl,
}: ChordGridProps) {
  const filteredChords = useChordSearch(chords, searchTerm, selectedQualityId);
  const title = selectedQualityId ? qualityById[selectedQualityId].label : "All Chords";

  return (
    <section className="screen-panel flex flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <h1 className="font-display text-[clamp(24px,4vh,44px)] font-semibold text-zinc-800">
          {title}
        </h1>
        <span className="font-display text-[clamp(14px,2vh,18px)] font-semibold text-pink-300">
          {filteredChords.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 thin-scrollbar">
        {filteredChords.length > 0 ? (
          <div className="grid min-h-full grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 pb-1">
            {filteredChords.map((chord) => (
              <ChordCard
                key={chord.id}
                chord={chord}
                uploadedImageUrl={getUploadedImageUrl(chord.id)}
                onSelect={() => onSelectChord(chord.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

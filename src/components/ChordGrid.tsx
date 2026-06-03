import type { ChordQualityId, ChordShape } from "../data/chordTypes";
import { qualityById } from "../data/chordQualities";
import { useChordSearch } from "../hooks/useChordSearch";
import { ChordCard } from "./ChordCard";
import { EmptyState } from "./EmptyState";
import { ArrowLeft } from "lucide-react";

interface ChordGridProps {
  chords: readonly ChordShape[];
  selectedQualityId: ChordQualityId | null;
  searchTerm: string;
  onSelectChord: (chordId: string) => void;
  getUploadedImageUrl: (chordId: string) => string | undefined;
  onBack: () => void;
}

export function ChordGrid({
  chords,
  selectedQualityId,
  searchTerm,
  onSelectChord,
  getUploadedImageUrl,
  onBack,
}: ChordGridProps) {
  const filteredChords = useChordSearch(chords, searchTerm, selectedQualityId);
  const title = selectedQualityId ? qualityById[selectedQualityId].label : "All Chords";

  return (
    <section className="screen-panel relative px-[clamp(24px,5vw,84px)] pb-[clamp(28px,5vh,72px)]">
      <div className="module-screen-toolbar sticky top-0 z-10 mx-auto flex w-full max-w-[1140px] flex-wrap items-center gap-3 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="코드 종류 선택 화면으로 돌아가기"
          className="module-back-button inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-rose-100 bg-white px-4 font-bold text-stone-500 shadow-neumorphic transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          뒤로
        </button>
        <h1 className="min-w-0 font-display text-3xl font-extrabold text-stone-700 sm:text-4xl">
          {title}
        </h1>
        <span className="font-display text-lg font-extrabold text-rose-300">
          {filteredChords.length} chords
        </span>
      </div>

      <div className="chord-grid-board mx-auto w-full max-w-[1140px]">
        {filteredChords.length > 0 ? (
          <div className="grid grid-cols-1 gap-[clamp(20px,2.5vw,32px)] sm:grid-cols-4">
            {filteredChords.map((chord, index) => (
              <ChordCard
                key={chord.id}
                chord={chord}
                uploadedImageUrl={getUploadedImageUrl(chord.id)}
                onSelect={() => onSelectChord(chord.id)}
                featured={index === 0 && filteredChords.length > 2}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <button
        type="button"
        onClick={onBack}
        aria-label="코드 종류 선택 화면으로 돌아가기"
        className="module-back-floating"
      >
        <ArrowLeft size={20} aria-hidden="true" />
        <span>뒤로</span>
      </button>
    </section>
  );
}

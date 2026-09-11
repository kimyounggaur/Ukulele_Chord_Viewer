import { useMemo } from "react";
import type { Chord, ChordQuality } from "../data/types";
import { qualityById } from "../data/chordQualities";
import { useChordSearch } from "../hooks/useChordSearch";
import { ChordCard } from "./ChordCard";
import { EmptyState } from "./EmptyState";
import { ArrowLeft } from "lucide-react";
import { chordStorageKey } from "../lib/chordIdentity";
import { LAYOUT_COLUMNS, type LayoutMode } from "../hooks/useLayoutMode";
import { useRovingChordGrid, type GridFocusRequest } from "../hooks/useRovingChordGrid";

interface ChordGridProps {
  chords: readonly Chord[];
  selectedQualityId: ChordQuality | null;
  searchTerm: string;
  onSelectChord: (chordId: string) => void;
  getUploadedImageUrl: (chordId: string) => string | undefined;
  onBack: () => void;
  layoutMode: LayoutMode;
  focusRequest?: GridFocusRequest | null;
}

export function ChordGrid({
  chords,
  selectedQualityId,
  searchTerm,
  onSelectChord,
  getUploadedImageUrl,
  onBack,
  layoutMode,
  focusRequest,
}: ChordGridProps) {
  const filteredChords = useChordSearch(chords, searchTerm, selectedQualityId);
  const title = selectedQualityId ? qualityById[selectedQualityId].label : "All Chords";
  const columns = LAYOUT_COLUMNS[layoutMode];
  const chordIds = useMemo(() => filteredChords.map((chord) => chord.id), [filteredChords]);
  const { activeId, setActiveId, registerButton, handleKeyDown } = useRovingChordGrid(
    chordIds,
    columns,
    focusRequest,
  );
  const rows = useMemo(
    () => Array.from(
      { length: Math.ceil(filteredChords.length / columns) },
      (_, rowIndex) => filteredChords.slice(rowIndex * columns, rowIndex * columns + columns),
    ),
    [columns, filteredChords],
  );

  return (
    <section className="screen-panel chord-grid-screen relative" data-grid-mode={layoutMode}>
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

      <div className="chord-gallery-scroll thin-scrollbar">
        <div className="chord-grid-board mx-auto w-full max-w-[1140px]">
          {filteredChords.length > 0 ? (
          <div
            className="chord-gallery-grid"
            role="grid"
            aria-label={`${title} 코드 목록`}
            aria-colcount={columns}
            aria-rowcount={rows.length}
          >
            {rows.map((row, rowIndex) => (
              <div className="chord-grid-row" role="row" aria-rowindex={rowIndex + 1} key={row[0].id}>
                {row.map((chord, columnIndex) => (
                  <div
                    role="gridcell"
                    aria-colindex={columnIndex + 1}
                    aria-rowindex={rowIndex + 1}
                    key={chord.id}
                  >
                    <ChordCard
                      chord={chord}
                      uploadedImageUrl={getUploadedImageUrl(chordStorageKey(chord))}
                      onSelect={() => onSelectChord(chord.id)}
                      selectionTabIndex={activeId === chord.id ? 0 : -1}
                      audioTabIndex={-1}
                      selectionButtonRef={(button) => registerButton(chord.id, button)}
                      onSelectionFocus={() => setActiveId(chord.id)}
                      onSelectionKeyDown={(event) => handleKeyDown(event, chord.id)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </section>
  );
}

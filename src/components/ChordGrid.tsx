import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Chord, ChordQuality } from "../data/types";
import { qualityById } from "../data/chordQualities";
import { useChordSearch } from "../hooks/useChordSearch";
import { ChordCard } from "./ChordCard";
import { EmptyState } from "./EmptyState";
import { ArrowLeft, Star } from "lucide-react";
import { chordStorageKey } from "../lib/chordIdentity";
import { LAYOUT_COLUMNS, type LayoutMode } from "../hooks/useLayoutMode";
import { useRovingChordGrid, type GridFocusRequest } from "../hooks/useRovingChordGrid";
import { useRouteScrollMemory } from "../routing/useRouteScrollMemory";

interface ChordGridProps {
  chords: readonly Chord[];
  selectedQualityId: ChordQuality | null;
  searchTerm: string;
  onSelectChord: (chordId: string) => void;
  getUploadedImageUrl: (chordId: string) => string | undefined;
  onBack: () => void;
  layoutMode: LayoutMode;
  focusRequest?: GridFocusRequest | null;
  onFocusRequestHandled?: (request: GridFocusRequest) => void;
  locationKey: string;
  visitToken: object;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  isFavorite: (chordId: string) => boolean;
  onToggleFavorite: (chordId: string) => void;
  onRequestAddToSet?: (chordId: string, opener: HTMLButtonElement) => void;
}

interface ChordGridCellProps {
  chord: Chord;
  rowIndex: number;
  columnIndex: number;
  uploadedImageUrl?: string;
  active: boolean;
  favorite: boolean;
  onSelectChord: (chordId: string) => void;
  onRememberSelectedCard: (chordId: string) => void;
  onToggleFavorite: (chordId: string, wasFavorite: boolean) => void;
  onRequestAddToSet?: (chordId: string, opener: HTMLButtonElement) => void;
  onRegisterButton: (chordId: string, button: HTMLButtonElement | null) => void;
  onSelectionFocus: (chordId: string) => void;
  onSelectionKeyDown: (event: KeyboardEvent<HTMLButtonElement>, chordId: string) => void;
}

const ChordGridCell = memo(function ChordGridCell({
  chord,
  rowIndex,
  columnIndex,
  uploadedImageUrl,
  active,
  favorite,
  onSelectChord,
  onRememberSelectedCard,
  onToggleFavorite,
  onRequestAddToSet,
  onRegisterButton,
  onSelectionFocus,
  onSelectionKeyDown,
}: ChordGridCellProps) {
  const handleSelect = useCallback(() => {
    onRememberSelectedCard(chord.id);
    onSelectChord(chord.id);
  }, [chord.id, onRememberSelectedCard, onSelectChord]);
  const handleToggleFavorite = useCallback(
    () => onToggleFavorite(chord.id, favorite),
    [chord.id, favorite, onToggleFavorite],
  );
  const handleRequestAddToSet = useCallback(
    (opener: HTMLButtonElement) => onRequestAddToSet?.(chord.id, opener),
    [chord.id, onRequestAddToSet],
  );
  const handleRegisterButton = useCallback(
    (button: HTMLButtonElement | null) => onRegisterButton(chord.id, button),
    [chord.id, onRegisterButton],
  );
  const handleFocus = useCallback(
    () => onSelectionFocus(chord.id),
    [chord.id, onSelectionFocus],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => onSelectionKeyDown(event, chord.id),
    [chord.id, onSelectionKeyDown],
  );

  return (
    <div
      role="gridcell"
      aria-colindex={columnIndex + 1}
      aria-rowindex={rowIndex + 1}
    >
      <ChordCard
        chord={chord}
        uploadedImageUrl={uploadedImageUrl}
        onSelect={handleSelect}
        priority={rowIndex === 0 && columnIndex === 0}
        selectionTabIndex={active ? 0 : -1}
        audioTabIndex={-1}
        favorite={favorite}
        onToggleFavorite={handleToggleFavorite}
        onRequestAddToSet={onRequestAddToSet ? handleRequestAddToSet : undefined}
        favoriteTabIndex={-1}
        selectionButtonRef={handleRegisterButton}
        onSelectionFocus={handleFocus}
        onSelectionKeyDown={handleKeyDown}
      />
    </div>
  );
});

export function ChordGrid({
  chords,
  selectedQualityId,
  searchTerm,
  onSelectChord,
  getUploadedImageUrl,
  onBack,
  layoutMode,
  focusRequest,
  onFocusRequestHandled,
  locationKey,
  visitToken,
  favoritesOnly,
  onToggleFavoritesOnly,
  isFavorite,
  onToggleFavorite,
  onRequestAddToSet,
}: ChordGridProps) {
  const matchingChords = useChordSearch(chords, searchTerm, selectedQualityId);
  const filteredChords = useMemo(
    () => favoritesOnly ? matchingChords.filter((chord) => isFavorite(chord.id)) : matchingChords,
    [favoritesOnly, isFavorite, matchingChords],
  );
  const title = searchTerm.trim()
    ? `“${searchTerm.trim()}” 검색 결과`
    : selectedQualityId
      ? qualityById[selectedQualityId].label
      : "All Chords";
  const columns = LAYOUT_COLUMNS[layoutMode];
  const favoritesFilterRef = useRef<HTMLButtonElement>(null);
  const [favoriteRemovalStatus, setFavoriteRemovalStatus] = useState("");
  const { scrollContainerRef, hasSnapshot, restoredSelectedCardId, rememberSelectedCard } = useRouteScrollMemory<HTMLDivElement>({ locationKey, visitToken });
  // A returning history entry needs every card mounted before the scroll/focus
  // restoration layout effects run. Only a genuinely fresh gallery visit uses
  // the two-frame first-card startup stage.
  const [allRowsReady, setAllRowsReady] = useState(() => hasSnapshot || Boolean(focusRequest));
  const restoredFocusRequest = useMemo<GridFocusRequest | null>(
    () => restoredSelectedCardId ? { id: restoredSelectedCardId, nonce: `route:${locationKey}` } : null,
    [locationKey, restoredSelectedCardId],
  );
  const chordIds = useMemo(() => filteredChords.map((chord) => chord.id), [filteredChords]);
  const effectiveFocusRequest = restoredFocusRequest ?? (hasSnapshot ? null : focusRequest);
  const { activeId, setActiveId, registerButton, handleKeyDown } = useRovingChordGrid(
    chordIds,
    columns,
    effectiveFocusRequest,
    (handledRequest) => {
      if (
        focusRequest
        && handledRequest.id === focusRequest.id
        && handledRequest.nonce === focusRequest.nonce
      ) {
        onFocusRequestHandled?.(handledRequest);
      }
    },
  );
  const rows = useMemo(
    () => Array.from(
      { length: Math.ceil(filteredChords.length / columns) },
      (_, rowIndex) => filteredChords.slice(rowIndex * columns, rowIndex * columns + columns),
    ),
    [columns, filteredChords],
  );
  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setAllRowsReady(true));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, []);
  // Paint the first meaningful card immediately, then mount the complete small list
  // within two frames. This is a one-time startup stage, not scroll virtualization.
  const renderedRows = allRowsReady || rows.length === 0 ? rows : [[rows[0][0]]];
  const toggleFavoriteFromCard = useCallback((chordId: string, wasFavorite: boolean) => {
    const removesVisibleCard = favoritesOnly && wasFavorite;
    onToggleFavorite(chordId);
    if (removesVisibleCard) {
      setFavoriteRemovalStatus(`${chordId} 코드를 즐겨찾기에서 제거했습니다.`);
      window.requestAnimationFrame(() => favoritesFilterRef.current?.focus());
    }
  }, [favoritesOnly, onToggleFavorite]);

  return (
    <section className="screen-panel chord-grid-screen relative" data-grid-mode={layoutMode}>
      <div className="module-screen-toolbar sticky top-0 z-10 mx-auto flex w-full max-w-[1140px] flex-wrap items-center gap-3 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로, 코드 종류 선택 화면으로 돌아가기"
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
        <button
          ref={favoritesFilterRef}
          type="button"
          className="favorites-filter-button"
          aria-pressed={favoritesOnly}
          onClick={onToggleFavoritesOnly}
        >
          <Star size={16} fill={favoritesOnly ? "currentColor" : "none"} aria-hidden="true" />
          즐겨찾기만 보기
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {favoriteRemovalStatus}
      </p>

      <div ref={scrollContainerRef} className="chord-gallery-scroll thin-scrollbar">
        <div className="chord-grid-board mx-auto w-full max-w-[1140px]">
          {filteredChords.length > 0 ? (
          <div
            className="chord-gallery-grid"
            role="grid"
            aria-label={`${title} 코드 목록`}
            aria-colcount={columns}
            aria-rowcount={rows.length}
          >
            {renderedRows.map((row, rowIndex) => (
              <div className="chord-grid-row" role="row" aria-rowindex={rowIndex + 1} key={row[0].id}>
                {row.map((chord, columnIndex) => (
                  <ChordGridCell
                    key={chord.id}
                    chord={chord}
                    rowIndex={rowIndex}
                    columnIndex={columnIndex}
                    uploadedImageUrl={getUploadedImageUrl(chordStorageKey(chord))}
                    active={activeId === chord.id}
                    favorite={isFavorite(chord.id)}
                    onSelectChord={onSelectChord}
                    onRememberSelectedCard={rememberSelectedCard}
                    onToggleFavorite={toggleFavoriteFromCard}
                    onRequestAddToSet={onRequestAddToSet}
                    onRegisterButton={registerButton}
                    onSelectionFocus={setActiveId}
                    onSelectionKeyDown={handleKeyDown}
                  />
                ))}
              </div>
            ))}
          </div>
          ) : (
            <EmptyState
              title={favoritesOnly ? "조건에 맞는 즐겨찾기가 없습니다" : "검색 결과가 없습니다"}
              description={favoritesOnly ? "별 버튼으로 코드를 즐겨찾기에 추가해 보세요." : "다른 검색어나 코드 종류를 시도해 보세요."}
            />
          )}
        </div>
      </div>
    </section>
  );
}

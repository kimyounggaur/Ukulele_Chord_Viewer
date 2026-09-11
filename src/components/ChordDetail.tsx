import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Share2 } from "lucide-react";
import type { Chord } from "../data/types";
import { qualityById } from "../data/chordQualities";
import { getChordDisplayTitle } from "../lib/chordDisplay";
import { ChordCard } from "./ChordCard";
import { ChordDiagram } from "./ChordDiagram";
import { ChordImageUploader } from "./ChordImageUploader";
import { chordStorageKey } from "../lib/chordIdentity";
import { ChordPlayButton } from "./ChordPlayButton";
import { FavoriteButton } from "./FavoriteButton";
import { ChordSharePanel } from "./ChordSharePanel";
import { chordPath } from "../routing/routes";
import { copyTextToClipboard } from "../lib/clipboard";

interface ChordDetailProps {
  chord: Chord;
  voicingIndex: number;
  onSelectVoicing: (index: number) => void;
  relatedChords: readonly Chord[];
  onSelectChord: (chordId: string) => void;
  onBack: () => void;
  getUploadedImageUrl: (chordId: string) => string | undefined;
  onUploadImage: (chordId: string, file: File) => Promise<void>;
  onDeleteImage: (chordId: string) => Promise<void>;
  adminMode: boolean;
  isFavorite: (chordId: string) => boolean;
  onToggleFavorite: (chordId: string) => void;
}

export function ChordDetail({
  chord,
  voicingIndex,
  onSelectVoicing,
  relatedChords,
  onSelectChord,
  onBack,
  getUploadedImageUrl,
  onUploadImage,
  onDeleteImage,
  adminMode,
  isFavorite,
  onToggleFavorite,
}: ChordDetailProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopyStatus, setShareCopyStatus] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [chord.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        !document.querySelector("[aria-modal='true'], #audio-settings-panel")
      ) {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  const quality = qualityById[chord.quality];
  const displayTitle = getChordDisplayTitle(chord);
  const shareUrl = typeof window === "undefined"
    ? ""
    : `${new URL(import.meta.env.BASE_URL, window.location.origin).toString()}#${chordPath(chord.id, voicingIndex)}`;
  const copyShareLink = async () => {
    setShareCopyStatus("링크를 복사하는 중입니다.");
    const method = await copyTextToClipboard(shareUrl);
    setShareCopyStatus(method ? `${displayTitle} 코드 링크를 복사했습니다.` : "링크를 복사하지 못했습니다.");
  };
  const openSharePanel = () => {
    setShareOpen(true);
    void copyShareLink();
  };

  return (
    <section className="screen-panel detail-screen px-[clamp(24px,5vw,84px)] pb-[clamp(28px,5vh,72px)] pt-2 thin-scrollbar" aria-labelledby={headingId}>
      <div className="mx-auto w-full max-w-[1120px]">
        <button
          type="button"
          onClick={onBack}
          aria-label={`뒤로, ${displayTitle} 상세에서 코드 목록으로 돌아가기`}
          className="mb-4 inline-flex h-11 items-center gap-2 rounded-full border border-rose-100 bg-white px-4 font-bold text-stone-500 shadow-neumorphic transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          뒤로
        </button>

        <div className="detail-grid">
          <div className="min-w-0">
            <div className="detail-title-row">
              <h1
                id={headingId}
                ref={headingRef}
                tabIndex={-1}
                className="w-fit rounded-lg border-4 bg-white px-8 py-3 text-center font-display text-4xl font-extrabold text-stone-700 shadow-neumorphic sm:text-5xl"
                style={{ borderColor: quality.color }}
              >
                {displayTitle}
              </h1>
              <div className="detail-actions">
                <FavoriteButton
                  chordName={displayTitle}
                  active={isFavorite(chord.id)}
                  onToggle={() => onToggleFavorite(chord.id)}
                />
                <ChordPlayButton chord={chord} voicingIndex={voicingIndex} />
                <button type="button" className="detail-share-button" onClick={openSharePanel}>
                  <Share2 size={19} aria-hidden="true" />
                  링크 복사 · QR
                </button>
              </div>
            </div>
            {chord.voicings.length > 1 ? (
              <div className="voicing-selector" role="group" aria-label={`${displayTitle} 운지 선택`}>
                {chord.voicings.map((voicing, index) => (
                  <button
                    type="button"
                    key={`${voicing.frets.join("-")}-${index}`}
                    aria-pressed={voicingIndex === index}
                    onClick={() => onSelectVoicing(index)}
                  >
                    운지 {index + 1}{voicing.label ? ` · ${voicing.label}` : ""}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="detail-image-frame rounded-lg border border-white bg-white/90 p-[clamp(10px,1.4vw,18px)] shadow-neumorphic">
              <ChordDiagram
                chord={chord}
                voicingIndex={voicingIndex}
                forcePrimitive={voicingIndex > 0}
                size="lg"
                uploadedImageUrl={getUploadedImageUrl(chordStorageKey(chord))}
              />
            </div>
          </div>

          <aside className="flex min-h-0 flex-col gap-3">
            <h2 className="font-display text-lg font-extrabold text-stone-700">같은 종류의 코드</h2>
            {adminMode ? (
              <ChordImageUploader
                chord={chord}
                uploadedImageUrl={getUploadedImageUrl(chord.id)}
                onUpload={onUploadImage}
                onDelete={onDeleteImage}
              />
            ) : null}
            <ul className="related-chords-panel flex gap-3 overflow-x-auto pb-2 thin-scrollbar lg:flex-col" aria-label="같은 종류의 코드">
              {relatedChords.map((relatedChord) => (
                <li key={relatedChord.id} className="related-chord-item">
                  <ChordCard
                    chord={relatedChord}
                    uploadedImageUrl={getUploadedImageUrl(chordStorageKey(relatedChord))}
                    onSelect={() => onSelectChord(relatedChord.id)}
                    related
                    favorite={isFavorite(relatedChord.id)}
                    onToggleFavorite={() => onToggleFavorite(relatedChord.id)}
                  />
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
      {shareOpen ? (
        <div className="chord-share-backdrop" role="presentation" onMouseDown={() => setShareOpen(false)}>
          <ChordSharePanel
            chordName={displayTitle}
            url={shareUrl}
            copyStatus={shareCopyStatus}
            onCopy={() => void copyShareLink()}
            onClose={() => setShareOpen(false)}
          />
        </div>
      ) : null}
    </section>
  );
}

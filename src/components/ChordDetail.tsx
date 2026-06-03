import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { ChordShape } from "../data/chordTypes";
import { qualityById } from "../data/chordQualities";
import { getChordDisplayTitle } from "../lib/chordDisplay";
import { ChordCard } from "./ChordCard";
import { ChordDiagram } from "./ChordDiagram";
import { ChordImageUploader } from "./ChordImageUploader";

interface ChordDetailProps {
  chord: ChordShape;
  relatedChords: readonly ChordShape[];
  onSelectChord: (chordId: string) => void;
  onBack: () => void;
  getUploadedImageUrl: (chordId: string) => string | undefined;
  onUploadImage: (chordId: string, file: File) => Promise<void>;
  onDeleteImage: (chordId: string) => Promise<void>;
  adminMode: boolean;
}

export function ChordDetail({
  chord,
  relatedChords,
  onSelectChord,
  onBack,
  getUploadedImageUrl,
  onUploadImage,
  onDeleteImage,
  adminMode,
}: ChordDetailProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  const quality = qualityById[chord.quality];
  const displayTitle = getChordDisplayTitle(chord);

  return (
    <section className="screen-panel px-[clamp(24px,5vw,84px)] pb-[clamp(28px,5vh,72px)] pt-2">
      <div className="mx-auto w-full max-w-[1120px]">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex h-11 items-center gap-2 rounded-full border border-rose-100 bg-white px-4 font-bold text-stone-500 shadow-neumorphic transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          뒤로
        </button>

        <div className="detail-grid">
          <div className="min-w-0">
            <h1
              className="mx-auto mb-5 w-fit rounded-lg border-4 bg-white px-8 py-3 text-center font-display text-4xl font-extrabold text-stone-700 shadow-neumorphic sm:text-5xl"
              style={{ borderColor: quality.color }}
            >
              {displayTitle}
            </h1>
            <div className="detail-image-frame min-h-[clamp(430px,65vh,620px)] rounded-lg border border-white bg-white/90 p-[clamp(10px,1.4vw,18px)] shadow-neumorphic">
              <ChordDiagram
                shape={chord}
                size="large"
                uploadedImageUrl={getUploadedImageUrl(chord.id)}
              />
            </div>
          </div>

          <aside className="flex min-h-0 flex-col gap-3">
            {adminMode ? (
              <ChordImageUploader
                chord={chord}
                uploadedImageUrl={getUploadedImageUrl(chord.id)}
                onUpload={onUploadImage}
                onDelete={onDeleteImage}
              />
            ) : null}
            <div className="related-chords-panel flex gap-3 overflow-x-auto pb-2 thin-scrollbar lg:flex-col">
              {relatedChords.map((relatedChord) => (
                <ChordCard
                  key={relatedChord.id}
                  chord={relatedChord}
                  uploadedImageUrl={getUploadedImageUrl(relatedChord.id)}
                  onSelect={() => onSelectChord(relatedChord.id)}
                  related
                />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

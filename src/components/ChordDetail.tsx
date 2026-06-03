import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { ChordShape } from "../data/chordTypes";
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
}

export function ChordDetail({
  chord,
  relatedChords,
  onSelectChord,
  onBack,
  getUploadedImageUrl,
  onUploadImage,
  onDeleteImage,
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

  return (
    <section className="screen-panel detail-grid">
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-pink-100 bg-white text-pink-400 shadow-neo transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-200"
            aria-label="Back"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <span className="font-display text-[clamp(18px,2.7vh,30px)] font-semibold text-pink-300">
            |{chord.root}
          </span>
          <h1 className="min-w-0 truncate font-display text-[clamp(30px,6vh,72px)] font-semibold text-zinc-800">
            {chord.title}
          </h1>
        </div>

        <div className="detail-image-frame flex-1 rounded-lg border border-white bg-white/86 p-2 shadow-neo">
          <ChordDiagram
            shape={chord}
            size="large"
            uploadedImageUrl={getUploadedImageUrl(chord.id)}
          />
        </div>
      </div>

      <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
        <ChordImageUploader
          chord={chord}
          uploadedImageUrl={getUploadedImageUrl(chord.id)}
          onUpload={onUploadImage}
          onDelete={onDeleteImage}
        />
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 thin-scrollbar max-[920px]:flex max-[920px]:gap-3 max-[920px]:overflow-x-auto max-[920px]:overflow-y-hidden max-[920px]:pb-1">
          {relatedChords.map((relatedChord) => (
            <div key={relatedChord.id} className="mb-3 max-[920px]:mb-0 max-[920px]:min-w-[180px]">
              <ChordCard
                chord={relatedChord}
                uploadedImageUrl={getUploadedImageUrl(relatedChord.id)}
                onSelect={() => onSelectChord(relatedChord.id)}
              />
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

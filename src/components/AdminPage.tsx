import { ArrowLeft, Database, ImagePlus } from "lucide-react";
import type { ChordShape } from "../data/chordTypes";
import { qualityById } from "../data/chordQualities";
import { getChordDisplayTitle } from "../lib/chordDisplay";
import { ChordDiagram } from "./ChordDiagram";
import { ChordImageUploader } from "./ChordImageUploader";

interface AdminPageProps {
  chords: readonly ChordShape[];
  getUploadedImageUrl: (chordId: string) => string | undefined;
  onUploadImage: (chordId: string, file: File) => Promise<void>;
  onDeleteImage: (chordId: string) => Promise<void>;
  onBack: () => void;
}

export function AdminPage({
  chords,
  getUploadedImageUrl,
  onUploadImage,
  onDeleteImage,
  onBack,
}: AdminPageProps) {
  const uploadedCount = chords.filter((chord) => getUploadedImageUrl(chord.id)).length;

  return (
    <section className="screen-panel px-[clamp(24px,5vw,84px)] pb-[clamp(28px,5vh,72px)]">
      <div className="admin-page-shell mx-auto w-full max-w-[1280px]">
        <div className="admin-page-header">
          <button
            type="button"
            onClick={onBack}
            className="module-back-button inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-rose-100 bg-white px-4 font-bold text-stone-500 shadow-neumorphic transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
            aria-label="이전 화면으로 돌아가기"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            뒤로
          </button>

          <div className="min-w-0">
            <h1 className="font-display text-3xl font-extrabold text-stone-800 sm:text-4xl">
              관리자 페이지
            </h1>
            <p className="mt-1 text-sm font-semibold text-stone-400">
              코드별 원본 이미지 업로드와 삭제를 관리합니다.
            </p>
          </div>

          <div className="admin-page-stats">
            <span>
              <Database size={16} aria-hidden="true" />
              {chords.length} codes
            </span>
            <span>
              <ImagePlus size={16} aria-hidden="true" />
              {uploadedCount} uploaded
            </span>
          </div>
        </div>

        <div className="admin-card-grid">
          {chords.map((chord) => {
            const quality = qualityById[chord.quality];
            const uploadedImageUrl = getUploadedImageUrl(chord.id);

            return (
              <article
                key={chord.id}
                className="admin-chord-card"
                style={{ borderTopColor: quality.color }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-extrabold text-stone-800">
                      {getChordDisplayTitle(chord)}
                    </h2>
                    <p className="text-xs font-bold" style={{ color: quality.color }}>
                      {quality.label}
                    </p>
                  </div>
                  <span className="rounded-full px-2 py-1 text-xs font-extrabold text-stone-400">
                    {uploadedImageUrl ? "local" : "static"}
                  </span>
                </div>

                <div className="admin-diagram-preview">
                  <ChordDiagram
                    shape={chord}
                    size="thumb"
                    uploadedImageUrl={uploadedImageUrl}
                  />
                </div>

                <ChordImageUploader
                  chord={chord}
                  uploadedImageUrl={uploadedImageUrl}
                  onUpload={onUploadImage}
                  onDelete={onDeleteImage}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

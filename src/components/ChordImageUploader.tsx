import { ChangeEvent, useEffect, useId, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import type { ChordShape } from "../data/chordTypes";
import {
  ACCEPTED_IMAGE_TYPES,
  getImageFileValidationError,
} from "../lib/chordImageStorage";

interface ChordImageUploaderProps {
  chord: ChordShape;
  uploadedImageUrl?: string;
  onUpload: (chordId: string, file: File) => Promise<void>;
  onDelete: (chordId: string) => Promise<void>;
}

export function ChordImageUploader({
  chord,
  uploadedImageUrl,
  onUpload,
  onDelete,
}: ChordImageUploaderProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      return;
    }

    const validationError = getImageFileValidationError(nextFile);
    if (validationError) {
      setMessage(validationError);
      setFile(null);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setMessage(nextFile.name);
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    setPending(true);
    try {
      await onUpload(chord.id, file);
      setFile(null);
      setMessage("저장됨");
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "저장 실패");
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    setPending(true);
    try {
      await onDelete(chord.id);
      setFile(null);
      setMessage("삭제됨");
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "삭제 실패");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-lg border border-white bg-white/88 p-3 shadow-neo">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-display text-sm font-semibold text-zinc-600">{chord.title}</span>
        {uploadedImageUrl ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-pink-100 bg-white text-pink-400 shadow-neo-inset transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Delete uploaded image"
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="mb-2 aspect-[4/3] overflow-hidden rounded-lg bg-zinc-50">
        {previewUrl || uploadedImageUrl ? (
          <img
            src={previewUrl ?? uploadedImageUrl}
            alt={`${chord.title} 업로드 미리보기`}
            className="chord-image h-full w-full p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-pink-300">
            <ImagePlus size={28} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <label
          htmlFor={inputId}
          className="flex h-9 flex-1 items-center justify-center rounded-full border border-pink-100 bg-white px-3 text-sm font-semibold text-pink-400 shadow-neo-inset transition hover:scale-[1.02]"
        >
          선택
        </label>
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          onChange={handleChange}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || pending}
          className="flex h-9 w-11 items-center justify-center rounded-full border border-pink-100 bg-white text-pink-400 shadow-neo-inset transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-200 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Save uploaded image"
        >
          <Save size={17} aria-hidden="true" />
        </button>
      </div>

      {message ? <p className="mt-2 truncate text-xs font-medium text-zinc-400">{message}</p> : null}
    </div>
  );
}

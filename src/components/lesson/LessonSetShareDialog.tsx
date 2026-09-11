import "../../styles/phase7.css";
import { useId, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { copyTextToClipboard } from "../../lib/clipboard";
import type { LessonSet } from "../../lessonSets/types";
import { useLessonDialogFocus } from "./AddToLessonSetDialog";

export interface LessonSetShareDialogProps {
  lessonSet: LessonSet;
  shareUrl: string;
  onClose: () => void;
}

export function LessonSetShareDialog({
  lessonSet,
  shareUrl,
  onClose,
}: LessonSetShareDialogProps) {
  const [copyStatus, setCopyStatus] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const copyAttemptRef = useRef(0);
  const headingId = useId();
  const descriptionId = useId();

  useLessonDialogFocus(dialogRef, copyButtonRef, onClose);

  const handleCopy = () => {
    // Start the permission-sensitive clipboard request synchronously inside
    // the trusted click event. State updates happen only after it has begun.
    const copyAttempt = copyTextToClipboard(shareUrl);
    const attemptId = copyAttemptRef.current + 1;
    copyAttemptRef.current = attemptId;
    setCopyStatus("링크를 복사하는 중입니다.");

    void copyAttempt.then(
      (method) => {
        if (copyAttemptRef.current !== attemptId) return;
        setCopyStatus(
          method
            ? `‘${lessonSet.title}’ 수업 세트 링크를 복사했습니다.`
            : "링크를 복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.",
        );
      },
      () => {
        if (copyAttemptRef.current !== attemptId) return;
        setCopyStatus("링크를 복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.");
      },
    );
  };

  return (
    <div
      className="lesson-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="lesson-dialog lesson-share-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="lesson-dialog-header">
          <div className="lesson-dialog-heading-copy">
            <p className="lesson-dialog-eyebrow">세트 공유</p>
            <h2 id={headingId}>{lessonSet.title}</h2>
          </div>
          <button
            type="button"
            className="lesson-dialog-close"
            aria-label="수업 세트 공유 창 닫기"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <p id={descriptionId} className="lesson-dialog-description">
          학생이 QR 코드를 스캔하거나 아래 링크를 열면 이 세트를 가져올 수 있습니다.
        </p>

        <div className="lesson-share-qr">
          <QRCodeSVG
            value={shareUrl}
            size={208}
            level="M"
            marginSize={4}
            role="img"
            title={`${lessonSet.title} 수업 세트 공유 QR 코드`}
          />
        </div>

        <output className="lesson-share-url" aria-label="수업 세트 공유 링크">
          {shareUrl}
        </output>

        <div className="lesson-share-actions">
          <button
            ref={copyButtonRef}
            type="button"
            className="lesson-share-copy-button"
            onClick={handleCopy}
          >
            링크 복사
          </button>
          <a
            className="lesson-share-open-link"
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
          >
            링크 열기
          </a>
        </div>

        <p
          className="lesson-share-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {copyStatus}
        </p>
      </section>
    </div>
  );
}

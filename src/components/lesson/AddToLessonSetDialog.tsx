import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from "react";
import type { Chord } from "../../data/types";
import { getChordDisplayTitle } from "../../lib/chordDisplay";
import type { LessonSet } from "../../lessonSets/types";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useLessonDialogFocus(
  dialogRef: RefObject<HTMLElement>,
  initialFocusRef: RefObject<HTMLElement>,
  onClose: () => void,
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => initialFocusRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.requestAnimationFrame(() => opener?.focus({ preventScroll: true }));
    };
  }, [dialogRef, initialFocusRef]);
}

export interface AddToLessonSetDialogProps {
  chord: Chord;
  lessonSets: readonly LessonSet[];
  onAdd: (setId: string) => void;
  onCreateAndAdd: (title: string) => void;
  onClose: () => void;
}

export function AddToLessonSetDialog({
  chord,
  lessonSets,
  onAdd,
  onCreateAndAdd,
  onClose,
}: AddToLessonSetDialogProps) {
  const [title, setTitle] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstSetButtonRef = useRef<HTMLButtonElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const descriptionId = useId();
  const titleInputId = useId();
  const firstAvailableSetIndex = lessonSets.findIndex(
    (lessonSet) => !lessonSet.chordIds.includes(chord.id),
  );
  const initialFocusRef = firstAvailableSetIndex >= 0 ? firstSetButtonRef : titleInputRef;
  const chordTitle = getChordDisplayTitle(chord);

  useLessonDialogFocus(dialogRef, initialFocusRef, onClose);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onCreateAndAdd(trimmedTitle);
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
        className="lesson-dialog lesson-add-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="lesson-dialog-header">
          <div className="lesson-dialog-heading-copy">
            <p className="lesson-dialog-eyebrow">수업 세트</p>
            <h2 id={headingId}>{chordTitle} 코드 추가</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="lesson-dialog-close"
            aria-label="수업 세트 선택 창 닫기"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <p id={descriptionId} className="lesson-dialog-description">
          코드를 담을 기존 세트를 선택하거나 새 세트를 만드세요.
        </p>

        {lessonSets.length > 0 ? (
          <ul className="lesson-add-set-list" aria-label="추가할 수업 세트">
            {lessonSets.map((lessonSet, index) => {
              const alreadyIncluded = lessonSet.chordIds.includes(chord.id);
              return (
                <li key={lessonSet.id} className="lesson-add-set-item">
                  <button
                    ref={index === firstAvailableSetIndex ? firstSetButtonRef : undefined}
                    type="button"
                    className="lesson-add-set-button"
                    disabled={alreadyIncluded}
                    onClick={() => onAdd(lessonSet.id)}
                  >
                    <span className="lesson-add-set-title">{lessonSet.title}</span>
                    <span className="lesson-add-set-count">
                      {alreadyIncluded ? "이미 포함됨" : `${lessonSet.chordIds.length}개 코드`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="lesson-add-empty">아직 만든 수업 세트가 없습니다.</p>
        )}

        <form className="lesson-add-create-form" onSubmit={handleCreate}>
          <label htmlFor={titleInputId}>새 세트 이름</label>
          <div className="lesson-add-create-row">
            <input
              ref={titleInputRef}
              id={titleInputId}
              value={title}
              maxLength={80}
              autoComplete="off"
              placeholder="예: 1주차 - 3코드 곡"
              onChange={(event) => setTitle(event.target.value)}
            />
            <button type="submit" disabled={!title.trim()}>
              만들고 추가
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

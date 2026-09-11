import { BookOpenCheck, CalendarDays, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import type { LessonSet } from "../../lessonSets/types";

interface LessonSetListPageProps {
  lessonSets: readonly LessonSet[];
  onCreate: (title: string) => void;
  onOpen: (lessonSetId: string) => void;
  onDelete: (lessonSetId: string) => void;
  onBack: () => void;
}

function formatCreatedAt(createdAt: number): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(createdAt));
  } catch {
    return "날짜 정보 없음";
  }
}

export function LessonSetListPage({
  lessonSets,
  onCreate,
  onOpen,
  onDelete,
  onBack,
}: LessonSetListPageProps) {
  const [title, setTitle] = useState("");
  const inputId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const setButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingDeleteFocusRef = useRef<string | "create" | null>(null);

  useLayoutEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useLayoutEffect(() => {
    const focusTarget = pendingDeleteFocusRef.current;
    if (!focusTarget) return;
    pendingDeleteFocusRef.current = null;
    if (focusTarget === "create") inputRef.current?.focus({ preventScroll: true });
    else setButtonRefs.current.get(focusTarget)?.focus({ preventScroll: true });
  }, [lessonSets]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    onCreate(title);
    setTitle("");
  };

  return (
    <section className="lesson-page lesson-set-list-page" aria-labelledby="lesson-set-list-title">
      <div className="lesson-page-toolbar">
        <button type="button" className="module-back-button" onClick={onBack}>
          코드 보기
        </button>
        <div>
          <p className="lesson-eyebrow">강사용 수업 도구</p>
          <h1 ref={headingRef} id="lesson-set-list-title" tabIndex={-1}>수업 세트</h1>
        </div>
      </div>

      <form className="lesson-create-form" onSubmit={handleSubmit}>
        <label htmlFor={inputId}>새 세트 이름</label>
        <div>
          <input
            ref={inputRef}
            id={inputId}
            value={title}
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 1주차 - 3코드 곡"
          />
          <button type="submit" disabled={!title.trim()}>
            <Plus size={18} aria-hidden="true" />
            만들기
          </button>
        </div>
      </form>

      <div className="lesson-set-list-scroll">
        {lessonSets.length === 0 ? (
          <div className="lesson-empty-state">
            <BookOpenCheck size={44} aria-hidden="true" />
            <h2>첫 수업 세트를 만들어 보세요</h2>
            <p>갤러리 카드도 길게 누르면 원하는 세트에 바로 담을 수 있습니다.</p>
          </div>
        ) : (
          <ul className="lesson-set-list" aria-label={`수업 세트 ${lessonSets.length}개`}>
            {lessonSets.map((lessonSet, index) => (
              <li key={lessonSet.id} className="lesson-set-card">
                <button
                  type="button"
                  className="lesson-set-open-button"
                  ref={(button) => {
                    if (button) setButtonRefs.current.set(lessonSet.id, button);
                    else setButtonRefs.current.delete(lessonSet.id);
                  }}
                  onClick={() => onOpen(lessonSet.id)}
                >
                  <span className="lesson-set-card-icon" aria-hidden="true">
                    <BookOpenCheck size={24} />
                  </span>
                  <span className="lesson-set-card-copy">
                    <strong>{lessonSet.title}</strong>
                    <span>{lessonSet.chordIds.length}개 코드</span>
                    <span className="lesson-set-card-date">
                      <CalendarDays size={14} aria-hidden="true" />
                      {formatCreatedAt(lessonSet.createdAt)}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="lesson-set-delete-button"
                  aria-label={`${lessonSet.title} 세트 삭제`}
                  onClick={() => {
                    if (window.confirm(`‘${lessonSet.title}’ 세트를 삭제할까요?`)) {
                      pendingDeleteFocusRef.current = lessonSets[index + 1]?.id
                        ?? lessonSets[index - 1]?.id
                        ?? "create";
                      onDelete(lessonSet.id);
                    }
                  }}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

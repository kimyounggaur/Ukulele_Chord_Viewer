import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FileDown, Play, Save, Share2, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import type { Chord } from "../../data/types";
import type { LessonSet } from "../../lessonSets/types";
import { SortableChordItem } from "./SortableChordItem";

interface LessonSetEditorPageProps {
  lessonSet: LessonSet;
  chords: readonly Chord[];
  onBack: () => void;
  onRename: (title: string) => void;
  onUpdateNote: (note: string) => void;
  onMoveChord: (fromIndex: number, toIndex: number) => void;
  onRemoveChord: (chordId: string) => void;
  onPlay: () => void;
  onShare: (opener: HTMLButtonElement) => void;
  onPrint: () => void;
  onQuiz: () => void;
  onDelete: () => void;
}

export function LessonSetEditorPage({
  lessonSet,
  chords,
  onBack,
  onRename,
  onUpdateNote,
  onMoveChord,
  onRemoveChord,
  onPlay,
  onShare,
  onPrint,
  onQuiz,
  onDelete,
}: LessonSetEditorPageProps) {
  const [title, setTitle] = useState(lessonSet.title);
  const [note, setNote] = useState(lessonSet.note ?? "");
  const [announcement, setAnnouncement] = useState("");
  const titleId = useId();
  const noteId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const orderHeadingRef = useRef<HTMLHeadingElement>(null);
  const chordFocusRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingRemoveFocusRef = useRef<string | "heading" | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setTitle(lessonSet.title);
    setNote(lessonSet.note ?? "");
  }, [lessonSet.id, lessonSet.note, lessonSet.title]);

  useLayoutEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [lessonSet.id]);

  useLayoutEffect(() => {
    const target = pendingRemoveFocusRef.current;
    if (!target) return;
    pendingRemoveFocusRef.current = null;
    if (target === "heading") orderHeadingRef.current?.focus({ preventScroll: true });
    else chordFocusRefs.current.get(target)?.focus({ preventScroll: true });
  }, [chords]);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onRename(title);
    onUpdateNote(note);
    setAnnouncement("세트 정보를 저장했습니다.");
  };

  const handleDragStart = (event: DragStartEvent) => {
    const index = chords.findIndex((chord) => chord.id === event.active.id);
    if (index >= 0) setAnnouncement(`${chords[index].displayName} 코드 이동 시작`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const fromIndex = chords.findIndex((chord) => chord.id === event.active.id);
    const toIndex = chords.findIndex((chord) => chord.id === event.over?.id);
    if (fromIndex < 0 || toIndex < 0) return;
    onMoveChord(fromIndex, toIndex);
    setAnnouncement(`${chords[fromIndex].displayName} 코드를 ${toIndex + 1}번째로 이동했습니다.`);
  };

  const handleRemoveChord = (chordId: string) => {
    const index = chords.findIndex((chord) => chord.id === chordId);
    pendingRemoveFocusRef.current = chords[index + 1]?.id ?? chords[index - 1]?.id ?? "heading";
    onRemoveChord(chordId);
    setAnnouncement(`${chords[index]?.displayName ?? "코드"}를 세트에서 제거했습니다.`);
  };

  return (
    <section className="lesson-page lesson-set-editor" aria-labelledby="lesson-editor-heading">
      <div className="lesson-page-toolbar lesson-editor-toolbar">
        <button type="button" className="module-back-button" onClick={onBack}>
          세트 목록
        </button>
        <div>
          <p className="lesson-eyebrow">수업 세트 편집</p>
          <h1 ref={headingRef} id="lesson-editor-heading" tabIndex={-1}>{lessonSet.title}</h1>
        </div>
        <div className="lesson-editor-primary-actions">
          <button type="button" onClick={onPlay} disabled={chords.length === 0}>
            <Play size={18} aria-hidden="true" /> 재생
          </button>
          <button type="button" onClick={onQuiz} disabled={chords.length === 0}>
            <Sparkles size={18} aria-hidden="true" /> 퀴즈
          </button>
          <button type="button" onClick={(event) => onShare(event.currentTarget)}>
            <Share2 size={18} aria-hidden="true" /> 공유
          </button>
          <button type="button" onClick={onPrint} disabled={chords.length === 0}>
            <FileDown size={18} aria-hidden="true" /> 인쇄
          </button>
        </div>
      </div>

      <div className="lesson-editor-body">
        <form className="lesson-set-meta-form" onSubmit={handleSave}>
          <label htmlFor={titleId}>세트 이름</label>
          <input
            id={titleId}
            value={title}
            maxLength={80}
            required
            onChange={(event) => setTitle(event.target.value)}
          />
          <label htmlFor={noteId}>강사 메모</label>
          <textarea
            id={noteId}
            value={note}
            maxLength={2000}
            rows={4}
            placeholder="수업 흐름이나 주의할 운지를 적어두세요."
            onChange={(event) => setNote(event.target.value)}
          />
          <button type="submit" className="lesson-save-button" disabled={!title.trim()}>
            <Save size={17} aria-hidden="true" /> 정보 저장
          </button>
          <button
            type="button"
            className="lesson-danger-button"
            onClick={() => {
              if (window.confirm(`‘${lessonSet.title}’ 세트를 삭제할까요?`)) onDelete();
            }}
          >
            <Trash2 size={17} aria-hidden="true" /> 세트 삭제
          </button>
        </form>

        <div className="lesson-chord-order-panel">
          <div className="lesson-section-heading">
            <div>
              <h2 ref={orderHeadingRef} tabIndex={-1}>코드 순서</h2>
              <p>손잡이를 끌거나 화살표 버튼으로 수업 순서를 바꾸세요.</p>
            </div>
            <span>{chords.length}개</span>
          </div>
          {chords.length === 0 ? (
            <div className="lesson-empty-state compact">
              <h3>아직 코드가 없습니다</h3>
              <p>코드 갤러리에서 카드를 길게 눌러 이 세트에 추가하세요.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={chords.map((chord) => chord.id)} strategy={verticalListSortingStrategy}>
                <ol className="lesson-sortable-list">
                  {chords.map((chord, index) => (
                    <SortableChordItem
                      key={chord.id}
                      chord={chord}
                      index={index}
                      count={chords.length}
                      onMove={onMoveChord}
                      onRemove={handleRemoveChord}
                      focusTargetRef={(button) => {
                        if (button) chordFocusRefs.current.set(chord.id, button);
                        else chordFocusRefs.current.delete(chord.id);
                      }}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    </section>
  );
}

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useChordAudio } from "../../audio/ChordAudioProvider";
import type { Chord } from "../../data/types";
import { getChordDisplayTitle } from "../../lib/chordDisplay";
import type { LessonSet } from "../../lessonSets/types";
import { ChordDiagram } from "../ChordDiagram";

type AutoAdvanceSeconds = 0 | 3 | 5 | 10;

export interface LessonSlideshowPageProps {
  set: LessonSet;
  chords: readonly Chord[];
  onExit: () => void;
}

interface PointerStart {
  id: number;
  x: number;
  y: number;
}

const SWIPE_THRESHOLD_PX = 50;

function parseAutoAdvanceSeconds(value: string): AutoAdvanceSeconds {
  if (value === "3") return 3;
  if (value === "5") return 5;
  if (value === "10") return 10;
  return 0;
}

function isKeyboardInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(
    target.closest("button, a, input, select, textarea, [contenteditable='true']"),
  );
}

function isPointerControlTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(
    target.closest("[data-slide-control='true'], a, input, select, textarea, [contenteditable='true']"),
  );
}

export function LessonSlideshowPage({ set, chords, onExit }: LessonSlideshowPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<AutoAdvanceSeconds>(0);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const pointerStartRef = useRef<PointerStart | null>(null);
  const swipeHandledRef = useRef(false);
  const swipeResetTimerRef = useRef<number | null>(null);
  const exitingRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sawFullscreenRef = useRef(Boolean(document.fullscreenElement));
  const { available: audioAvailable, playChord } = useChordAudio();

  const total = chords.length;
  const safeIndex = total === 0 ? 0 : Math.min(currentIndex, total - 1);
  const currentChord = chords[safeIndex];

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [completed, safeIndex]);

  const goPrevious = useCallback(() => {
    if (total === 0) return;
    if (completed) {
      setCompleted(false);
      setCurrentIndex(total - 1);
      return;
    }
    setCurrentIndex((index) => Math.max(0, Math.min(index, total - 1) - 1));
  }, [completed, total]);

  const goNext = useCallback(() => {
    if (total === 0 || completed) return;
    if (safeIndex >= total - 1) {
      setCompleted(true);
      return;
    }
    setCurrentIndex(safeIndex + 1);
  }, [completed, safeIndex, total]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setCompleted(false);
  }, []);

  const exitSlideshow = useCallback(async () => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // The route still needs to close when the browser refuses fullscreen exit.
    } finally {
      onExit();
    }
  }, [onExit]);

  useEffect(() => {
    const handleVisibilityChange = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (
      autoAdvanceSeconds === 0 ||
      !documentVisible ||
      document.hidden ||
      completed ||
      !currentChord
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!document.hidden) goNext();
    }, autoAdvanceSeconds * 1000);

    return () => window.clearTimeout(timer);
  }, [autoAdvanceSeconds, completed, currentChord, documentVisible, goNext]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        sawFullscreenRef.current = true;
      } else if (sawFullscreenRef.current) {
        void exitSlideshow();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [exitSlideshow]);

  useEffect(() => () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    } catch {
      // The next route must still render if fullscreen teardown is unavailable.
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        event.preventDefault();
        void exitSlideshow();
        return;
      }

      if (isKeyboardInteractiveTarget(event.target)) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.code === "Space" && currentChord && !completed && audioAvailable) {
        event.preventDefault();
        void playChord(currentChord, "strum");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [audioAvailable, completed, currentChord, exitSlideshow, goNext, goPrevious, playChord]);

  useEffect(
    () => () => {
      if (swipeResetTimerRef.current !== null) {
        window.clearTimeout(swipeResetTimerRef.current);
      }
    },
    [],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || isPointerControlTarget(event.target)) return;
    pointerStartRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || start.id !== event.pointerId) return;

    const horizontalDistance = event.clientX - start.x;
    const verticalDistance = event.clientY - start.y;
    if (
      Math.abs(horizontalDistance) < SWIPE_THRESHOLD_PX ||
      Math.abs(horizontalDistance) <= Math.abs(verticalDistance)
    ) {
      return;
    }

    swipeHandledRef.current = true;
    if (horizontalDistance < 0) goNext();
    else goPrevious();

    if (swipeResetTimerRef.current !== null) window.clearTimeout(swipeResetTimerRef.current);
    swipeResetTimerRef.current = window.setTimeout(() => {
      swipeHandledRef.current = false;
      swipeResetTimerRef.current = null;
    }, 0);
  };

  const handleZoneClick = (direction: "previous" | "next") => {
    if (swipeHandledRef.current) {
      swipeHandledRef.current = false;
      return;
    }
    if (direction === "previous") goPrevious();
    else goNext();
  };

  if (!currentChord) {
    return (
      <section
        className="lesson-slideshow-screen lesson-slideshow-immersive"
        data-immersive="true"
        aria-labelledby="lesson-slideshow-empty-title"
      >
        <div className="lesson-slideshow-empty">
          <h1 ref={headingRef} id="lesson-slideshow-empty-title" tabIndex={-1}>슬라이드에 코드가 없습니다</h1>
          <p>{set.title} 세트에 코드를 추가한 뒤 다시 시작해 주세요.</p>
          <button type="button" onClick={() => void exitSlideshow()}>나가기</button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="lesson-slideshow-screen lesson-slideshow-immersive"
      data-immersive="true"
      aria-label={`${set.title} 수업 슬라이드`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
    >
      {completed ? (
        <div className="lesson-slideshow-complete">
          <p className="lesson-slideshow-set-title">{set.title}</p>
          <h1 ref={headingRef} tabIndex={-1}>수업 세트 완료</h1>
          <p>{total}개 코드를 모두 확인했습니다.</p>
          <div className="lesson-slideshow-complete-actions">
            <button type="button" data-slide-control="true" onClick={restart}>처음부터</button>
            <button type="button" data-slide-control="true" onClick={() => void exitSlideshow()}>나가기</button>
          </div>
        </div>
      ) : (
        <div className="lesson-slideshow-stage">
          <p className="lesson-slideshow-set-title">{set.title}</p>
          <h1 ref={headingRef} tabIndex={-1} className="lesson-slideshow-chord-name">{getChordDisplayTitle(currentChord)}</h1>
          <div className="lesson-slideshow-diagram">
            <ChordDiagram chord={currentChord} size="lg" priority />
          </div>
          <div className="lesson-slideshow-hit-zones" role="group" aria-label="슬라이드 이동">
            <button
              type="button"
              className="lesson-slideshow-hit-zone is-previous"
              aria-label="이전 코드"
              aria-disabled={safeIndex === 0}
              aria-keyshortcuts="ArrowLeft"
              onClick={() => handleZoneClick("previous")}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className="lesson-slideshow-hit-zone is-next"
              aria-label={safeIndex === total - 1 ? "수업 세트 완료" : "다음 코드"}
              aria-keyshortcuts="ArrowRight"
              onClick={() => handleZoneClick("next")}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      <div className="lesson-slideshow-toolbar" data-slide-control="true">
        <label>
          자동 넘김
          <select
            value={autoAdvanceSeconds}
            onChange={(event) => {
              setAutoAdvanceSeconds(parseAutoAdvanceSeconds(event.target.value));
            }}
          >
            <option value={0}>끔</option>
            <option value={3}>3초</option>
            <option value={5}>5초</option>
            <option value={10}>10초</option>
          </select>
        </label>
        <button
          type="button"
          disabled={!audioAvailable || completed}
          aria-label={`${getChordDisplayTitle(currentChord)} 코드 소리 재생`}
          aria-keyshortcuts="Space"
          onClick={() => {
            if (!completed) void playChord(currentChord, "strum");
          }}
        >
          코드 소리 재생
        </button>
        <button type="button" aria-keyshortcuts="Escape" onClick={() => void exitSlideshow()}>
          나가기
        </button>
      </div>

      <output className="lesson-slideshow-progress" aria-live="polite" aria-atomic="true">
        {completed ? `${total} / ${total} · 완료` : `${safeIndex + 1} / ${total}`}
      </output>
    </section>
  );
}

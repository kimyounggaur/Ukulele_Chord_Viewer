import { useEffect, useId, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { Volume2 } from "lucide-react";
import type { Chord } from "../data/types";
import { useChordAudio } from "../audio/ChordAudioProvider";
import { unlockAudio } from "../audio/engine";

interface ChordPlayButtonProps {
  chord: Chord;
  compact?: boolean;
  className?: string;
  tabIndex?: number;
}

const LONG_PRESS_MS = 500;

export function ChordPlayButton({ chord, compact = false, className = "", tabIndex }: ChordPlayButtonProps) {
  const { available, playChord, playingChordId } = useChordAudio();
  const timerRef = useRef<number | null>(null);
  const longPressRef = useRef(false);
  const isPlaying = playingChordId === chord.id;
  const helpId = useId();

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!available || event.button !== 0) return;
    event.stopPropagation();
    longPressRef.current = false;
    // Unlock inside the trusted gesture so the delayed long-press playback also works on iOS Safari.
    void unlockAudio().catch(() => undefined);
    event.currentTarget.setPointerCapture(event.pointerId);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      longPressRef.current = true;
      void playChord(chord, "arpeggio");
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!available || event.button !== 0) return;
    const wasLongPress = longPressRef.current;
    clearTimer();
    if (!wasLongPress) void playChord(chord, "strum");
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    clearTimer();
  };

  useEffect(() => clearTimer, []);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    // Pointer interaction is handled on pointerup so a keyboard-generated click is the only one handled here.
    if (available && event.detail === 0) void playChord(chord, "strum");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!available || !event.shiftKey || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    void playChord(chord, "arpeggio");
  };

  return (
    <button
      type="button"
      data-chord-audio="true"
      className={[
        "chord-play-button",
        compact ? "is-compact" : "is-large",
        isPlaying ? "is-playing" : "",
        className,
      ].join(" ")}
      aria-label={`${chord.displayName} 코드 소리 듣기`}
      aria-describedby={helpId}
      data-playing={isPlaying || undefined}
      title={available ? "짧게 누르면 스트럼, 길게 누르면 아르페지오" : "이 브라우저는 오디오를 지원하지 않습니다"}
      aria-disabled={!available}
      tabIndex={tabIndex}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(event) => event.preventDefault()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <Volume2 aria-hidden="true" size={compact ? 17 : 22} />
      {!compact ? <span>{isPlaying ? "재생 중" : "소리 듣기"}</span> : null}
      <span id={helpId} className="sr-only">
        짧게 누르거나 Enter를 누르면 스트럼, 0.5초 이상 길게 누르거나 Shift+Enter를 누르면 아르페지오로 재생합니다.
      </span>
    </button>
  );
}

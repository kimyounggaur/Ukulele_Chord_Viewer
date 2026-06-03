import { useEffect, useRef } from "react";

const CLICK_SOUND_SELECTOR = [
  "button",
  "label[for]",
  ".chord-card",
  ".related-chord-card",
  ".quality-bubble",
].join(",");

type AudioContextConstructor = typeof AudioContext;

interface AudioWindow extends Window {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
}

function isDisabledTarget(target: Element) {
  const button = target.closest("button");
  return button instanceof HTMLButtonElement && button.disabled;
}

function createAudioContext() {
  const audioWindow = window as AudioWindow;
  const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

export function useClickSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedAtRef = useRef(0);

  useEffect(() => {
    const playPop = () => {
      if (typeof window === "undefined") {
        return;
      }

      const now = performance.now();
      if (now - lastPlayedAtRef.current < 45) {
        return;
      }
      lastPlayedAtRef.current = now;

      const context = audioContextRef.current ?? createAudioContext();
      if (!context) {
        return;
      }
      audioContextRef.current = context;

      if (context.state === "suspended") {
        void context.resume();
      }

      const startAt = context.currentTime;
      const popOscillator = context.createOscillator();
      const sparkleOscillator = context.createOscillator();
      const popGain = context.createGain();
      const sparkleGain = context.createGain();
      const filter = context.createBiquadFilter();

      popOscillator.type = "triangle";
      sparkleOscillator.type = "sine";
      filter.type = "highpass";
      filter.frequency.setValueAtTime(520, startAt);

      popOscillator.frequency.setValueAtTime(520, startAt);
      popOscillator.frequency.exponentialRampToValueAtTime(860, startAt + 0.055);
      popOscillator.frequency.exponentialRampToValueAtTime(610, startAt + 0.12);

      sparkleOscillator.frequency.setValueAtTime(1180, startAt);
      sparkleOscillator.frequency.exponentialRampToValueAtTime(1680, startAt + 0.07);

      popGain.gain.setValueAtTime(0.0001, startAt);
      popGain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.012);
      popGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);

      sparkleGain.gain.setValueAtTime(0.0001, startAt);
      sparkleGain.gain.exponentialRampToValueAtTime(0.065, startAt + 0.018);
      sparkleGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.115);

      popOscillator.connect(popGain);
      sparkleOscillator.connect(sparkleGain);
      popGain.connect(filter);
      sparkleGain.connect(filter);
      filter.connect(context.destination);

      popOscillator.start(startAt);
      sparkleOscillator.start(startAt + 0.012);
      popOscillator.stop(startAt + 0.18);
      sparkleOscillator.stop(startAt + 0.13);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const soundTarget = target.closest(CLICK_SOUND_SELECTOR);
      if (!soundTarget || isDisabledTarget(soundTarget)) {
        return;
      }

      playPop();
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);
}

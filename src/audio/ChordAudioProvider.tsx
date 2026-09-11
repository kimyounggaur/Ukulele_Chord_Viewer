import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Chord } from "../data/types";
import { voicingToMidi } from "./chordToNotes";
import { arpeggio, installAudioUnlock, isAudioSupported, strum } from "./engine";

export type StrumSpeed = "slow" | "normal" | "fast";
export interface ChordAudioSettings {
  lowG: boolean;
  volume: number;
  speed: StrumSpeed;
}

interface ChordAudioValue {
  available: boolean;
  settings: ChordAudioSettings;
  updateSettings: (patch: Partial<ChordAudioSettings>) => void;
  playChord: (chord: Chord, mode?: "strum" | "arpeggio") => Promise<void>;
  playingChordId: string | null;
  activeStrings: number[];
}

const STORAGE_KEY = "ukv.audio";
const DEFAULT_SETTINGS: ChordAudioSettings = { lowG: false, volume: 0.75, speed: "normal" };
const SPEED_SPREAD: Record<StrumSpeed, number> = { slow: 55, normal: 28, fast: 15 };

const ChordAudioContext = createContext<ChordAudioValue | null>(null);

function loadSettings(): ChordAudioSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<ChordAudioSettings> | null;
    if (!parsed) return DEFAULT_SETTINGS;
    return {
      lowG: Boolean(parsed.lowG),
      volume: typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : DEFAULT_SETTINGS.volume,
      speed: parsed.speed === "slow" || parsed.speed === "fast" ? parsed.speed : "normal",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function ChordAudioProvider({ children }: { children: ReactNode }) {
  const [available, setAvailable] = useState(isAudioSupported);
  const [settings, setSettings] = useState(loadSettings);
  const [playingChordId, setPlayingChordId] = useState<string | null>(null);
  const [activeStrings, setActiveStrings] = useState<number[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const visualTimers = useRef<number[]>([]);

  useEffect(() => installAudioUnlock(), []);

  const updateSettings = useCallback((patch: Partial<ChordAudioSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Keep the in-memory preference when storage is unavailable.
      }
      return next;
    });
  }, []);

  const playChord = useCallback(async (chord: Chord, mode: "strum" | "arpeggio" = "strum") => {
    const voicing = chord.voicings[0];
    const notes = voicingToMidi(voicing, settings.lowG);
    if (settings.volume === 0) {
      setAnnouncement(`${chord.displayName} 코드 볼륨이 0%입니다.`);
      setActiveStrings([]);
      setPlayingChordId(null);
      return;
    }
    const playedIndices = voicing.frets
      .map((fret, index) => ({ fret, index }))
      .filter(({ fret }) => fret >= 0)
      .map(({ index }) => index);
    const interval = mode === "arpeggio" ? 220 : SPEED_SPREAD[settings.speed];

    visualTimers.current.forEach(window.clearTimeout);
    visualTimers.current = [];
    setPlayingChordId(chord.id);
    setAnnouncement(chord.displayName + (mode === "arpeggio" ? " 아르페지오 재생" : " 코드 재생"));
    playedIndices.forEach((stringIndex, order) => {
      visualTimers.current.push(window.setTimeout(() => setActiveStrings([stringIndex]), interval * order));
    });
    visualTimers.current.push(
      window.setTimeout(() => {
        setActiveStrings([]);
        setPlayingChordId(null);
      }, interval * playedIndices.length + 420),
    );

    try {
      const gain = settings.volume * 0.26;
      if (mode === "arpeggio") await arpeggio(notes, 220, gain);
      else await strum(notes, { spreadMs: SPEED_SPREAD[settings.speed], gain });
    } catch {
      setAvailable(false);
      setAnnouncement("이 브라우저에서는 코드 소리를 재생할 수 없습니다.");
      setActiveStrings([]);
      setPlayingChordId(null);
    }
  }, [settings]);

  useEffect(
    () => () => visualTimers.current.forEach(window.clearTimeout),
    [],
  );

  const value = useMemo<ChordAudioValue>(
    () => ({ available, settings, updateSettings, playChord, playingChordId, activeStrings }),
    [activeStrings, available, playChord, playingChordId, settings, updateSettings],
  );

  return (
    <ChordAudioContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
    </ChordAudioContext.Provider>
  );
}

export function useChordAudio(): ChordAudioValue {
  const value = useContext(ChordAudioContext);
  if (!value) throw new Error("useChordAudio는 ChordAudioProvider 안에서 사용해야 합니다.");
  return value;
}

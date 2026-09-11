type AudioContextConstructor = typeof AudioContext;

interface AudioWindow extends Window {
  webkitAudioContext?: AudioContextConstructor;
}

let context: AudioContext | null = null;

export function isAudioSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.AudioContext ?? (window as AudioWindow).webkitAudioContext);
}

export async function unlockAudio(): Promise<AudioContext> {
  if (!isAudioSupported()) throw new Error("이 브라우저는 Web Audio API를 지원하지 않습니다.");
  if (!context) {
    const Constructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Constructor) throw new Error("오디오 장치를 시작할 수 없습니다.");
    context = new Constructor();
  }
  if (context.state === "suspended") await context.resume();
  return context;
}

export function installAudioUnlock(): () => void {
  if (typeof document === "undefined") return () => undefined;
  const unlock = () => {
    void unlockAudio().catch(() => undefined);
  };
  document.addEventListener("pointerup", unlock, { once: true, passive: true });
  document.addEventListener("touchend", unlock, { once: true, passive: true });
  return () => {
    document.removeEventListener("pointerup", unlock);
    document.removeEventListener("touchend", unlock);
  };
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export async function pluck(
  frequency: number,
  delaySec = 0,
  duration = 2.4,
  gain = 0.22,
): Promise<void> {
  const audioContext = await unlockAudio();
  const sampleRate = audioContext.sampleRate;
  const ringLength = Math.max(2, Math.round(sampleRate / frequency));
  const buffer = audioContext.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const output = buffer.getChannelData(0);
  const ring = new Float32Array(ringLength);
  for (let index = 0; index < ringLength; index += 1) {
    ring[index] = Math.random() * 2 - 1;
  }
  let pointer = 0;
  const decay = 0.996;
  for (let index = 0; index < output.length; index += 1) {
    const current = ring[pointer];
    const next = ring[(pointer + 1) % ringLength];
    output[index] = current;
    ring[pointer] = (current + next) * 0.5 * decay;
    pointer = (pointer + 1) % ringLength;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  const gainNode = audioContext.createGain();
  const startAt = audioContext.currentTime + delaySec;
  gainNode.gain.setValueAtTime(Math.max(0.001, gain), startAt);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  source.connect(gainNode).connect(audioContext.destination);
  source.addEventListener("ended", () => {
    source.disconnect();
    gainNode.disconnect();
  }, { once: true });
  source.start(startAt);
}

export async function strum(
  midiNotes: number[],
  options: { direction?: "down" | "up"; spreadMs?: number; gain?: number } = {},
): Promise<void> {
  const {
    direction = "down",
    spreadMs = 28,
    gain = 0.22,
  } = options;
  const ordered = direction === "down" ? midiNotes : [...midiNotes].reverse();
  await unlockAudio();
  ordered.forEach((midi, index) => {
    void pluck(midiToFreq(midi), (spreadMs * index) / 1000, 2.4, gain);
  });
}

export async function arpeggio(
  midiNotes: number[],
  noteMs = 220,
  gain = 0.2,
): Promise<void> {
  await unlockAudio();
  midiNotes.forEach((midi, index) => {
    void pluck(midiToFreq(midi), (noteMs * index) / 1000, 2.2, gain);
  });
}

import type { ChordVoicing } from "../data/types";

const HIGH_G = [67, 60, 64, 69] as const;
const LOW_G = [55, 60, 64, 69] as const;

export function voicingToMidi(voicing: ChordVoicing, lowG = false): number[] {
  const openMidi = lowG ? LOW_G : HIGH_G;
  return voicing.frets.flatMap((fret, index) =>
    fret < 0 ? [] : [openMidi[index] + fret],
  );
}

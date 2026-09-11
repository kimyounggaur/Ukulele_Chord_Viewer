import type { Chord, ChordVoicing } from "../data/types";

const STRING_LABELS = ["4번 G줄", "3번 C줄", "2번 E줄", "1번 A줄"] as const;

function describeString(fret: number, finger: number, index: number): string {
  const label = STRING_LABELS[index];
  if (fret < 0) return `${label} 뮤트`;
  if (fret === 0) return `${label} 개방현`;
  return finger > 0
    ? `${label} ${fret}프렛 ${finger}번 손가락`
    : `${label} ${fret}프렛`;
}

export function describeVoicing(chord: Chord, voicing: ChordVoicing = chord.voicings[0]): string {
  const details = voicing.frets.map((fret, index) => describeString(fret, voicing.fingers[index], index));
  const openCount = voicing.frets.filter((fret) => fret === 0).length;
  const playedDetails = details.filter((_, index) => voicing.frets[index] !== 0);
  const label = voicing.label || "기본형";
  const barre = voicing.barre
    ? `, ${voicing.barre.fret}프렛 ${STRING_LABELS[voicing.barre.from]}부터 ${STRING_LABELS[voicing.barre.to]}까지 바레`
    : "";

  if (openCount === 4) {
    return `${chord.koreanName} ${chord.displayName}, ${label} 코드, 모든 줄 개방현${barre}.`;
  }
  if (openCount > 1 && playedDetails.length === 1) {
    return `${chord.koreanName} ${chord.displayName}, ${label} 코드, ${playedDetails[0]}, 나머지 개방현${barre}.`;
  }
  return `${chord.koreanName} ${chord.displayName}, ${label} 코드, ${details.join(", ")}${barre}.`;
}

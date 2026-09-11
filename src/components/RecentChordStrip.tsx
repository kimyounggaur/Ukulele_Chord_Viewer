import { Clock3 } from "lucide-react";
import type { Chord } from "../data/types";
import { getChordDisplayTitle } from "../lib/chordDisplay";

interface RecentChordStripProps {
  chords: readonly Chord[];
  onSelect: (chordId: string) => void;
}

export function RecentChordStrip({ chords, onSelect }: RecentChordStripProps) {
  if (chords.length === 0) return null;

  return (
    <section className="recent-chords" aria-labelledby="recent-chords-heading">
      <h2 id="recent-chords-heading">
        <Clock3 size={16} aria-hidden="true" /> 최근 본 코드
      </h2>
      <ul className="recent-chords-list thin-scrollbar">
        {chords.map((chord) => (
          <li key={chord.id}>
            <button type="button" onClick={() => onSelect(chord.id)}>
              <strong>{getChordDisplayTitle(chord)}</strong>
              <span>{chord.koreanName}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

import { useId, type CSSProperties } from "react";
import { NOTE_NAMES_SHARP, OPEN_MIDI_HIGH_G } from "../data/theory";
import type { Chord, ChordVoicing, StringIndex } from "../data/types";

interface ChordSvgProps {
  chord: Chord;
  voicing?: ChordVoicing;
  showNotes?: boolean;
  className?: string;
}

const STRING_X = [64, 108, 152, 196] as const;
const FRET_TOP = 78;
const FRET_HEIGHT = 42;

function soundingNote(fret: number, stringIndex: number): string {
  if (fret < 0) return "×";
  return NOTE_NAMES_SHARP[(OPEN_MIDI_HIGH_G[stringIndex] + fret) % 12];
}

function relativeFret(fret: number, baseFret: number): number {
  return baseFret > 1 ? fret - baseFret + 1 : fret;
}

export function ChordSvg({
  chord,
  voicing = chord.voicings[0],
  showNotes = true,
  className,
}: ChordSvgProps) {
  const titleId = useId();
  const descriptionId = useId();
  const lineStyle = { "--diagram-accent": "currentColor" } as CSSProperties;

  return (
    <svg
      viewBox="0 0 260 340"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      className={className}
      style={lineStyle}
    >
      <title id={titleId}>{chord.displayName} 우쿨렐레 코드</title>
      <desc id={descriptionId}>
        4번 G줄부터 1번 A줄 순서의 프렛은 {voicing.frets.join(", ")}입니다.
      </desc>
      <rect className="chord-svg-surface" x="1" y="1" width="258" height="338" rx="22" />

      <g className="chord-svg-grid" strokeLinecap="round">
        {STRING_X.map((x) => (
          <line key={x} x1={x} y1={FRET_TOP} x2={x} y2={FRET_TOP + FRET_HEIGHT * 5} />
        ))}
        {Array.from({ length: 6 }, (_, index) => (
          <line
            key={index}
            x1={STRING_X[0]}
            y1={FRET_TOP + FRET_HEIGHT * index}
            x2={STRING_X[3]}
            y2={FRET_TOP + FRET_HEIGHT * index}
            className={index === 0 && voicing.baseFret === 1 ? "chord-svg-nut" : undefined}
          />
        ))}
      </g>

      {voicing.baseFret > 1 ? (
        <text className="chord-svg-fret-label" x="24" y={FRET_TOP + FRET_HEIGHT * 0.68}>
          {voicing.baseFret}fr
        </text>
      ) : null}

      {voicing.frets.map((fret, index) => {
        if (fret > 0) return null;
        return (
          <g key={`top-${index}`} className="chord-svg-top-mark">
            {fret === 0 ? (
              <circle cx={STRING_X[index]} cy="53" r="10" />
            ) : (
              <>
                <line x1={STRING_X[index] - 8} y1="45" x2={STRING_X[index] + 8} y2="61" />
                <line x1={STRING_X[index] + 8} y1="45" x2={STRING_X[index] - 8} y2="61" />
              </>
            )}
          </g>
        );
      })}

      {voicing.barre ? (
        <Barre voicing={voicing} from={voicing.barre.from} to={voicing.barre.to} />
      ) : null}

      {voicing.frets.map((fret, index) => {
        const displayedFret = relativeFret(fret, voicing.baseFret);
        if (fret <= 0 || displayedFret < 1 || displayedFret > 5) return null;
        const finger = voicing.fingers[index];
        const y = FRET_TOP + (displayedFret - 0.5) * FRET_HEIGHT;
        return (
          <g key={`finger-${index}`} className="chord-svg-finger">
            <circle cx={STRING_X[index]} cy={y} r="15" />
            {finger ? <text x={STRING_X[index]} y={y + 5}>{finger}</text> : null}
          </g>
        );
      })}

      {showNotes ? (
        <g className="chord-svg-notes">
          {voicing.frets.map((fret, index) => (
            <text key={`note-${index}`} x={STRING_X[index]} y="316">
              {soundingNote(fret, index)}
            </text>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

function Barre({
  voicing,
  from,
  to,
}: {
  voicing: ChordVoicing;
  from: StringIndex;
  to: StringIndex;
}) {
  const barre = voicing.barre;
  if (!barre) return null;
  const displayedFret = relativeFret(barre.fret, voicing.baseFret);
  if (displayedFret < 1 || displayedFret > 5) return null;
  const left = Math.min(STRING_X[from], STRING_X[to]) - 15;
  const width = Math.abs(STRING_X[to] - STRING_X[from]) + 30;
  const y = FRET_TOP + (displayedFret - 0.5) * FRET_HEIGHT - 15;
  return <rect className="chord-svg-barre" x={left} y={y} width={width} height="30" rx="15" />;
}

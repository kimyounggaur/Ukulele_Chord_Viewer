import type { ChordShape, UkuleleString } from "../data/chordTypes";
import { UKULELE_TUNING } from "../data/chordTypes";

const STRING_X: Record<UkuleleString, number> = {
  4: 54,
  3: 98,
  2: 142,
  1: 186,
};

interface FretboardProps {
  shape: ChordShape;
  size?: "thumb" | "large";
}

export function Fretboard({ shape, size = "thumb" }: FretboardProps) {
  const fretTop = 72;
  const fretGap = 38;
  const fretLines = Array.from({ length: 5 }, (_, index) => fretTop + index * fretGap);
  const topMarks = UKULELE_TUNING.map((stringInfo) => {
    const position = shape.positions.find((item) => item.string === stringInfo.string);
    return {
      ...stringInfo,
      mark: position?.muted ? "x" : position?.fret === 0 ? "o" : "",
    };
  });

  return (
    <div
      className={[
        "chord-image-frame rounded-lg bg-white",
        size === "large" ? "p-3 shadow-neo" : "p-2 shadow-neo-inset",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 240 300"
        role="img"
        aria-label={`${shape.title} 우쿨렐레 코드 다이어그램`}
        preserveAspectRatio="xMidYMid meet"
        className="max-h-full max-w-full"
      >
        <rect width="240" height="300" rx="8" fill="#ffffff" />
        <text
          x="120"
          y="28"
          textAnchor="middle"
          fontFamily="Poppins, Pretendard, sans-serif"
          fontSize="24"
          fontWeight="700"
          fill="#38323a"
        >
          {shape.title}
        </text>

        {shape.baseFret && shape.baseFret > 1 ? (
          <text
            x="208"
            y="98"
            textAnchor="middle"
            fontFamily="Poppins, Pretendard, sans-serif"
            fontSize="16"
            fill="#8f8790"
          >
            {shape.baseFret}fr
          </text>
        ) : null}

        <g stroke="#3f3a42" strokeLinecap="round">
          {UKULELE_TUNING.map((stringInfo) => (
            <line
              key={stringInfo.string}
              x1={STRING_X[stringInfo.string]}
              y1={fretTop}
              x2={STRING_X[stringInfo.string]}
              y2={fretTop + fretGap * 4}
              strokeWidth="3"
            />
          ))}
          {fretLines.map((lineY, index) => (
            <line
              key={lineY}
              x1="42"
              y1={lineY}
              x2="198"
              y2={lineY}
              strokeWidth={index === 0 && (!shape.baseFret || shape.baseFret === 1) ? 8 : 3}
            />
          ))}
        </g>

        {topMarks.map((item) => (
          <text
            key={item.string}
            x={STRING_X[item.string]}
            y="58"
            textAnchor="middle"
            fontFamily="Poppins, Pretendard, sans-serif"
            fontSize="18"
            fontWeight="600"
            fill="#6d6670"
          >
            {item.mark}
          </text>
        ))}

        {shape.positions
          .filter((position) => !position.muted && position.fret > 0)
          .map((position) => {
            const y = fretTop + (position.fret - 0.5) * fretGap;
            return (
              <g key={`${position.string}-${position.fret}-${position.finger ?? "barre"}`}>
                <circle cx={STRING_X[position.string]} cy={y} r="15" fill="#ff7daf" />
                {position.finger ? (
                  <text
                    x={STRING_X[position.string]}
                    y={y + 6}
                    textAnchor="middle"
                    fontFamily="Poppins, Pretendard, sans-serif"
                    fontSize="16"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {position.finger}
                  </text>
                ) : null}
              </g>
            );
          })}

        {UKULELE_TUNING.map((stringInfo) => (
          <text
            key={stringInfo.label}
            x={STRING_X[stringInfo.string]}
            y="266"
            textAnchor="middle"
            fontFamily="Poppins, Pretendard, sans-serif"
            fontSize="17"
            fontWeight="600"
            fill="#8f8790"
          >
            {stringInfo.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

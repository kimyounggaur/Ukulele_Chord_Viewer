import type { ChordQuality } from "../data/chordQualities";

interface QualityBubbleProps {
  quality: ChordQuality;
  active: boolean;
  onClick: () => void;
}

export function QualityBubble({ quality, active, onClick }: QualityBubbleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "quality-bubble-size rounded-full bg-white font-display font-semibold shadow-neo transition duration-200",
        "flex items-center justify-center text-center focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-200",
        active ? "scale-105 ring-4 ring-white" : "hover:scale-105",
      ].join(" ")}
      style={{
        border: `5px solid ${quality.color}`,
        color: quality.color,
        background: `linear-gradient(145deg, #ffffff, ${quality.softColor})`,
      }}
    >
      <span className="max-w-[82%] text-[clamp(15px,2vh,22px)] leading-tight">{quality.label}</span>
    </button>
  );
}

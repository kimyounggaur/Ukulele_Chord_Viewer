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
        "quality-bubble quality-bubble-size group relative rounded-full bg-white text-center font-display text-[clamp(0.75rem,2.5vw,1.05rem)] font-extrabold shadow-neumorphic transition duration-200",
        "flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100",
        active ? "scale-105 ring-4 ring-white" : "hover:scale-105",
      ].join(" ")}
      style={{
        border: `4px solid ${quality.color}`,
        color: quality.color,
        background: `linear-gradient(145deg, #ffffff, ${quality.softColor})`,
      }}
    >
      <span className="max-w-[82%] leading-tight">{quality.label}</span>
    </button>
  );
}

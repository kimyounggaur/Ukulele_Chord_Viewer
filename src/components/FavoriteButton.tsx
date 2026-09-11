import { Star } from "lucide-react";

interface FavoriteButtonProps {
  chordName: string;
  active: boolean;
  onToggle: () => void;
  compact?: boolean;
  tabIndex?: number;
  className?: string;
}

export function FavoriteButton({
  chordName,
  active,
  onToggle,
  compact = false,
  tabIndex,
  className = "",
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      className={["favorite-button", compact ? "is-compact" : "is-large", active ? "is-active" : "", className].join(" ")}
      aria-label={active
        ? `${chordName} 즐겨찾기에서 제거`
        : `${chordName} 즐겨찾기에 추가`}
      aria-pressed={active}
      tabIndex={tabIndex}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      <Star size={compact ? 17 : 20} fill={active ? "currentColor" : "none"} aria-hidden="true" />
      {!compact ? <span>{active ? "즐겨찾기됨" : "즐겨찾기"}</span> : null}
    </button>
  );
}

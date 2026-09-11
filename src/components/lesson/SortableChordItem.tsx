import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { ArrowDown, ArrowUp, GripVertical, X } from "lucide-react";
import type { Chord } from "../../data/types";
import { ChordDiagram } from "../ChordDiagram";

interface SortableChordItemProps {
  chord: Chord;
  index: number;
  count: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (chordId: string) => void;
  focusTargetRef?: (button: HTMLButtonElement | null) => void;
}

export function SortableChordItem({
  chord,
  index,
  count,
  onMove,
  onRemove,
  focusTargetRef,
}: SortableChordItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chord.id });

  return (
    <li
      ref={setNodeRef}
      className={["lesson-sortable-chord", isDragging ? "is-dragging" : ""].join(" ")}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <span className="lesson-sortable-index">{index + 1}</span>
      <div className="lesson-sortable-diagram" aria-hidden="true">
        <ChordDiagram chord={chord} forcePrimitive size="sm" showNotes={false} ariaHidden />
      </div>
      <div className="lesson-sortable-copy">
        <strong>{chord.displayName}</strong>
        <span>{chord.koreanName}</span>
      </div>
      <div className="lesson-sortable-actions">
        <button
          type="button"
          disabled={index === 0}
          aria-label={`${chord.displayName} 코드를 위로 이동`}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={index === count - 1}
          aria-label={`${chord.displayName} 코드를 아래로 이동`}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown size={17} aria-hidden="true" />
        </button>
        <button
          ref={focusTargetRef}
          type="button"
          className="lesson-drag-handle"
          aria-label={`${chord.displayName} 코드 순서 끌어서 이동`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={19} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="lesson-remove-chord"
          aria-label={`${chord.displayName} 코드를 세트에서 제거`}
          onClick={() => onRemove(chord.id)}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

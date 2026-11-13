"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useAnimate, useReducedMotion } from "motion/react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { GlowButton } from "@/components/fx/GlowButton";
import { checkJigsaw } from "@/lib/activities/scoring";
import { haptic } from "@/lib/haptics";
import type { JigsawStation as JigsawStationType, StationResult } from "@/lib/types";
import { deterministicShuffle } from "../shuffle";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface JigsawStationProps {
  station: JigsawStationType;
  onDone: (result: StationResult) => void;
}

const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "Nhấn Space hoặc Enter để nhấc, dùng phím mũi tên để di chuyển, nhấn lại Space hoặc Enter để thả, Esc để hủy.",
};

function pieceId(pieceIndex: number): string {
  return `piece-${pieceIndex}`;
}

function getPieceLabel(id: UniqueIdentifier): string {
  const raw = String(id).replace(/^piece-/, "");
  const num = Number(raw);
  return Number.isFinite(num) ? `Mảnh ${num + 1}` : `Mảnh ${raw}`;
}

interface SortableTileProps {
  id: string;
  pieceNumber: number;
  slotIndex: number;
  isSelected: boolean;
  reducedMotion: boolean;
  onTap: (slotIndex: number) => void;
}

function SortableTile({
  id,
  pieceNumber,
  slotIndex,
  isSelected,
  reducedMotion,
  onTap,
}: SortableTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    attributes: { roleDescription: "mục có thể sắp xếp" },
    transition: reducedMotion ? null : undefined,
  });

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition: reducedMotion ? "none" : transition,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTap(slotIndex)}
      aria-label={`Mảnh ${pieceNumber}`}
      aria-pressed={isSelected || isDragging}
      className={`flex min-h-14 min-w-11 select-none items-center justify-center rounded-md border text-lg font-bold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
        isDragging
          ? "z-10 scale-105 border-terracotta bg-terracotta text-sand shadow-lg ring-2 ring-gold motion-reduce:scale-100"
          : isSelected
            ? "border-terracotta bg-terracotta text-sand ring-2 ring-gold shadow-[0_0_16px_rgba(201,154,46,0.35)]"
            : "cursor-grab border-ink/20 bg-sand text-ink hover:border-terracotta active:cursor-grabbing"
      }`}
    >
      {pieceNumber}
    </button>
  );
}

export function JigsawStation({ station, onDone }: JigsawStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = Boolean(prefersReducedMotion);
  const [scope, animate] = useAnimate();
  const [rows, cols] = station.grid;
  const total = rows * cols;
  const [placement, setPlacement] = useState<number[]>(() =>
    deterministicShuffle(
      Array.from({ length: total }, (_, i) => i),
      station.id,
      (arr) => checkJigsaw(arr, station.grid),
    ),
  );
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solvedGlow, setSolvedGlow] = useState(false);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);
  const didDragRef = useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = placement.map((pieceIndex) => pieceId(pieceIndex));

  function getSlotPosition(id: UniqueIdentifier): number {
    const idx = placement.findIndex((p) => pieceId(p) === String(id));
    return idx >= 0 ? idx + 1 : 1;
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Đã nhấc ${getPieceLabel(active.id)}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return undefined;
      return `${getPieceLabel(active.id)} đang ở vị trí ${getSlotPosition(over.id)}.`;
    },
    onDragEnd({ active, over }) {
      if (!over) return `Đã thả ${getPieceLabel(active.id)}.`;
      return `Đã thả ${getPieceLabel(active.id)} ở vị trí ${getSlotPosition(over.id)}.`;
    },
    onDragCancel({ active }) {
      return `Đã hủy kéo ${getPieceLabel(active.id)}.`;
    },
  };

  function handleDragStart() {
    didDragRef.current = true;
    setSelectedSlot(null);
    setFeedback(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPlacement((prev) => {
        const oldIndex = prev.findIndex((p) => pieceId(p) === String(active.id));
        const newIndex = prev.findIndex((p) => pieceId(p) === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
    setSelectedSlot(null);
    setFeedback(null);
  }

  function handleDragCancel() {
    setSelectedSlot(null);
  }

  function handleTileTap(slotIndex: number) {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    haptic("tap");
    setFeedback(null);
    if (selectedSlot === null) {
      setSelectedSlot(slotIndex);
      return;
    }
    if (selectedSlot === slotIndex) {
      setSelectedSlot(null);
      return;
    }

    setPlacement((prev) => {
      const next = prev.slice();
      const tmp = next[selectedSlot];
      next[selectedSlot] = next[slotIndex];
      next[slotIndex] = tmp;
      return next;
    });
    setSelectedSlot(null);
  }

  function handleCheck() {
    if (checkJigsaw(placement, station.grid)) {
      setFeedback(null);
      setSolvedGlow(true);
      haptic("success");
      if (!reducedMotion && scope.current) {
        animate(scope.current, { scale: [1, 1.03, 1] }, { duration: 0.3 });
      }
      onDone(result(true));
      return;
    }
    addWrong();
    haptic("error");
    if (!reducedMotion && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
    setFeedback("Chưa đúng thứ tự, hãy kéo thả hoặc chạm hai mảnh để đổi chỗ.");
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  return (
    <section
      className={`rounded-lg border border-ink/15 bg-white/80 p-4 transition-shadow motion-reduce:transition-none hover:shadow-sm ${
        solvedGlow
          ? "ring-2 ring-gold ring-offset-2 shadow-[0_0_16px_rgba(201,154,46,0.35)]"
          : ""
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.instruction}
      </p>
      <p className="mt-1 text-xs text-muted">
        Kéo thả mảnh ghép hoặc chạm hai mảnh để đổi chỗ ({rows}×{cols}).
      </p>

      <DndContext
        id={`dnd-${station.id}`}
        sensors={sensors}
        accessibility={{
          announcements,
          screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div
            ref={scope}
            className="mt-4 grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {placement.map((pieceIndex, slotIndex) => {
              const pieceNumber = pieceIndex + 1;
              const isSelected = selectedSlot === slotIndex;
              const id = pieceId(pieceIndex);
              return (
                <SortableTile
                  key={id}
                  id={id}
                  pieceNumber={pieceNumber}
                  slotIndex={slotIndex}
                  isSelected={isSelected}
                  reducedMotion={reducedMotion}
                  onTap={handleTileTap}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {feedback && (
        <p role="status" className="mt-3 text-sm font-medium text-terracotta">
          {feedback}
        </p>
      )}

      <div className="mt-4">
        <GlowButton
          type="button"
          onClick={handleCheck}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Kiểm tra
        </GlowButton>
      </div>

      <HintBox
        revealedHints={revealedHints}
        hintsUsed={hintsUsed}
        totalHints={station.hints.length}
        onRequestHint={handleHint}
      />
    </section>
  );
}

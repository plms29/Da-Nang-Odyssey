"use client";

import { useState, type CSSProperties } from "react";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GlowButton } from "@/components/fx/GlowButton";
import { checkOrder } from "@/lib/activities/scoring";
import { haptic } from "@/lib/haptics";
import type { OrderStation as OrderStationType, StationResult } from "@/lib/types";
import { deterministicShuffle } from "../shuffle";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface OrderStationProps {
  station: OrderStationType;
  onDone: (result: StationResult) => void;
}

const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "Nhấn Space hoặc Enter để nhấc, dùng phím mũi tên để di chuyển, nhấn lại Space hoặc Enter để thả, Esc để hủy.",
};

interface SortableOrderRowProps {
  item: { id: string; label: string };
  index: number;
  total: number;
  reducedMotion: boolean;
  onMove: (index: number, delta: -1 | 1) => void;
}

function SortableOrderRow({
  item,
  index,
  total,
  reducedMotion,
  onMove,
}: SortableOrderRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
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
    <li
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-colors motion-reduce:transition-none ${
        isDragging
          ? "z-10 border-terracotta bg-surface ring-2 ring-gold/70 shadow-md"
          : "border-border bg-sand/70 focus-within:border-terracotta focus-within:ring-2 focus-within:ring-gold/70"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          style={{ touchAction: "none" }}
          {...attributes}
          {...listeners}
          aria-label={`Kéo để sắp xếp: ${item.label}`}
          className="touch-none inline-flex min-h-11 min-w-11 shrink-0 cursor-grab select-none items-center justify-center rounded-lg border border-border bg-surface text-base font-bold text-muted transition-colors motion-reduce:transition-none hover:border-terracotta hover:bg-sand/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta active:cursor-grabbing"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4"
          >
            <circle cx="5.5" cy="3.5" r="1.2" />
            <circle cx="10.5" cy="3.5" r="1.2" />
            <circle cx="5.5" cy="8" r="1.2" />
            <circle cx="10.5" cy="8" r="1.2" />
            <circle cx="5.5" cy="12.5" r="1.2" />
            <circle cx="10.5" cy="12.5" r="1.2" />
          </svg>
        </button>
        <span className="text-sm font-medium text-ink">
          <span className="mr-2 font-bold text-terracotta">{index + 1}.</span>
          {item.label}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Đưa lên"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface text-sm font-bold text-ink transition-colors motion-reduce:transition-none hover:bg-sand/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 10l4-4 4 4"
            />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Đưa xuống"
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface text-sm font-bold text-ink transition-colors motion-reduce:transition-none hover:bg-sand/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6l4 4 4-4"
            />
          </svg>
        </button>
      </div>
    </li>
  );
}

export function OrderStation({ station, onDone }: OrderStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [scope, animate] = useAnimate();
  const [items, setItems] = useState(() =>
    deterministicShuffle(station.items, station.id, (arr) =>
      checkOrder(
        station,
        arr.map((item) => item.id),
      ),
    ),
  );
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solvedGlow, setSolvedGlow] = useState(false);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

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

  const itemIds = items.map((item) => item.id);

  function getItemLabel(id: UniqueIdentifier): string {
    return items.find((item) => item.id === String(id))?.label ?? String(id);
  }

  function getItemPosition(id: UniqueIdentifier): number {
    const idx = items.findIndex((item) => item.id === String(id));
    return idx >= 0 ? idx + 1 : 1;
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Đã nhấc ${getItemLabel(active.id)}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return undefined;
      return `${getItemLabel(active.id)} đang ở vị trí ${getItemPosition(over.id)}.`;
    },
    onDragEnd({ active, over }) {
      if (!over) return `Đã thả ${getItemLabel(active.id)}.`;
      return `Đã thả ${getItemLabel(active.id)} ở vị trí ${getItemPosition(over.id)}.`;
    },
    onDragCancel({ active }) {
      return `Đã hủy kéo ${getItemLabel(active.id)}.`;
    },
  };

  function handleDragStart() {
    haptic("tap");
    setFeedback(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === String(active.id));
        const newIndex = prev.findIndex((item) => item.id === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
    setFeedback(null);
  }

  function handleDragCancel() {
    setFeedback(null);
  }

  function moveItem(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    haptic("tap");
    setFeedback(null);
    setItems((prev) => {
      const next = prev.slice();
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  }

  function handleCheck() {
    if (checkOrder(station, items.map((item) => item.id))) {
      setFeedback(null);
      setSolvedGlow(true);
      haptic("success");
      if (!reduced && scope.current) {
        animate(
          scope.current,
          { y: [0, -4, 0] },
          { duration: 0.3, ease: "easeOut" },
        );
      }
      onDone(result(true));
      return;
    }
    addWrong();
    haptic("error");
    if (!reduced && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
    setFeedback("Thứ tự chưa đúng, hãy sắp xếp lại nhé.");
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  return (
    <section
      className={`rounded-xl border border-border bg-surface/95 p-4 transition-colors sm:p-5 ${
        solvedGlow ? "border-terracotta ring-2 ring-gold/70" : ""
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.instruction}
      </p>
      <p className="mt-1 text-xs text-muted">
        Giữ nút kéo để sắp xếp hoặc dùng nút đưa lên và đưa xuống.
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
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <ul ref={scope} className="mt-4 space-y-2">
            {items.map((item, index) => (
              <SortableOrderRow
                key={item.id}
                item={item}
                index={index}
                total={items.length}
                reducedMotion={reduced}
                onMove={moveItem}
              />
            ))}
          </ul>
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
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-terracotta px-5 py-2 text-sm font-semibold text-on-accent transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
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

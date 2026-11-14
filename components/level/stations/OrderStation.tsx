"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
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
  item: OrderStationType["items"][number];
  index: number;
  total: number;
  reducedMotion: boolean;
  isNoteOpen: boolean;
  onToggleNote: (id: string) => void;
  onMove: (index: number, delta: -1 | 1) => void;
}

function SortableOrderRow({
  item,
  index,
  total,
  reducedMotion,
  isNoteOpen,
  onToggleNote,
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

  const hasNote = Boolean(item.note);
  const noteId = `order-note-${item.id}`;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`relative rounded-md border px-3 py-2 transition-shadow motion-reduce:transition-none ${
        isDragging
          ? "z-10 border-terracotta bg-sand ring-2 ring-gold shadow-[0_0_16px_rgba(201,154,46,0.35)]"
          : "border-ink/15 bg-sand/60 focus-within:border-terracotta focus-within:ring-2 focus-within:ring-gold focus-within:shadow-[0_0_16px_rgba(201,154,46,0.35)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-[180px] flex-1 items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            style={{ touchAction: "none" }}
            {...attributes}
            {...listeners}
            aria-label={`Kéo để sắp xếp: ${item.label}`}
            className="touch-none inline-flex min-h-11 min-w-11 shrink-0 cursor-grab select-none items-center justify-center rounded-md border border-ink/20 bg-white text-base font-bold text-muted transition-colors motion-reduce:transition-none hover:border-terracotta hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta active:cursor-grabbing"
          >
            <span aria-hidden="true">⋮⋮</span>
          </button>
          <span className="text-sm font-medium leading-snug text-ink">
            <span className="mr-1.5 font-bold text-terracotta">{index + 1}.</span>
            {item.label}
          </span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {hasNote && (
            <button
              type="button"
              aria-label={`Tìm hiểu: ${item.label}`}
              aria-expanded={isNoteOpen}
              aria-controls={noteId}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onToggleNote(item.id)}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border text-sm font-bold italic transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                isNoteOpen
                  ? "border-gold bg-gold/25 text-ink"
                  : "border-ink/20 bg-white text-terracotta hover:border-gold hover:bg-gold/15"
              }`}
            >
              <span aria-hidden="true">i</span>
            </button>
          )}
          <button
            type="button"
            aria-label="Đưa lên"
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-white text-sm font-bold text-ink transition-colors motion-reduce:transition-none hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-40"
          >
            ▲
          </button>
          <button
            type="button"
            aria-label="Đưa xuống"
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-white text-sm font-bold text-ink transition-colors motion-reduce:transition-none hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-40"
          >
            ▼
          </button>
        </div>
      </div>

      {hasNote && isNoteOpen && (
        <p
          id={noteId}
          className="mt-2 rounded-md border border-gold/40 bg-white/90 px-3 py-2 text-sm leading-relaxed text-ink"
        >
          {item.note}
        </p>
      )}
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
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solvedGlow, setSolvedGlow] = useState(false);
  const [solved, setSolved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  useEffect(() => {
    if (solved) {
      continueButtonRef.current?.focus();
    }
  }, [solved]);

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

  function handleToggleNote(id: string) {
    haptic("tap");
    setOpenNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
    if (solved) return;
    if (checkOrder(station, items.map((item) => item.id))) {
      setFeedback(null);
      setSolvedGlow(true);
      setSolved(true);
      haptic("success");
      return;
    }
    addWrong();
    haptic("error");
    if (!reduced && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
    const firstWrongIndex = items.findIndex(
      (item, index) => item.id !== station.items[index]?.id,
    );
    if (firstWrongIndex >= 0) {
      setFeedback(
        `Thứ tự chưa đúng, hãy sắp xếp lại nhé. Sự kiện ở vị trí ${firstWrongIndex + 1} chưa đúng chỗ.`,
      );
    } else {
      setFeedback("Thứ tự chưa đúng, hãy sắp xếp lại nhé.");
    }
  }

  function handleContinue() {
    if (submittedRef.current || submitted) return;
    submittedRef.current = true;
    setSubmitted(true);
    haptic("tap");
    onDone(result(true));
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

      {!solved ? (
        <>
          <p className="mt-1 text-xs text-muted">
            Giữ nút kéo để sắp xếp hoặc dùng nút ▲ / ▼.
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
                    isNoteOpen={Boolean(openNotes[item.id])}
                    onToggleNote={handleToggleNote}
                    onMove={moveItem}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <div className="mt-4">
            <GlowButton
              type="button"
              onClick={handleCheck}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Kiểm tra
            </GlowButton>
          </div>
        </>
      ) : (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.25 }}
          className="mt-4 space-y-4"
        >
          <p className="text-sm font-semibold text-terracotta">
            Chính xác! Dòng thời gian hoàn chỉnh:
          </p>

          <ol className="relative space-y-3 border-l-2 border-gold pl-5">
            {station.items.map((item, index) => (
              <li key={item.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-7 top-3 h-3.5 w-3.5 rounded-full border-2 border-terracotta bg-gold"
                />
                <div className="rounded-md border border-gold/40 bg-sand/70 p-3">
                  <span className="inline-block rounded bg-terracotta/15 px-2 py-0.5 text-xs font-bold text-terracotta">
                    {/^\d+$/.test(item.id) ? item.id : `Bước ${index + 1}`}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {item.label}
                  </p>
                  {item.note && (
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {item.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div>
            <button
              ref={continueButtonRef}
              type="button"
              aria-disabled={submitted}
              onClick={handleContinue}
              className={`fx-glow-btn inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                submitted ? "cursor-not-allowed opacity-50" : "hover:opacity-90"
              }`}
            >
              <span className="fx-glow-btn__glow" aria-hidden="true" />
              <span className="fx-glow-btn__label">Tiếp tục</span>
            </button>
          </div>
        </motion.div>
      )}

      <div
        role="status"
        aria-live="polite"
        className={
          feedback
            ? "mt-3 rounded-md border border-terracotta/25 bg-terracotta/10 px-3 py-2 text-sm font-medium text-terracotta"
            : "sr-only"
        }
      >
        {feedback ?? ""}
      </div>

      {!solved && (
        <HintBox
          revealedHints={revealedHints}
          hintsUsed={hintsUsed}
          totalHints={station.hints.length}
          onRequestHint={handleHint}
        />
      )}
    </section>
  );
}

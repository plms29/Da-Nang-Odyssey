"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  pieceIndex: number;
  pieceNumber: number;
  slotIndex: number;
  rows: number;
  cols: number;
  imageSrc: string;
  isSelected: boolean;
  isSolved: boolean;
  reducedMotion: boolean;
  onTap: (slotIndex: number) => void;
}

function SortableTile({
  id,
  pieceIndex,
  pieceNumber,
  slotIndex,
  rows,
  cols,
  imageSrc,
  isSelected,
  isSolved,
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
    disabled: isSolved,
    attributes: { roleDescription: "mục có thể sắp xếp" },
    transition: reducedMotion ? null : undefined,
  });

  const row = Math.floor(pieceIndex / cols);
  const col = pieceIndex % cols;
  const posX = cols > 1 ? (col / (cols - 1)) * 100 : 0;
  const posY = rows > 1 ? (row / (rows - 1)) * 100 : 0;

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition: reducedMotion ? "none" : transition,
    backgroundImage: `url("${imageSrc}")`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: "no-repeat",
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={isSolved ? -1 : attributes.tabIndex}
      onClick={() => onTap(slotIndex)}
      aria-label={`Mảnh ${pieceNumber}`}
      aria-pressed={isSelected || isDragging}
      className={`relative flex aspect-square min-h-11 min-w-11 select-none overflow-hidden bg-sand transition-all motion-reduce:transition-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
        isSolved
          ? "cursor-default border-0 rounded-none"
          : isDragging
            ? "z-10 scale-105 rounded-sm border border-terracotta shadow-lg ring-2 ring-gold motion-reduce:scale-100"
            : isSelected
              ? "z-10 rounded-sm border border-terracotta ring-2 ring-gold shadow-[0_0_16px_rgba(201,154,46,0.35)]"
              : "cursor-grab rounded-sm border border-ink/20 hover:border-terracotta active:cursor-grabbing"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-1 left-1 rounded bg-ink/50 px-1 py-0.5 text-[10px] font-medium leading-none text-sand/80 transition-opacity motion-reduce:transition-none ${
          isSolved ? "opacity-0" : "opacity-75"
        }`}
      >
        {pieceNumber}
      </span>
    </button>
  );
}

export function JigsawStation({ station, onDone }: JigsawStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = Boolean(prefersReducedMotion);
  const [scope, animate] = useAnimate();
  const [rows, cols] = station.grid;
  const total = rows * cols;
  const imageSrc = station.image.startsWith("/")
    ? station.image
    : `/${station.image}`;

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
  const [solvedResult, setSolvedResult] = useState<StationResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);
  const didDragRef = useRef(false);
  const isSolved = solvedResult !== null;

  useEffect(() => {
    if (!previewOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewOpen]);

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
    if (isSolved) return;
    didDragRef.current = true;
    setSelectedSlot(null);
    setFeedback(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (isSolved) return;
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
    if (isSolved) return;
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
    if (isSolved) return;
    if (checkJigsaw(placement, station.grid)) {
      setFeedback(null);
      setSelectedSlot(null);
      setSolvedGlow(true);
      haptic("success");
      if (!reducedMotion && scope.current) {
        animate(scope.current, { scale: [1, 1.03, 1] }, { duration: 0.3 });
      }
      setSolvedResult(result(true));
      return;
    }
    addWrong();
    haptic("error");
    if (!reducedMotion && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
    setFeedback("Chưa đúng thứ tự, hãy quan sát ảnh mẫu rồi kéo thả hoặc chạm hai mảnh để đổi chỗ.");
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

      <div className="mt-3 flex items-center gap-3 rounded-md border border-gold/50 bg-gold/15 p-2.5">
        <Image
          src={imageSrc}
          alt="Ảnh mẫu ghép hình"
          width={56}
          height={56}
          unoptimized
          className="h-14 w-14 shrink-0 rounded border border-ink/15 bg-sand object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">
            Ảnh mẫu
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Nhìn mẫu để xếp các mảnh đúng vị trí.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-terracotta/40 bg-sand px-3 py-2 text-xs font-semibold text-terracotta transition-colors motion-reduce:transition-none hover:bg-terracotta hover:text-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Xem ảnh gốc
        </button>
      </div>

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
            className={`mx-auto mt-4 grid w-full max-w-sm transition-all motion-reduce:transition-none ${
              isSolved
                ? "gap-0 overflow-hidden rounded-md border-2 border-gold shadow-[0_0_16px_rgba(201,154,46,0.35)]"
                : "gap-[2px] rounded-md border border-ink/15 bg-ink/15 p-[2px]"
            }`}
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
                  pieceIndex={pieceIndex}
                  pieceNumber={pieceNumber}
                  slotIndex={slotIndex}
                  rows={rows}
                  cols={cols}
                  imageSrc={imageSrc}
                  isSelected={isSelected}
                  isSolved={isSolved}
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

      {solvedResult ? (
        <div
          role="status"
          className="mt-4 space-y-3 rounded-md border border-gold/60 bg-gold/15 p-3.5"
        >
          <div>
            <p className="text-sm font-bold text-ink">
              Bạn vừa ghép: Đài thờ Trà Kiệu
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {station.instruction}
            </p>
          </div>
          <GlowButton
            type="button"
            onClick={() => onDone(solvedResult)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Tiếp tục
          </GlowButton>
        </div>
      ) : (
        <>
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
        </>
      )}

      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ảnh gốc ghép hình"
          onClick={() => setPreviewOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-ink/20 bg-sand p-4 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Ảnh gốc đối chiếu
              </h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Đóng ảnh gốc"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors motion-reduce:transition-none hover:border-terracotta hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                Đóng
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-md border border-ink/15 bg-white p-2">
              <Image
                src={imageSrc}
                alt={station.instruction}
                width={360}
                height={360}
                unoptimized
                className="mx-auto aspect-square h-auto w-full max-w-xs object-contain"
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {station.instruction}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

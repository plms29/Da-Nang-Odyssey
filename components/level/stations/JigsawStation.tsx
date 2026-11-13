"use client";

import { useState } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
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

export function JigsawStation({ station, onDone }: JigsawStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
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
  const [checked, setChecked] = useState(false);
  const [correctPop, setCorrectPop] = useState(false);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  function handleTileTap(slotIndex: number) {
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
      setChecked(true);
      setCorrectPop(true);
      haptic("success");
      if (!reduced && scope.current) {
        animate(scope.current, { scale: [1, 1.03, 1] }, { duration: 0.35 });
      }
      onDone(result(true));
      return;
    }
    addWrong();
    haptic("error");
    if (!reduced && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
    setFeedback("Chưa đúng thứ tự, hãy chạm hai mảnh để đổi chỗ.");
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  return (
    <section
      className={`rounded-lg border border-ink/15 bg-white/80 p-4 transition-shadow hover:shadow-sm ${
        correctPop
          ? "ring-2 ring-gold ring-offset-2 shadow-[0_0_16px_rgba(201,154,46,0.35)]"
          : ""
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.instruction}
      </p>
      <p className="mt-1 text-xs text-muted">
        Chạm một mảnh rồi chạm mảnh khác để đổi chỗ.
      </p>

      <div className="relative mt-4">
        <motion.div
          ref={scope}
          className={`grid ${checked ? "gap-0" : "gap-2"}`}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {placement.map((pieceIndex, slotIndex) => {
            const pieceNumber = pieceIndex + 1;
            const isSelected = selectedSlot === slotIndex;
            return (
              <motion.button
                key={pieceIndex}
                type="button"
                layout={!reduced}
                animate={
                  reduced ? undefined : { scale: isSelected ? 1.05 : 1 }
                }
                transition={
                  reduced
                    ? { duration: 0.15 }
                    : { type: "spring", stiffness: 420, damping: 34 }
                }
                onClick={() => handleTileTap(slotIndex)}
                aria-label={`Mảnh ${pieceNumber}`}
                aria-pressed={isSelected}
                className={`flex min-h-14 items-center justify-center rounded-md border text-lg font-bold transition-[color,background-color,border-color,opacity,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                  isSelected
                    ? "border-terracotta bg-terracotta text-sand ring-2 ring-gold shadow-[0_0_16px_rgba(201,154,46,0.35)]"
                    : checked
                      ? "border-transparent bg-sand text-ink"
                      : "border-ink/20 bg-sand text-ink hover:border-terracotta"
                }`}
              >
                {pieceNumber}
              </motion.button>
            );
          })}
        </motion.div>

        {checked && (
          <motion.div
            aria-hidden="true"
            initial={reduced ? { opacity: 0 } : { opacity: 0.35 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.15 : 0.35 }}
            className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-br from-gold/25 via-transparent to-river/25"
          />
        )}
      </div>

      {feedback && (
        <p role="status" className="mt-3 text-sm font-medium text-terracotta">
          {feedback}
        </p>
      )}

      <div className="mt-4">
        <GlowButton
          type="button"
          onClick={handleCheck}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
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

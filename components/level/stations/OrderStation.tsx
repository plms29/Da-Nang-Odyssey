"use client";

import { useState } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { checkOrder } from "@/lib/activities/scoring";
import type { OrderStation as OrderStationType, StationResult } from "@/lib/types";
import { deterministicShuffle } from "../shuffle";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface OrderStationProps {
  station: OrderStationType;
  onDone: (result: StationResult) => void;
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
  const [lastMovedId, setLastMovedId] = useState<string | null>(null);
  const [correctPop, setCorrectPop] = useState(false);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  function moveItem(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    setFeedback(null);
    setLastMovedId(items[index].id);
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
      setCorrectPop(true);
      if (!reduced && scope.current) {
        animate(scope.current, { scale: [1, 1.03, 1] }, { duration: 0.35 });
      }
      onDone(result(true));
      return;
    }
    addWrong();
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
      className={`rounded-lg border border-ink/15 bg-white/80 p-4 ${
        correctPop ? "ring-2 ring-gold ring-offset-2" : ""
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.instruction}
      </p>

      <motion.ul ref={scope} className="mt-4 space-y-2">
        {items.map((item, index) => {
          const isLastMoved = lastMovedId === item.id;
          return (
            <motion.li
              key={item.id}
              layout={!reduced}
              animate={reduced ? undefined : { scale: isLastMoved ? 1.03 : 1 }}
              transition={
                reduced
                  ? { duration: 0.15 }
                  : { type: "spring", stiffness: 420, damping: 34 }
              }
              className={`flex items-center justify-between gap-2 rounded-md border border-ink/15 bg-sand/60 px-3 py-2 ${
                isLastMoved ? "shadow-md" : ""
              }`}
            >
              <span className="text-sm font-medium text-ink">
                <span className="mr-2 font-bold text-terracotta">
                  {index + 1}.
                </span>
                {item.label}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Đưa lên"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-white text-sm font-bold text-ink transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Đưa xuống"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink/20 bg-white text-sm font-bold text-ink transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ▼
                </button>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>

      {feedback && (
        <p role="status" className="mt-3 text-sm font-medium text-terracotta">
          {feedback}
        </p>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={handleCheck}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Kiểm tra
        </button>
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

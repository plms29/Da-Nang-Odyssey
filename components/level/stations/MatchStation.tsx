"use client";

import { useState } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { checkMatch } from "@/lib/activities/scoring";
import type { MatchStation as MatchStationType, StationResult } from "@/lib/types";
import { deterministicShuffle } from "../shuffle";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface MatchStationProps {
  station: MatchStationType;
  onDone: (result: StationResult) => void;
}

export function MatchStation({ station, onDone }: MatchStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [scope, animate] = useAnimate();
  const [rightOptions] = useState(() =>
    deterministicShuffle(
      station.pairs.map((p) => ({ id: p.id, right: p.right })),
      station.id,
      (arr) => arr.every((item, idx) => item.id === station.pairs[idx].id),
    ),
  );
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [solvedGlow, setSolvedGlow] = useState(false);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  function handleSelectLeft(leftId: string) {
    setFeedback(null);
    setSelectedLeftId((prev) => (prev === leftId ? null : leftId));
  }

  function handleSelectRight(rightId: string) {
    if (!selectedLeftId) return;
    setFeedback(null);
    setMapping((prev) => {
      const next: Record<string, string> = {};
      for (const [leftId, mappedRightId] of Object.entries(prev)) {
        if (mappedRightId !== rightId) {
          next[leftId] = mappedRightId;
        }
      }
      next[selectedLeftId] = rightId;
      return next;
    });
    setSelectedLeftId(null);
  }

  function handleCheck() {
    if (Object.keys(mapping).length < station.pairs.length) {
      setFeedback("Hãy ghép đủ các cặp");
      return;
    }
    if (checkMatch(station, mapping)) {
      setFeedback(null);
      setChecked(true);
      setSolvedGlow(true);
      onDone(result(true));
      return;
    }
    addWrong();
    if (!reduced && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
    setFeedback("Có cặp ghép chưa đúng, hãy kiểm tra lại nhé.");
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  const rightLabelById = new Map(rightOptions.map((opt) => [opt.id, opt.right]));
  const usedRightIds = new Set(Object.values(mapping));
  const leftByRightId = new Map(
    Object.entries(mapping).map(([leftId, rightId]) => [rightId, leftId]),
  );

  return (
    <section
      className={`rounded-lg border border-ink/15 bg-white/80 p-4 ${
        solvedGlow ? "ring-2 ring-gold ring-offset-2" : ""
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.instruction}
      </p>
      <p className="mt-1 text-xs text-muted">
        Chọn một mục bên trái rồi chọn nội dung tương ứng bên phải để ghép cặp.
      </p>

      <div
        ref={scope}
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Vế trái
          </h3>
          {station.pairs.map((pair) => {
            const isSelected = selectedLeftId === pair.id;
            const pairedRightId = mapping[pair.id];
            const pairedText = pairedRightId
              ? rightLabelById.get(pairedRightId)
              : null;
            const isPaired = Boolean(pairedRightId);
            const isLocked = checked && pairedRightId === pair.id;

            return (
              <motion.button
                key={pair.id}
                type="button"
                onClick={() => handleSelectLeft(pair.id)}
                aria-pressed={isSelected}
                animate={
                  reduced
                    ? undefined
                    : { x: isLocked ? 6 : 0, y: isSelected ? -2 : 0 }
                }
                transition={
                  reduced
                    ? { duration: 0.15 }
                    : { type: "spring", stiffness: 380, damping: 30 }
                }
                className={`flex min-h-11 w-full flex-col items-start rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                  isSelected
                    ? "border-terracotta bg-terracotta text-sand ring-2 ring-gold"
                    : isLocked
                      ? "border-river bg-river/10 text-ink"
                      : isPaired
                        ? "border-river bg-sand/60 text-ink ring-1 ring-river hover:border-terracotta"
                        : "border-ink/20 bg-sand/60 text-ink hover:border-terracotta"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-semibold">{pair.left}</span>
                  {isLocked && (
                    <span
                      aria-hidden="true"
                      className={`shrink-0 font-bold ${
                        isSelected ? "text-sand" : "text-river"
                      }`}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <span
                  className={`mt-0.5 text-xs ${
                    isSelected ? "text-sand" : "text-muted"
                  }`}
                >
                  {pairedText ? `→ ${pairedText}` : "Chưa ghép"}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Vế phải
          </h3>
          {rightOptions.map((option) => {
            const isUsed = usedRightIds.has(option.id);
            const pairedLeftId = leftByRightId.get(option.id);
            const isLocked = checked && pairedLeftId === option.id;

            return (
              <motion.button
                key={option.id}
                type="button"
                disabled={!selectedLeftId}
                onClick={() => handleSelectRight(option.id)}
                animate={reduced ? undefined : { x: isLocked ? -6 : 0 }}
                transition={
                  reduced
                    ? { duration: 0.15 }
                    : { type: "spring", stiffness: 380, damping: 30 }
                }
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm text-ink transition-colors hover:border-river hover:bg-sand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-60 ${
                  isLocked
                    ? "border-river bg-river/10"
                    : isUsed
                      ? "border-river bg-white ring-1 ring-river"
                      : "border-ink/20 bg-white"
                }`}
              >
                <span>{option.right}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {isLocked && (
                    <span aria-hidden="true" className="font-bold text-river">
                      ✓
                    </span>
                  )}
                  {isUsed && (
                    <span className="shrink-0 text-xs font-medium text-muted">
                      Đã ghép
                    </span>
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

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

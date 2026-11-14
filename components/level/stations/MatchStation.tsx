"use client";

import { useState } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { GlowButton } from "@/components/fx/GlowButton";
import { checkMatch } from "@/lib/activities/scoring";
import { haptic } from "@/lib/haptics";
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
    haptic("tap");
    setFeedback(null);
    setSelectedLeftId((prev) => (prev === leftId ? null : leftId));
  }

  function handleSelectRight(rightId: string) {
    if (!selectedLeftId) return;
    haptic("tap");
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
      haptic("error");
      setFeedback("Hãy ghép đủ các cặp");
      return;
    }
    if (checkMatch(station, mapping)) {
      setFeedback(null);
      setChecked(true);
      setSolvedGlow(true);
      haptic("success");
      onDone(result(true));
      return;
    }
    addWrong();
    haptic("error");
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
      className={`rounded-xl border border-border bg-surface/95 p-4 transition-colors sm:p-5 ${
        solvedGlow ? "border-terracotta ring-2 ring-gold/70" : ""
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
          <h3 className="text-xs font-semibold text-muted">
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
                className={`flex min-h-11 w-full flex-col items-start rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                  isSelected
                    ? "border-terracotta bg-terracotta text-on-accent ring-2 ring-gold/70"
                    : isLocked
                      ? "border-river bg-river/10 text-ink"
                      : isPaired
                        ? "border-river bg-sand/70 text-ink ring-1 ring-river/50 hover:border-terracotta"
                        : "border-border bg-sand/70 text-ink hover:border-terracotta"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-semibold">{pair.left}</span>
                  {isLocked && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className={`h-4 w-4 shrink-0 ${
                        isSelected ? "text-on-accent" : "text-river"
                      }`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.5 8.5l3 3 6-6.5"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`mt-0.5 text-xs ${
                    isSelected ? "text-on-accent/85" : "text-muted"
                  }`}
                >
                  {pairedText ? `Ghép với: ${pairedText}` : "Chưa ghép"}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted">
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
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm text-ink transition-colors hover:border-river hover:bg-sand/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-60 ${
                  isLocked
                    ? "border-river bg-river/10"
                    : isUsed
                      ? "border-river bg-surface ring-1 ring-river/50"
                      : "border-border bg-surface"
                }`}
              >
                <span>{option.right}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {isLocked && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="h-4 w-4 text-river"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.5 8.5l3 3 6-6.5"
                      />
                    </svg>
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
        <GlowButton
          type="button"
          onClick={handleCheck}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-terracotta px-5 py-2 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
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

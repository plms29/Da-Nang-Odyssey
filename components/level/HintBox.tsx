"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export interface HintBoxProps {
  revealedHints: string[];
  hintsUsed: number;
  totalHints?: number;
  onRequestHint: () => void;
}

export function HintBox({
  revealedHints,
  hintsUsed,
  totalHints,
  onRequestHint,
}: HintBoxProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const maxHints = totalHints !== undefined ? Math.min(3, totalHints) : 3;
  const exhausted = revealedHints.length >= maxHints || hintsUsed >= maxHints;

  return (
    <div className="mt-4 rounded-lg border border-ink/15 bg-sand/60 p-3">
      <button
        type="button"
        onClick={onRequestHint}
        disabled={exhausted}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-gold bg-gold/20 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-50"
      >
        Gợi ý (−20 điểm)
      </button>

      <div aria-live="polite" className="mt-2">
        <AnimatePresence initial={false}>
          {revealedHints.length > 0 && (
            <ul className="space-y-1.5 text-sm text-ink">
              {revealedHints.map((hint, index) => (
                <motion.li
                  key={index}
                  initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={
                    reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }
                  }
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={
                    reduced
                      ? { duration: 0.15 }
                      : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="overflow-hidden rounded-sm bg-white/80 px-3 py-2 text-ink"
                >
                  <span className="font-semibold text-terracotta">
                    Gợi ý {index + 1}:{" "}
                  </span>
                  {hint}
                </motion.li>
              ))}
            </ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

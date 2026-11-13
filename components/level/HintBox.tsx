"use client";

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
        {revealedHints.length > 0 && (
          <ul className="space-y-1.5 text-sm text-ink">
            {revealedHints.map((hint, index) => (
              <li
                key={index}
                className="rounded-sm bg-white/80 px-3 py-2 text-ink"
              >
                <span className="font-semibold text-terracotta">
                  Gợi ý {index + 1}:{" "}
                </span>
                {hint}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

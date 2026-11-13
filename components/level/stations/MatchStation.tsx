"use client";

import { useState } from "react";
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
      onDone(result(true));
      return;
    }
    addWrong();
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

  return (
    <section className="rounded-lg border border-ink/15 bg-white/80 p-4">
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.instruction}
      </p>
      <p className="mt-1 text-xs text-muted">
        Chọn một mục bên trái rồi chọn nội dung tương ứng bên phải để ghép cặp.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => handleSelectLeft(pair.id)}
                aria-pressed={isSelected}
                className={`flex min-h-11 w-full flex-col items-start rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                  isSelected
                    ? "border-terracotta bg-terracotta text-sand"
                    : "border-ink/20 bg-sand/60 text-ink hover:border-terracotta"
                }`}
              >
                <span className="font-semibold">{pair.left}</span>
                <span
                  className={`mt-0.5 text-xs ${
                    isSelected ? "text-sand/90" : "text-muted"
                  }`}
                >
                  {pairedText ? `→ ${pairedText}` : "Chưa ghép"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Vế phải
          </h3>
          {rightOptions.map((option) => {
            const isUsed = usedRightIds.has(option.id);
            return (
              <button
                key={option.id}
                type="button"
                disabled={!selectedLeftId}
                onClick={() => handleSelectRight(option.id)}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-ink/20 bg-white px-3 py-2 text-left text-sm text-ink transition-colors hover:border-river hover:bg-sand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{option.right}</span>
                {isUsed && (
                  <span className="shrink-0 text-xs font-medium text-muted">
                    Đã ghép
                  </span>
                )}
              </button>
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

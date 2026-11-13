"use client";

import { useState } from "react";
import { checkJigsaw } from "@/lib/activities/scoring";
import type { JigsawStation as JigsawStationType, StationResult } from "@/lib/types";
import { deterministicShuffle } from "../shuffle";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface JigsawStationProps {
  station: JigsawStationType;
  onDone: (result: StationResult) => void;
}

export function JigsawStation({ station, onDone }: JigsawStationProps) {
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
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  function handleTileTap(slotIndex: number) {
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
      onDone(result(true));
      return;
    }
    addWrong();
    setFeedback("Chưa đúng thứ tự, hãy chạm hai mảnh để đổi chỗ.");
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  return (
    <section className="rounded-lg border border-ink/15 bg-white/80 p-4">
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.instruction}
      </p>
      <p className="mt-1 text-xs text-muted">
        Chạm một mảnh rồi chạm mảnh khác để đổi chỗ.
      </p>

      <div
        className="mt-4 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {placement.map((pieceIndex, slotIndex) => {
          const pieceNumber = pieceIndex + 1;
          const isSelected = selectedSlot === slotIndex;
          return (
            <button
              key={slotIndex}
              type="button"
              onClick={() => handleTileTap(slotIndex)}
              aria-label={`Mảnh ${pieceNumber}`}
              aria-pressed={isSelected}
              className={`flex min-h-14 items-center justify-center rounded-md border text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                isSelected
                  ? "border-terracotta bg-terracotta text-sand"
                  : "border-ink/20 bg-sand text-ink hover:border-terracotta"
              }`}
            >
              {pieceNumber}
            </button>
          );
        })}
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

"use client";

import { useState } from "react";
import { finalResult } from "@/lib/activities/scoring";
import type { StationResult } from "@/lib/types";

const MAX_HINTS = 3;

export function useAttempt(hints: readonly string[]) {
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrong, setWrong] = useState(0);

  function nextHint(): string | null {
    if (hintsUsed >= MAX_HINTS || hintsUsed >= hints.length) {
      return null;
    }
    const hint = hints[hintsUsed];
    setHintsUsed((prev) => prev + 1);
    return hint;
  }

  function addWrong(): void {
    setWrong((prev) => prev + 1);
  }

  function result(correct: boolean): StationResult {
    return finalResult(correct, hintsUsed, wrong);
  }

  return {
    hintsUsed,
    wrong,
    nextHint,
    addWrong,
    result,
  };
}

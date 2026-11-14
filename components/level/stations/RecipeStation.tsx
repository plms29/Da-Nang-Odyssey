"use client";

import type { RecipeStation as RecipeStationType, StationResult } from "@/lib/types";

export interface RecipeStationProps {
  station: RecipeStationType;
  onDone: (result: StationResult) => void;
}

// Stub: worker fills this in (plan.md, đợt 6 màn).
export function RecipeStation({ station }: RecipeStationProps) {
  return <p>{station.instruction}</p>;
}

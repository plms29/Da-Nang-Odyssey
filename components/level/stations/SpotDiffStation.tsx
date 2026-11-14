"use client";

import type { SpotDiffStation as SpotDiffStationType, StationResult } from "@/lib/types";

export interface SpotDiffStationProps {
  station: SpotDiffStationType;
  onDone: (result: StationResult) => void;
}

// Stub: worker fills this in (plan.md, đợt 6 màn).
export function SpotDiffStation({ station }: SpotDiffStationProps) {
  return <p>{station.instruction}</p>;
}

"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { JigsawStation } from "@/components/level/stations/JigsawStation";
import { MatchStation } from "@/components/level/stations/MatchStation";
import { OrderStation } from "@/components/level/stations/OrderStation";
import { levelForSpot } from "@/lib/content";
import type { TourAction } from "@/lib/tour/player";
import type { Spot } from "@/lib/types";

export interface TourStopStationProps {
  spot: Spot;
  dispatch: Dispatch<TourAction>;
}

export function TourStopStation({ spot, dispatch }: TourStopStationProps) {
  const [completed, setCompleted] = useState(false);
  const skippedSpotIdRef = useRef<string | null>(null);

  const station = levelForSpot(spot.id)?.stations[1];
  const isAllowed =
    station !== undefined &&
    (station.type === "jigsaw" ||
      station.type === "order" ||
      station.type === "match");

  useEffect(() => {
    if (!isAllowed && skippedSpotIdRef.current !== spot.id) {
      skippedSpotIdRef.current = spot.id;
      dispatch({ type: "next" });
    }
  }, [isAllowed, spot.id, dispatch]);

  if (!isAllowed) {
    return null;
  }

  function handleDone() {
    setCompleted(true);
    dispatch({ type: "activityDone", spotId: spot.id });
  }

  function handleSkip() {
    dispatch({ type: "activitySkipped", spotId: spot.id });
    dispatch({ type: "next" });
  }

  if (completed) {
    return (
      <div className="space-y-4 rounded-md border border-gold/60 bg-gold/15 p-4">
        <p role="status" className="text-base font-bold text-ink">
          Làm tốt lắm!
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "next" })}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Tiếp tục
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {station.type === "jigsaw" && (
        <JigsawStation key={station.id} station={station} onDone={handleDone} />
      )}
      {station.type === "order" && (
        <OrderStation key={station.id} station={station} onDone={handleDone} />
      )}
      {station.type === "match" && (
        <MatchStation key={station.id} station={station} onDone={handleDone} />
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSkip}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Để sau
        </button>
      </div>
    </div>
  );
}

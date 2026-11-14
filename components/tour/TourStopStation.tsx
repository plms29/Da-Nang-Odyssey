"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Celebrate } from "@/components/fx/Celebrate";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowButton } from "@/components/fx/GlowButton";
import { StampPress } from "@/components/fx/StampPress";
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
  const reducedMotion = Boolean(useReducedMotion());

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
      <GlassPanel
        tone="light"
        className="overflow-hidden border bg-gold/15!"
        style={{ borderColor: "var(--world-accent, #B5532F)" }}
      >
        <div className="relative p-5">
          <Celebrate kind="gold-burst" play={true} />
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.25,
              ease: "easeOut",
            }}
            className="relative z-10 space-y-4"
          >
            <p role="status" className="text-base font-bold text-ink">
              <StampPress play={true}>Làm tốt lắm!</StampPress>
            </p>
            <GlowButton
              type="button"
              onClick={() => dispatch({ type: "next" })}
              className="min-h-11 px-5 py-2 text-sm"
            >
              Tiếp tục
            </GlowButton>
          </motion.div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      tone="light"
      className="space-y-4 border p-4 lg:p-5"
      style={{ borderColor: "var(--world-accent, #B5532F)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-ink">
          Hoạt động tại điểm dừng
        </span>
      </div>

      {station.type === "jigsaw" && (
        <JigsawStation key={station.id} station={station} onDone={handleDone} />
      )}
      {station.type === "order" && (
        <OrderStation key={station.id} station={station} onDone={handleDone} />
      )}
      {station.type === "match" && (
        <MatchStation key={station.id} station={station} onDone={handleDone} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3">
        <span className="text-xs text-muted">
          Có thể bỏ qua hoạt động để nghe điểm tiếp theo
        </span>
        <button
          type="button"
          onClick={handleSkip}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-ink/25 bg-white/85 px-5 py-2 text-sm font-semibold text-ink shadow-xs backdrop-blur-sm transition-colors motion-reduce:transition-none hover:border-terracotta/50 hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Để sau
        </button>
      </div>
    </GlassPanel>
  );
}

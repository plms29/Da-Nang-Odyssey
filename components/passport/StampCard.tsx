"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { StampPress } from "@/components/fx/StampPress";
import { TiltCard } from "@/components/fx/TiltCard";
import type { PassportState } from "@/lib/passport/logic";
import type { Spot, StampKind } from "@/lib/types";
import { HoloFoil } from "./HoloFoil";

export interface StampCardProps {
  spot: Spot;
  stamp?: PassportState["stamps"][string];
  index?: number;
  fresh?: Partial<Record<StampKind, boolean>>;
  reduced?: boolean;
  onPressed?: (kind: StampKind) => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

function formatVisitDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function StampCard({
  spot,
  stamp,
  index = 0,
  fresh,
  reduced,
  onPressed,
}: StampCardProps) {
  const prefersReduced = Boolean(useReducedMotion());
  const effectiveReduced = reduced ?? prefersReduced;

  const hasLevel = Boolean(stamp?.level);
  const hasTour = Boolean(stamp?.tour);
  const visitedDate = stamp?.visited ? formatVisitDate(stamp.visited) : null;

  const isFreshLevel = Boolean(hasLevel && fresh?.level && !effectiveReduced);
  const isFreshTour = Boolean(hasTour && fresh?.tour && !effectiveReduced);
  const isFreshVisited = Boolean(
    visitedDate && fresh?.visited && !effectiveReduced,
  );
  const hasFresh = isFreshLevel || isFreshTour || isFreshVisited;

  const [started, setStarted] = useState(false);
  const [shimmerDone, setShimmerDone] = useState(false);
  const onPressedRef = useRef(onPressed);

  useEffect(() => {
    onPressedRef.current = onPressed;
  }, [onPressed]);

  useEffect(() => {
    if (!hasFresh || effectiveReduced) return;

    const startDelay = index * 60 + 250;
    const startTimer = window.setTimeout(() => {
      setStarted(true);
    }, startDelay);

    const doneTimer = window.setTimeout(() => {
      if (isFreshLevel) onPressedRef.current?.("level");
      if (isFreshTour) onPressedRef.current?.("tour");
      if (isFreshVisited) onPressedRef.current?.("visited");
    }, startDelay + 300);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(doneTimer);
    };
  }, [
    hasFresh,
    effectiveReduced,
    index,
    isFreshLevel,
    isFreshTour,
    isFreshVisited,
  ]);

  const card = (
    <TiltCard
      as="article"
      max={10}
      className="rounded-lg border border-ink/15 bg-white/80 p-4 lg:flex lg:h-full lg:min-h-56 lg:flex-col lg:justify-between lg:p-6"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-ink">{spot.name}</h3>
        {!visitedDate && (
          <Link
            href={`/photobooth?spot=${encodeURIComponent(spot.id)}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-xs font-semibold text-terracotta underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Check-in tại đây
          </Link>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 lg:mt-5 lg:gap-3">
        <div
          role="group"
          aria-label={
            hasLevel ? "Hoàn thành màn: có" : "Hoàn thành màn: chưa"
          }
          className={`relative flex min-h-14 flex-col items-center justify-center overflow-hidden rounded-md px-2 py-2 text-center text-xs lg:min-h-28 lg:px-3 lg:py-4 ${
            hasLevel
              ? "bg-terracotta font-semibold text-sand"
              : "border border-dashed border-ink/25 bg-sand/50 text-muted"
          }`}
        >
          {hasLevel && <HoloFoil reduced={effectiveReduced} />}
          {hasLevel ? (
            <StampPress
              play={isFreshLevel && started}
              className={isFreshLevel && !started ? "opacity-0" : undefined}
            >
              <span className="flex flex-col items-center">
                <span>Hoàn thành màn</span>
                <span className="mt-1 text-xs opacity-90">Đã có</span>
              </span>
            </StampPress>
          ) : (
            <>
              <span>Hoàn thành màn</span>
              <span className="mt-1 text-xs opacity-90">Chưa</span>
            </>
          )}
        </div>

        <div
          role="group"
          aria-label={hasTour ? "Đã nghe tour: có" : "Đã nghe tour: chưa"}
          className={`relative flex min-h-14 flex-col items-center justify-center overflow-hidden rounded-md px-2 py-2 text-center text-xs lg:min-h-28 lg:px-3 lg:py-4 ${
            hasTour
              ? "bg-river font-semibold text-sand"
              : "border border-dashed border-ink/25 bg-sand/50 text-muted"
          }`}
        >
          {hasTour && <HoloFoil reduced={effectiveReduced} />}
          {hasTour ? (
            <StampPress
              play={isFreshTour && started}
              className={isFreshTour && !started ? "opacity-0" : undefined}
            >
              <span className="flex flex-col items-center">
                <span>Đã nghe tour</span>
                <span className="mt-1 text-xs opacity-90">Đã có</span>
              </span>
            </StampPress>
          ) : (
            <>
              <span>Đã nghe tour</span>
              <span className="mt-1 text-xs opacity-90">Chưa</span>
            </>
          )}
        </div>

        <div
          role="group"
          aria-label={
            visitedDate
              ? `Đã đến: có, ngày ${visitedDate}`
              : "Đã đến: chưa"
          }
          className={`relative flex min-h-14 flex-col items-center justify-center overflow-hidden rounded-md px-2 py-2 text-center text-xs lg:min-h-28 lg:px-3 lg:py-4 ${
            visitedDate
              ? "bg-gold font-semibold text-ink"
              : "border border-dashed border-ink/25 bg-sand/50 text-muted"
          }`}
        >
          {visitedDate && <HoloFoil variant="gold" reduced={effectiveReduced} />}
          {visitedDate && !effectiveReduced && !shimmerDone && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-md"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)",
              }}
              initial={{ x: "-120%" }}
              animate={{ x: "220%" }}
              transition={{
                duration: 0.9,
                ease: "easeInOut",
                delay: 1.2,
              }}
              onAnimationComplete={() => setShimmerDone(true)}
            />
          )}
          {visitedDate ? (
            <StampPress
              play={isFreshVisited && started}
              className={isFreshVisited && !started ? "opacity-0" : undefined}
            >
              <span className="flex flex-col items-center">
                <span>Đã đến</span>
                <span className="mt-1 text-xs">{visitedDate}</span>
              </span>
            </StampPress>
          ) : (
            <>
              <span>Đã đến</span>
              <span className="mt-1 text-xs">Chưa</span>
            </>
          )}
        </div>
      </div>
    </TiltCard>
  );

  if (effectiveReduced) {
    return card;
  }

  return <motion.div variants={cardVariants}>{card}</motion.div>;
}

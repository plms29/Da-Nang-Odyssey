"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "motion/react";
import { GlowButton } from "@/components/fx/GlowButton";
import { checkSpotDiff, hitSpot } from "@/lib/activities/scoring";
import { haptic } from "@/lib/haptics";
import type {
  SpotDiffStation as SpotDiffStationType,
  StationResult,
} from "@/lib/types";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface SpotDiffStationProps {
  station: SpotDiffStationType;
  onDone: (result: StationResult) => void;
}

interface MissDot {
  id: number;
  x: number;
  y: number;
}

function toImgSrc(path: string): string {
  if (!path) return "";
  if (
    path.startsWith("/") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  return `/${path}`;
}

export function SpotDiffStation({ station, onDone }: SpotDiffStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [scope, animate] = useAnimate();
  const afterImgRef = useRef<HTMLImageElement>(null);
  const completeWrapRef = useRef<HTMLDivElement>(null);
  const missIdRef = useRef(0);
  const timersRef = useRef<Set<number>>(new Set());

  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [missCount, setMissCount] = useState(0);
  const [missDots, setMissDots] = useState<MissDot[]>([]);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  const allFound = checkSpotDiff(station, foundIds);
  const prevAllFoundRef = useRef(allFound);
  const totalHints = Math.min(3, station.hints.length);
  const allHintsUsed = hintsUsed >= totalHints;

  useEffect(() => {
    if (!prevAllFoundRef.current && allFound) {
      completeWrapRef.current?.focus();
    }
    prevAllFoundRef.current = allFound;
  }, [allFound]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  function handleAfterClick(event: MouseEvent<HTMLDivElement>) {
    if (allFound) return;
    const imgEl = afterImgRef.current;
    if (!imgEl) return;
    const rect = imgEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xPct = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    );
    const yPct = Math.max(
      0,
      Math.min(100, ((event.clientY - rect.top) / rect.height) * 100),
    );
    const aspect = rect.height / rect.width;
    const hitId = hitSpot(station, xPct, yPct, aspect);

    if (hitId) {
      if (foundIds.includes(hitId)) {
        haptic("tap");
        const existing = station.spots.find((s) => s.id === hitId);
        if (existing) {
          setFeedback(`Bạn đã tìm thấy "${existing.label}" rồi.`);
        }
        return;
      }

      const nextFound = [...foundIds, hitId];
      setFoundIds(nextFound);
      setFeedback(null);
      haptic("success");
      if (!reduced && scope.current) {
        animate(
          scope.current,
          { y: [0, -4, 0] },
          { duration: 0.3, ease: "easeOut" },
        );
      }
      return;
    }

    const dotId = ++missIdRef.current;
    setMissDots((prev) => [...prev, { id: dotId, x: xPct, y: yPct }]);
    const timer = window.setTimeout(() => {
      setMissDots((prev) => prev.filter((dot) => dot.id !== dotId));
      timersRef.current.delete(timer);
    }, 650);
    timersRef.current.add(timer);

    const nextMisses = missCount + 1;
    setMissCount(nextMisses);

    // Tránh trừ điểm nặng tay khi chạm lệch trên màn hình nhỏ: cứ 3 lần chạm trượt mới tính 1 lần sai.
    if (nextMisses % 3 === 0) {
      addWrong();
      haptic("error");
      if (!reduced && scope.current) {
        animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
      }
      setFeedback("Chạm trượt nhiều lần, hãy quan sát kỹ tranh Nay nhé.");
    } else {
      haptic("tap");
      setFeedback("Chỗ này chưa có điểm khác biệt.");
    }
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  function handleRevealAll() {
    if (allFound) return;
    haptic("success");
    setFoundIds(station.spots.map((spot) => spot.id));
    setFeedback("Đã chỉ tất cả các chỗ khác biệt. Bấm Hoàn thành để tiếp tục.");
    if (!reduced && scope.current) {
      animate(
        scope.current,
        { y: [0, -4, 0] },
        { duration: 0.3, ease: "easeOut" },
      );
    }
  }

  function handleComplete() {
    if (!checkSpotDiff(station, foundIds)) return;
    haptic("success");
    onDone(result(true));
  }

  const foundSet = new Set(foundIds);

  return (
    <section
      className={`rounded-lg border border-ink/15 bg-white/80 p-4 transition-shadow motion-reduce:transition-none hover:shadow-sm ${
        allFound
          ? "ring-2 ring-gold ring-offset-2 shadow-[0_0_16px_rgba(201,154,46,0.35)]"
          : ""
      }`}
    >
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.instruction}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          Chạm vào các điểm khác biệt trên tranh Nay.
        </p>
        <p
          aria-live="polite"
          className="inline-flex items-center rounded-full border border-river/25 bg-river/10 px-3 py-1 text-xs font-bold text-river"
        >
          Đã tìm {foundIds.length}/{station.spots.length}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Xưa
          </p>
          <div className="relative w-full overflow-hidden rounded-md border border-ink/20 bg-sand">
            {/* Tranh SVG tỷ lệ 16:10 dùng trực tiếp img để giữ đúng khung hiển thị đồng bộ với tranh Nay. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={toImgSrc(station.before)}
              alt="Tranh bờ sông Hàn ngày xưa"
              draggable={false}
              className="block h-auto w-full select-none"
            />
          </div>
        </div>

        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-terracotta">
            Nay
          </p>
          <div ref={scope} className="w-full">
            <div
              onClick={handleAfterClick}
              className="relative w-full touch-manipulation cursor-crosshair overflow-hidden rounded-md border border-terracotta/40 bg-sand"
            >
            {/* Dùng img trực tiếp để lấy chính xác kích thước ảnh hiển thị khi tính tọa độ chạm theo %. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={afterImgRef}
              src={toImgSrc(station.after)}
              alt="Tranh bờ sông Hàn ngày nay — chạm vào các chỗ đã thay đổi"
              draggable={false}
              className="block h-auto w-full select-none"
            />

            {station.spots
              .filter((spot) => foundSet.has(spot.id))
              .map((spot) => {
                const labelYClass =
                  spot.y > 85 ? "bottom-full mb-1" : "top-full mt-1";
                const labelXClass =
                  spot.x < 18
                    ? "left-0"
                    : spot.x > 82
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2";

                return (
                  <motion.div
                    key={spot.id}
                    aria-hidden="true"
                    initial={
                      reduced
                        ? { opacity: 0 }
                        : { scale: 0.7, opacity: 0 }
                    }
                    animate={{ scale: 1, opacity: 1 }}
                    transition={
                      reduced
                        ? { duration: 0.15 }
                        : { type: "spring", stiffness: 380, damping: 24 }
                    }
                    style={{
                      left: `${spot.x}%`,
                      top: `${spot.y}%`,
                      width: `${spot.r * 2}%`,
                    }}
                    className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-gold/20 shadow-[0_0_12px_rgba(201,154,46,0.55)]"
                  >
                    <span
                      className={`absolute whitespace-nowrap rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold leading-tight text-ink shadow-sm ${labelYClass} ${labelXClass}`}
                    >
                      {spot.label}
                    </span>
                  </motion.div>
                );
              })}

            <AnimatePresence>
              {missDots.map((dot) => (
                <motion.span
                  key={dot.id}
                  aria-hidden="true"
                  initial={{ opacity: 0.85, scale: reduced ? 1 : 0.7 }}
                  animate={{ opacity: 0, scale: reduced ? 1 : 1.25 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.15 : 0.6 }}
                  style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                  className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-terracotta/70 bg-terracotta/45"
                />
              ))}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <p role="status" className="mt-3 text-sm font-medium text-terracotta">
          {feedback}
        </p>
      )}

      {(allFound || allHintsUsed) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {allFound && (
            <div
              ref={completeWrapRef}
              tabIndex={-1}
              role="group"
              aria-label="Hoàn thành trạm"
              className="inline-flex rounded-md focus:outline-2 focus:outline-offset-2 focus:outline-terracotta"
            >
              <GlowButton
                type="button"
                onClick={handleComplete}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                Hoàn thành
              </GlowButton>
            </div>
          )}

          {!allFound && allHintsUsed && (
            <button
              type="button"
              onClick={handleRevealAll}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-terracotta/40 bg-sand px-4 py-2 text-sm font-semibold text-terracotta transition-colors motion-reduce:transition-none hover:bg-terracotta/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Tôi bỏ qua, chỉ cho tôi
            </button>
          )}
        </div>
      )}

      <HintBox
        revealedHints={revealedHints}
        hintsUsed={hintsUsed}
        totalHints={station.hints.length}
        onRequestHint={handleHint}
      />
    </section>
  );
}

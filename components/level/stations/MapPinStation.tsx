"use client";

import { useState, type FormEvent } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { GlowButton } from "@/components/fx/GlowButton";
import { checkMapPin } from "@/lib/activities/scoring";
import { haptic } from "@/lib/haptics";
import type { MapPinStation as MapPinStationType, StationResult } from "@/lib/types";
import { useAttempt } from "../useAttempt";
import { HintBox } from "../HintBox";

export interface MapPinStationProps {
  station: MapPinStationType;
  onDone: (result: StationResult) => void;
}

export function MapPinStation({ station, onDone }: MapPinStationProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);
  const [scope, animate] = useAnimate();
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pinKey, setPinKey] = useState(0);
  const [solvedGlow, setSolvedGlow] = useState(false);
  const { hintsUsed, nextHint, addWrong, result } = useAttempt(station.hints);

  function submitCoordinates(lat: number, lng: number) {
    setPinKey((k) => k + 1);
    const check = checkMapPin(station, { lat, lng });
    if (check.correct) {
      setFeedback(null);
      setSolvedGlow(true);
      haptic("success");
      onDone(result(true));
      return;
    }
    addWrong();
    haptic("error");
    if (!reduced && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, 0] }, { duration: 0.3 });
    }
    setFeedback(
      `Chưa đúng, còn cách khoảng ${Math.round(check.distance_m)} m`,
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const lat = Number.parseFloat(latInput);
    const lng = Number.parseFloat(lngInput);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      haptic("error");
      setFeedback("Vui lòng nhập vĩ độ và kinh độ hợp lệ.");
      return;
    }
    submitCoordinates(lat, lng);
  }

  function handleDemoPin() {
    haptic("tap");
    submitCoordinates(station.target.lat, station.target.lng);
  }

  function handleHint() {
    const hint = nextHint();
    if (hint !== null) {
      setRevealedHints((prev) => [...prev, hint]);
    }
  }

  const latId = `${station.id}-lat`;
  const lngId = `${station.id}-lng`;

  return (
    <section className="rounded-lg border border-ink/15 bg-white/80 p-4 transition-shadow hover:shadow-sm">
      <p className="text-base font-medium leading-relaxed text-ink">
        {station.clue}
      </p>
      <p className="mt-1 text-xs text-muted">Bản đồ sẽ có ở giai đoạn sau</p>

      <div
        aria-hidden="true"
        className={`relative mt-4 flex h-16 items-center justify-center overflow-hidden rounded-md border border-ink/10 bg-sand/40 ${
          solvedGlow
            ? "ring-2 ring-gold ring-offset-2 shadow-[0_0_16px_rgba(201,154,46,0.35)]"
            : ""
        }`}
      >
        {pinKey > 0 && (
          <div className="relative flex flex-col items-center justify-center">
            {!reduced && (
              <motion.span
                key={`ripple-${pinKey}`}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="pointer-events-none absolute bottom-0 h-4 w-4 rounded-full bg-terracotta/50"
              />
            )}
            <motion.span
              key={`pin-${pinKey}`}
              initial={reduced ? { opacity: 0 } : { y: -24, opacity: 0 }}
              animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
              transition={
                reduced
                  ? { duration: 0.15 }
                  : { type: "spring", stiffness: 300, damping: 12 }
              }
              className="relative flex flex-col items-center"
            >
              <span className="h-6 w-6 rounded-full bg-terracotta shadow-sm" />
              <span className="-mt-1.5 h-2.5 w-2.5 rotate-45 bg-terracotta" />
            </motion.span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <motion.div ref={scope} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={latId}
                className="block text-sm font-semibold text-ink"
              >
                Vĩ độ
              </label>
              <input
                id={latId}
                type="number"
                step="any"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                placeholder="Ví dụ: 16.06"
                className="mt-1 min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              />
            </div>

            <div>
              <label
                htmlFor={lngId}
                className="block text-sm font-semibold text-ink"
              >
                Kinh độ
              </label>
              <input
                id={lngId}
                type="number"
                step="any"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                placeholder="Ví dụ: 108.22"
                className="mt-1 min-h-11 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              />
            </div>
          </div>

          {feedback && (
            <p role="status" className="text-sm font-medium text-terracotta">
              {feedback}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <GlowButton
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Ghim
            </GlowButton>

            <button
              type="button"
              onClick={handleDemoPin}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Ghim đúng vị trí (chế độ demo)
            </button>
          </div>
        </motion.div>
      </form>

      <HintBox
        revealedHints={revealedHints}
        hintsUsed={hintsUsed}
        totalHints={station.hints.length}
        onRequestHint={handleHint}
      />
    </section>
  );
}

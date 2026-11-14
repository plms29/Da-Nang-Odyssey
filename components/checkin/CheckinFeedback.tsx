"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowButton } from "@/components/fx/GlowButton";
import { haptic } from "@/lib/haptics";
import type { Spot } from "@/lib/types";
import { formatDistance } from "./formatDistance";

export type CheckinFeedbackState =
  | { kind: "locating" }
  | { kind: "outside"; spot: Spot; distance_m: number }
  | { kind: "inaccurate"; accuracy_m: number }
  | { kind: "error"; message: string };

export interface CheckinFeedbackProps {
  state: CheckinFeedbackState;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onRetry: () => void;
  onRemote: () => void;
}

const SECONDARY_GLASS_BTN_CLASS =
  "fx-glass fx-glass--light inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl! border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20! focus-visible:outline-2 focus-visible:outline-river focus-visible:outline-offset-[3px]";

export function CheckinFeedback({
  state,
  headingRef,
  onRetry,
  onRemote,
}: CheckinFeedbackProps) {
  const reduceMotion = useReducedMotion();
  const lastHapticKindRef = useRef<CheckinFeedbackState["kind"] | null>(null);

  useEffect(() => {
    if (
      state.kind === "outside" ||
      state.kind === "inaccurate" ||
      state.kind === "error"
    ) {
      if (lastHapticKindRef.current !== state.kind) {
        lastHapticKindRef.current = state.kind;
        haptic("error");
      }
    } else {
      lastHapticKindRef.current = null;
    }
  }, [state.kind]);

  if (state.kind === "locating") {
    return (
      <GlassPanel
        as="section"
        tone="light"
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-4 rounded-2xl p-6 text-center lg:mx-auto lg:max-w-2xl lg:p-10"
      >
        <div className="relative flex h-20 w-20 items-center justify-center">
          {reduceMotion ? (
            <span
              aria-hidden="true"
              className="absolute inset-2 rounded-full border border-terracotta/30"
            />
          ) : (
            <>
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-2 border-terracotta/50"
                initial={{ scale: 0.55, opacity: 0.75 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-2 border-gold/60"
                initial={{ scale: 0.55, opacity: 0.75 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.9,
                }}
              />
            </>
          )}

          <span
            aria-hidden="true"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-terracotta/30 bg-terracotta/15 text-terracotta shadow-sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10Z" />
              <circle cx="12" cy="11" r="2.25" />
            </svg>
          </span>
        </div>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-base font-semibold text-ink focus:outline-none lg:text-lg"
        >
          Đang xác định vị trí…
        </h2>
      </GlassPanel>
    );
  }

  if (state.kind === "outside") {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${state.spot.checkin.lat},${state.spot.checkin.lng}`;

    return (
      <GlassPanel
        as="section"
        tone="light"
        className="space-y-4 rounded-2xl p-5 lg:mx-auto lg:max-w-2xl lg:p-8"
      >
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-ink focus:outline-none lg:text-xl"
        >
          Chưa ở trong điểm tham quan
        </h2>

        <div className="rounded-xl border border-ink/10 bg-sand/60 p-4">
          <p className="text-sm leading-relaxed text-ink">
            Bạn còn cách <strong>{state.spot.name}</strong> khoảng
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-terracotta lg:text-4xl">
            {formatDistance(state.distance_m)}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-river px-5 py-2.5 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Chỉ đường đến đây
          </a>

          <GlowButton
            type="button"
            onClick={onRetry}
            className="min-h-11 px-5 py-2.5 text-sm"
          >
            Thử lại
          </GlowButton>

          <button
            type="button"
            onClick={onRemote}
            className={SECONDARY_GLASS_BTN_CLASS}
          >
            Ghé thăm từ xa
          </button>
        </div>
      </GlassPanel>
    );
  }

  if (state.kind === "inaccurate") {
    return (
      <GlassPanel
        as="section"
        tone="light"
        className="space-y-4 rounded-2xl border border-terracotta/50 bg-terracotta/10! p-5 lg:mx-auto lg:max-w-2xl lg:p-8"
      >
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-ink focus:outline-none lg:text-xl"
        >
          Độ chính xác vị trí chưa đủ
        </h2>

        <p
          role="status"
          className="text-sm leading-relaxed text-ink"
        >
          Định vị chưa đủ chính xác (sai số khoảng{" "}
          {Math.round(state.accuracy_m)} m). Hãy ra chỗ thoáng và thử lại.
        </p>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
          <GlowButton
            type="button"
            onClick={onRetry}
            className="min-h-11 px-5 py-2.5 text-sm"
          >
            Thử lại
          </GlowButton>

          <button
            type="button"
            onClick={onRemote}
            className={SECONDARY_GLASS_BTN_CLASS}
          >
            Ghé thăm từ xa
          </button>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      as="section"
      tone="light"
      className="space-y-4 rounded-2xl border border-terracotta/50 bg-terracotta/10! p-5 lg:mx-auto lg:max-w-2xl lg:p-8"
    >
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-bold text-ink focus:outline-none lg:text-xl"
      >
        Chưa lấy được vị trí
      </h2>

      <p
        role="alert"
        className="text-sm leading-relaxed text-ink"
      >
        {state.message}
      </p>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
        <GlowButton
          type="button"
          onClick={onRemote}
          className="min-h-11 px-5 py-2.5 text-sm"
        >
          Ghé thăm từ xa
        </GlowButton>

        <button
          type="button"
          onClick={onRetry}
          className={SECONDARY_GLASS_BTN_CLASS}
        >
          Thử lại
        </button>
      </div>
    </GlassPanel>
  );
}

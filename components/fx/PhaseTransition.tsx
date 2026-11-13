"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { TransitionKind } from "@/lib/scene/types";
import { ParticleCanvas } from "@/components/fx/ParticleCanvas";

const COVER_MS = 400;
const HOLD_MS = 120;
const REVEAL_MS = 400;
const REDUCED_FADE_MS = 150;

const SMOKE_PUFFS: ReadonlyArray<{
  className: string;
  color: string;
  delayMs: number;
}> = [
  {
    className: "-left-12 bottom-[-10%] h-72 w-72",
    color: "rgba(31, 26, 23, 0.88)",
    delayMs: 0,
  },
  {
    className: "left-1/4 bottom-[-12%] h-80 w-80",
    color: "rgba(246, 239, 228, 0.92)",
    delayMs: 25,
  },
  {
    className: "right-[-10%] bottom-[-8%] h-72 w-72",
    color: "rgba(94, 81, 72, 0.9)",
    delayMs: 15,
  },
  {
    className: "-left-8 top-1/4 h-80 w-80",
    color: "rgba(246, 239, 228, 0.88)",
    delayMs: 45,
  },
  {
    className: "left-1/3 top-1/3 h-88 w-88",
    color: "rgba(31, 26, 23, 0.9)",
    delayMs: 35,
  },
  {
    className: "right-[-8%] top-1/5 h-80 w-80",
    color: "rgba(246, 239, 228, 0.9)",
    delayMs: 55,
  },
  {
    className: "left-1/6 -top-12 h-80 w-80",
    color: "rgba(94, 81, 72, 0.92)",
    delayMs: 65,
  },
];

export function PhaseTransition(props: {
  kind: TransitionKind;
  play: boolean;
  onCovered: () => void;
  onDone: () => void;
}) {
  const { kind, play, onCovered, onDone } = props;
  const reducedMotion = Boolean(useReducedMotion());
  const [phase, setPhase] = useState<"cover" | "reveal">("cover");
  const [done, setDone] = useState(false);

  const onCoveredRef = useRef(onCovered);
  const onDoneRef = useRef(onDone);
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    onCoveredRef.current = onCovered;
    onDoneRef.current = onDone;
    reducedMotionRef.current = reducedMotion;
  });

  const coveredFiredRef = useRef(false);
  const doneFiredRef = useRef(false);

  useEffect(() => {
    // If play goes false mid-cycle, it unmounts instantly and onDone may never fire.
    if (!play) {
      coveredFiredRef.current = false;
      doneFiredRef.current = false;
      const resetTimer = window.setTimeout(() => {
        setPhase("cover");
        setDone(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    if (doneFiredRef.current) {
      return;
    }

    const isReduced = reducedMotionRef.current;

    const startTimer = window.setTimeout(() => {
      setPhase("cover");
      setDone(false);
    }, 0);

    const coverDuration = isReduced ? REDUCED_FADE_MS : COVER_MS;
    const holdDuration = isReduced ? 0 : HOLD_MS;
    const revealDuration = isReduced ? REDUCED_FADE_MS : REVEAL_MS;

    const coveredTimer = window.setTimeout(() => {
      if (!coveredFiredRef.current) {
        coveredFiredRef.current = true;
        onCoveredRef.current();
      }
      if (holdDuration === 0) {
        setPhase("reveal");
      }
    }, coverDuration);

    const revealTimer =
      holdDuration > 0
        ? window.setTimeout(() => {
            setPhase("reveal");
          }, coverDuration + holdDuration)
        : undefined;

    const doneTimer = window.setTimeout(() => {
      if (!doneFiredRef.current) {
        doneFiredRef.current = true;
        setDone(true);
        // parent sets play=false in onDone
        onDoneRef.current();
      }
    }, coverDuration + holdDuration + revealDuration);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(coveredTimer);
      if (revealTimer !== undefined) {
        window.clearTimeout(revealTimer);
      }
      window.clearTimeout(doneTimer);
    };
  }, [play]);

  if (!play) {
    return null;
  }

  const isReveal = phase === "reveal";
  const pointerClass = done ? " pointer-events-none" : "";

  if (reducedMotion) {
    return (
      <motion.div
        aria-hidden="true"
        className={`fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] bg-sand${pointerClass}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isReveal ? 0 : 1 }}
        transition={{ duration: REDUCED_FADE_MS / 1000, ease: "easeInOut" }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] overflow-hidden${pointerClass}`}
      style={kind === "card-flip" ? { perspective: "1200px" } : undefined}
    >
      {kind === "dust-sweep" && (
        <div
          className={`pointer-events-none absolute -inset-1/2 ${
            isReveal ? "fx-dust-sweep-reveal" : "fx-dust-sweep-cover"
          }`}
          style={{
            background:
              "linear-gradient(135deg, rgba(201,154,46,0) 0%, rgba(201,154,46,0.96) 22%, #C99A2E 42%, #F6EFE4 68%, rgba(246,239,228,0) 100%)",
          }}
        >
          <ParticleCanvas
            preset="dust"
            play={play}
            className="pointer-events-none absolute inset-0"
          />
        </div>
      )}

      {kind === "smoke-cover" && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className={`absolute inset-0 ${
              isReveal ? "fx-smoke-backdrop-reveal" : "fx-smoke-backdrop-cover"
            }`}
            style={{
              background:
                "linear-gradient(180deg, rgba(31,26,23,1) 0%, rgba(94,81,72,1) 52%, rgba(246,239,228,1) 100%)",
            }}
          />
          {SMOKE_PUFFS.map((puff, index) => (
            <div
              key={index}
              className={`absolute rounded-full blur-2xl ${puff.className} ${
                isReveal ? "fx-smoke-puff-reveal" : "fx-smoke-puff-cover"
              }`}
              style={{
                backgroundColor: puff.color,
                animationDelay: isReveal ? "0ms" : `${puff.delayMs}ms`,
              }}
            />
          ))}
        </div>
      )}

      {kind === "card-flip" && (
        <>
          <div
            className={`pointer-events-none absolute inset-0 bg-terracotta ${
              isReveal ? "fx-card-backdrop-reveal" : "fx-card-backdrop-cover"
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-3 rounded-2xl border-4 border-gold bg-terracotta shadow-2xl ${
              isReveal ? "fx-card-flip-reveal" : "fx-card-flip-cover"
            }`}
          >
            <div className="absolute inset-3 rounded-xl border-2 border-gold/80 overflow-hidden">
              <svg
                aria-hidden="true"
                className="h-full w-full opacity-85"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="fx-card-diamond-lattice"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 2 L 38 20 L 20 38 L 2 20 Z"
                      fill="none"
                      stroke="#C99A2E"
                      strokeWidth="2"
                    />
                    <circle cx="20" cy="20" r="3.5" fill="#C99A2E" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#fx-card-diamond-lattice)" />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rotate-45 rounded-lg border-2 border-gold bg-terracotta/95 flex items-center justify-center shadow-md">
                <div className="h-12 w-12 rounded-sm border border-sand/80 bg-gold/30" />
              </div>
            </div>
          </div>
        </>
      )}

      {kind === "river-wipe" && (
        <div
          className={`pointer-events-none absolute inset-y-0 -left-16 -right-16 flex items-stretch ${
            isReveal ? "fx-river-wipe-reveal" : "fx-river-wipe-cover"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 64 800"
            preserveAspectRatio="none"
            className="h-full w-16 shrink-0 -mr-px"
          >
            <path
              d="M 64 0 L 28 0 Q 0 66 28 133 T 28 266 T 28 400 T 28 533 T 28 666 T 28 800 L 64 800 Z"
              fill="#1F4E6B"
            />
          </svg>
          <div className="flex-1 bg-river relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background:
                  "repeating-linear-gradient(90deg, transparent 0px, transparent 36px, rgba(246,239,228,0.22) 36px, rgba(246,239,228,0.22) 40px)",
              }}
            />
          </div>
          <svg
            aria-hidden="true"
            viewBox="0 0 64 800"
            preserveAspectRatio="none"
            className="h-full w-16 shrink-0 -ml-px"
          >
            <path
              d="M 0 0 L 36 0 Q 64 66 36 133 T 36 266 T 36 400 T 36 533 T 36 666 T 36 800 L 0 800 Z"
              fill="#1F4E6B"
            />
            <path
              d="M 28 0 Q 56 66 28 133 T 28 266 T 28 400 T 28 533 T 28 666 T 28 800"
              fill="none"
              stroke="#F6EFE4"
              strokeWidth="4"
              strokeOpacity="0.65"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

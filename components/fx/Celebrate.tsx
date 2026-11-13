"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { CelebrateKind } from "@/lib/scene/types";
import { ParticleCanvas } from "@/components/fx/ParticleCanvas";

const CELEBRATE_DURATION_MS = 2000;

export function Celebrate(props: { kind: CelebrateKind; play: boolean }) {
  const { kind, play } = props;
  const reducedMotion = Boolean(useReducedMotion());
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!play || reducedMotion) {
      const resetTimer = window.setTimeout(() => {
        setDone(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const startTimer = window.setTimeout(() => {
      setDone(false);
    }, 0);

    const endTimer = window.setTimeout(() => {
      setDone(true);
    }, CELEBRATE_DURATION_MS);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [play, reducedMotion]);

  if (reducedMotion || !play || done) {
    return null;
  }

  // Parent container must be relative.
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {kind === "gold-burst" && (
        <>
          <div
            className="pointer-events-none absolute inset-0 fx-celebrate-gold-burst"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, rgba(201, 154, 46, 0.65) 0%, rgba(201, 154, 46, 0.28) 34%, rgba(246, 239, 228, 0) 70%)",
            }}
          />
          <ParticleCanvas
            preset="burst"
            play={play}
            className="pointer-events-none absolute inset-0"
          />
        </>
      )}

      {kind === "flag-raise" && (
        <div className="pointer-events-none absolute bottom-6 right-5 h-60 w-36 fx-celebrate-flag-pole">
          <svg
            aria-hidden="true"
            viewBox="0 0 140 240"
            className="h-full w-full overflow-visible"
          >
            {/* Base and pole */}
            <rect x="114" y="18" width="5" height="210" rx="2.5" fill="#1F1A17" />
            <circle cx="116.5" cy="14" r="6" fill="#C99A2E" />
            <path d="M 102 228 L 131 228 L 126 220 L 107 220 Z" fill="#1F1A17" />

            {/* Rising flag group */}
            <g className="fx-celebrate-flag-raise">
              <g className="fx-celebrate-flag-wave">
                <path
                  d="M 18 24 Q 44 18 68 26 T 114 24 L 114 76 Q 88 82 64 74 T 18 76 Z"
                  fill="#A84825"
                  stroke="#C99A2E"
                  strokeWidth="3"
                />
                {/* Festive tails */}
                <path d="M 18 24 L 4 36 L 18 50 L 4 64 L 18 76 Z" fill="#C99A2E" />
                {/* Inner gold diamond */}
                <polygon
                  points="68,36 82,50 68,64 54,50"
                  fill="#C99A2E"
                  stroke="#F6EFE4"
                  strokeWidth="1.5"
                />
              </g>
            </g>
          </svg>
        </div>
      )}

      {kind === "drum-confetti" && (
        <>
          <ParticleCanvas
            preset="confetti"
            play={play}
            className="pointer-events-none absolute inset-0"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 120 110"
              className="h-28 w-28 fx-celebrate-drum"
            >
              {/* Shadow */}
              <ellipse cx="60" cy="98" rx="38" ry="7" fill="rgba(31, 26, 23, 0.22)" />
              {/* Terracotta drum body */}
              <path
                d="M 24 34 C 14 54, 14 72, 26 88 L 94 88 C 106 72, 106 54, 96 34 Z"
                fill="#A84825"
                stroke="#1F1A17"
                strokeWidth="2"
              />
              {/* Gold decorative bands */}
              <path
                d="M 20 55 Q 60 63 100 55"
                fill="none"
                stroke="#C99A2E"
                strokeWidth="3.5"
              />
              <path
                d="M 22 72 Q 60 80 98 72"
                fill="none"
                stroke="#C99A2E"
                strokeWidth="2.5"
              />
              {/* Bottom rim */}
              <ellipse
                cx="60"
                cy="88"
                rx="34"
                ry="8"
                fill="#A84825"
                stroke="#C99A2E"
                strokeWidth="3"
              />
              {/* Gold top rim + Sand drum head */}
              <ellipse
                cx="60"
                cy="34"
                rx="38"
                ry="12"
                fill="#F6EFE4"
                stroke="#C99A2E"
                strokeWidth="4"
              />
              {/* Traditional center sun/circle motif on drumhead */}
              <ellipse
                cx="60"
                cy="34"
                rx="16"
                ry="5"
                fill="none"
                stroke="#A84825"
                strokeWidth="2"
              />
              <circle cx="60" cy="34" r="3.5" fill="#C99A2E" />
              {/* Gold rim rivets */}
              <circle cx="30" cy="40" r="2" fill="#C99A2E" />
              <circle cx="44" cy="44" r="2" fill="#C99A2E" />
              <circle cx="60" cy="45.5" r="2" fill="#C99A2E" />
              <circle cx="76" cy="44" r="2" fill="#C99A2E" />
              <circle cx="90" cy="40" r="2" fill="#C99A2E" />
            </svg>
          </div>
        </>
      )}

      {kind === "fireworks" && (
        <>
          <div
            className="pointer-events-none absolute inset-0 fx-celebrate-sky-flash"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, rgba(246, 239, 228, 0.72) 0%, rgba(201, 154, 46, 0.45) 35%, rgba(168, 72, 37, 0.18) 62%, transparent 82%)",
            }}
          />
          <ParticleCanvas
            preset="fireworks"
            play={play}
            className="pointer-events-none absolute inset-0"
          />
        </>
      )}
    </div>
  );
}

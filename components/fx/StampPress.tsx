"use client";

import type React from "react";
import { useReducedMotion } from "motion/react";

export function StampPress(props: {
  play: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const { play, children, className } = props;
  const reducedMotion = Boolean(useReducedMotion());
  const shouldAnimate = play && !reducedMotion;

  return (
    <span className={`relative inline-block ${className ?? ""}`.trim()}>
      {shouldAnimate && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 rounded-full fx-stamp-ink-ring"
        />
      )}
      <span
        className={
          shouldAnimate
            ? "relative inline-block -rotate-3 fx-stamp-press-active"
            : "relative inline-block -rotate-3"
        }
      >
        {children}
      </span>
    </span>
  );
}

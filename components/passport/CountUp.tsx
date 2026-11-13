"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

export interface CountUpProps {
  value: number;
  duration?: number;
}

export function CountUp({ value, duration = 0.8 }: CountUpProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [display, setDisplay] = useState(() => (reducedMotion ? value : 0));

  useEffect(() => {
    if (reducedMotion) return;

    const controls = animate(0, value, {
      duration,
      onUpdate: (latest) => {
        setDisplay(Math.round(latest));
      },
      onComplete: () => {
        setDisplay(value);
      },
    });

    return () => {
      controls.stop();
    };
  }, [value, duration, reducedMotion]);

  const shown = reducedMotion ? value : display;

  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">{shown}</span>
    </>
  );
}

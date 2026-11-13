"use client";

import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useTilt } from "@/components/fx/useTilt";

export interface HoloFoilProps {
  variant?: "normal" | "gold";
  reduced?: boolean;
}

const FOIL_IMAGES: Record<"normal" | "gold", string> = {
  normal: [
    "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.32) 48%, rgba(255,255,255,0.48) 50%, rgba(255,255,255,0.32) 52%, transparent 70%)",
    "repeating-linear-gradient(125deg, rgba(201,154,46,0.22) 0%, rgba(56,178,172,0.20) 14%, rgba(232,138,176,0.20) 28%, rgba(246,239,228,0.22) 42%, rgba(201,154,46,0.22) 56%)",
  ].join(", "),
  gold: [
    "linear-gradient(115deg, transparent 28%, rgba(255,252,235,0.45) 47%, rgba(255,255,255,0.65) 50%, rgba(255,252,235,0.45) 53%, transparent 72%)",
    "repeating-linear-gradient(125deg, rgba(201,154,46,0.45) 0%, rgba(244,211,114,0.50) 10%, rgba(246,239,228,0.38) 20%, rgba(201,154,46,0.48) 30%, rgba(56,178,172,0.24) 40%, rgba(244,211,114,0.50) 50%, rgba(232,138,176,0.24) 60%, rgba(201,154,46,0.45) 70%)",
  ].join(", "),
};

const BASE_CLASS =
  "pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-color-dodge";

function DynamicFoil({ variant }: { variant: "normal" | "gold" }) {
  const { x, y } = useTilt();
  const posX = useTransform(x, (v) => 50 + v * 50);
  const posY = useTransform(y, (v) => 50 + v * 50);
  const backgroundPosition = useMotionTemplate`${posX}% ${posY}%`;

  return (
    <motion.span
      aria-hidden="true"
      className={BASE_CLASS}
      style={{
        backgroundImage: FOIL_IMAGES[variant],
        backgroundSize: "220% 220%",
        backgroundPosition,
      }}
    />
  );
}

/**
 * Holographic foil overlay for earned stamps, shifting with tilt when motion is allowed.
 */
export function HoloFoil({ variant = "normal", reduced }: HoloFoilProps) {
  const prefersReduced = Boolean(useReducedMotion());

  if (reduced || prefersReduced) {
    return (
      <span
        aria-hidden="true"
        className={BASE_CLASS}
        style={{ backgroundImage: FOIL_IMAGES[variant] }}
      />
    );
  }

  return <DynamicFoil variant={variant} />;
}

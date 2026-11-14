"use client";

export interface HoloFoilProps {
  variant?: "normal" | "gold";
  reduced?: boolean;
}

/**
 * Minimalist mode disables iridescent foil overlays on passport stamps.
 */
export function HoloFoil(props: HoloFoilProps): null {
  void props;
  return null;
}

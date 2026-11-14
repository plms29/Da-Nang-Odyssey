"use client";

import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { getSceneKit, sceneIdForSpot } from "@/lib/scene";

export interface ThemeScopeProps {
  spotId: string;
  className?: string;
  children: ReactNode;
}

export function ThemeScope({ spotId, className, children }: ThemeScopeProps) {
  const reduced = Boolean(useReducedMotion());
  const kit = getSceneKit(sceneIdForSpot(spotId));

  return (
    <div
      className={`relative ${className ?? ""}`.trim()}
      style={{ "--world-accent": kit.accent } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={kit.id}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.4, ease: "easeOut" }}
            className="absolute inset-0"
            style={{ background: kit.sky }}
          >
            <SceneBackdrop kit={kit} intensity="calm" />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "motion/react";
import { Celebrate } from "@/components/fx/Celebrate";
import { GlassPanel } from "@/components/fx/Glass";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { ZoomNavigate } from "@/components/fx/ZoomNavigate";
import { getSceneKit, sceneIdForLevel } from "@/lib/scene";
import type { Level } from "@/lib/types";

export interface UnlockRevealProps {
  levels: Level[];
}

export function UnlockReveal({ levels }: UnlockRevealProps) {
  const reducedMotion = Boolean(useReducedMotion());

  if (levels.length === 0) return null;

  return (
    <div role="status" className="space-y-3">
      {levels.map((level, index) => {
        const kit = getSceneKit(sceneIdForLevel(level));
        const card = (
          <GlassPanel
            as="div"
            tone="light"
            className="rounded-xl! border-2 bg-white/75! shadow-sm!"
            style={{ borderColor: kit.accent }}
          >
            <div className="relative p-4">
              {!reducedMotion && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]"
                >
                  <Celebrate kind={kit.celebrate} play={true} />
                </div>
              )}

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <div
                    aria-hidden="true"
                    className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg border-2 sm:h-20 sm:w-32"
                    style={{
                      background: kit.sky,
                      borderColor: kit.accent,
                    }}
                  >
                    <SceneBackdrop kit={kit} intensity="calm" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-terracotta">
                      Mở khóa địa điểm mới
                    </p>
                    <p className="break-words text-base font-bold text-ink lg:text-lg">
                      Màn {level.order}: {level.title}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <ZoomNavigate
                    href={`/kham-pha/${level.id}`}
                    sky={kit.sky}
                    label={level.title}
                    className="fx-glow-btn min-h-11 w-full px-4! py-2! text-sm sm:w-auto"
                  >
                    <span className="fx-glow-btn__glow" aria-hidden="true" />
                    <span className="fx-glow-btn__label">Khám phá ngay</span>
                  </ZoomNavigate>
                </div>
              </div>
            </div>
          </GlassPanel>
        );

        if (reducedMotion) {
          return <div key={level.id}>{card}</div>;
        }

        return (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: index * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {card}
          </motion.div>
        );
      })}
    </div>
  );
}

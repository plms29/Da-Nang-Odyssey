"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { usePassport } from "@/lib/passport/store";
import { getSceneKit, sceneIdForLevel } from "@/lib/scene";
import type { Level } from "@/lib/types";

export interface LevelCardProps {
  level: Level;
  delay?: number;
}

export function LevelCard({ level, delay = 0 }: LevelCardProps) {
  const reduced = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const stars = usePassport((s) => s.levels[level.id]?.stars);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  const kit = getSceneKit(sceneIdForLevel(level));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0.2 : 0.4,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={`/kham-pha/${level.id}`}
        className="group block overflow-hidden rounded-lg border border-ink/15 bg-white/80 transition-all hover:border-terracotta hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      >
        <div className="relative h-24 overflow-hidden rounded-t-lg">
          <SceneBackdrop kit={kit} intensity="calm" />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold tracking-wider text-terracotta uppercase">
              Màn {level.order}
            </span>
            <div className="flex items-center gap-2">
              {level.status === "draft" && (
                <span className="rounded-sm border border-gold/60 bg-gold/20 px-2 py-0.5 text-xs font-semibold text-ink">
                  Nội dung nháp
                </span>
              )}
              {!hydrated ? (
                <span aria-hidden="true" className="inline-block h-4 w-14" />
              ) : stars !== undefined ? (
                <span
                  role="img"
                  aria-label={`${stars} trên 3 sao`}
                  className="text-lg leading-none tracking-widest text-terracotta"
                >
                  <span aria-hidden="true">
                    {"★".repeat(stars) + "☆".repeat(3 - stars)}
                  </span>
                </span>
              ) : (
                <span className="text-xs font-medium text-muted">
                  Chưa chơi
                </span>
              )}
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ink group-hover:text-terracotta">
              {level.title}
            </h2>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-terracotta"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

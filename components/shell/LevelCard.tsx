"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { KineticText } from "@/components/fx/KineticText";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { TiltCard } from "@/components/fx/TiltCard";
import { ZoomNavigate } from "@/components/fx/ZoomNavigate";
import { getLevels } from "@/lib/content";
import { usePassport } from "@/lib/passport/store";
import { getSceneKit, sceneIdForLevel } from "@/lib/scene";
import { isLevelUnlocked } from "@/lib/story";
import type { Level } from "@/lib/types";

export interface LevelCardProps {
  level: Level;
  levels?: Level[];
  delay?: number;
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function LevelCard({ level, levels, delay = 0 }: LevelCardProps) {
  const reduced = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const levelProgress = usePassport((s) => s.levels);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  const allLevels = levels ?? getLevels();
  const effectiveDone = hydrated ? levelProgress : {};
  const unlocked = isLevelUnlocked(allLevels, effectiveDone, level.id);
  const locked = hydrated && !unlocked;
  const stars = hydrated ? levelProgress[level.id]?.stars : undefined;

  const kit = getSceneKit(sceneIdForLevel(level));

  const cardBody = (
    <>
      <div className="relative h-[140px] lg:h-56 overflow-hidden rounded-t-lg">
        <SceneBackdrop
          kit={kit}
          intensity="calm"
          className={
            locked
              ? "opacity-70 grayscale-[35%]"
              : "lg:transition-transform lg:duration-500 lg:group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          }
        />
        <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 text-xs font-bold tracking-wider text-ink uppercase backdrop-blur-md">
          Màn {level.order}
        </span>
        {locked && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/70 text-ink backdrop-blur-md"
          >
            <LockIcon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <KineticText
            as="h2"
            className={
              locked
                ? "text-base lg:text-2xl font-bold text-ink/70"
                : "text-base lg:text-2xl font-bold text-ink group-hover:text-terracotta"
            }
            stagger={0.02}
          >
            {level.title}
          </KineticText>
          {unlocked ? (
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
          ) : locked ? (
            <LockIcon className="h-4 w-4 shrink-0 text-muted" />
          ) : null}
        </div>

        {level.page && (
          <p className="mt-1 text-xs font-medium text-muted lg:text-sm">
            {level.page}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          {level.status === "draft" && (
            <span className="rounded-sm border border-gold/60 bg-gold/20 px-2 py-0.5 text-xs font-semibold text-ink">
              Nội dung nháp
            </span>
          )}
          {!hydrated ? (
            <span aria-hidden="true" className="inline-block h-4 w-14 rounded bg-ink/10" />
          ) : !unlocked ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
              <LockIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Xong trang trước để mở</span>
            </span>
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
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0.2 : 0.35,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {unlocked ? (
        <TiltCard as="article" max={6}>
          <ZoomNavigate
            href={`/kham-pha/${level.id}`}
            sky={kit.sky}
            label={level.title}
            className="group block overflow-hidden rounded-lg border border-ink/15 bg-white/80 transition-colors lg:transition-[background-color,border-color,translate] lg:hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 hover:border-terracotta hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            {cardBody}
          </ZoomNavigate>
        </TiltCard>
      ) : locked ? (
        <article>
          <div
            role="group"
            aria-disabled="true"
            className="block cursor-not-allowed overflow-hidden rounded-lg border border-ink/10 bg-white/55 opacity-70"
          >
            <span className="sr-only">Chưa mở khóa.</span>
            {cardBody}
          </div>
        </article>
      ) : (
        <article>
          <div className="block overflow-hidden rounded-lg border border-ink/15 bg-white/80">
            {cardBody}
          </div>
        </article>
      )}
    </motion.div>
  );
}

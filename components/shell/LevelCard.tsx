"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { KineticText } from "@/components/fx/KineticText";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { TiltCard } from "@/components/fx/TiltCard";
import { ZoomNavigate } from "@/components/fx/ZoomNavigate";
import { getLevels } from "@/lib/content";
import { haptic } from "@/lib/haptics";
import {
  demoUnlockAll,
  isLevelUnlocked,
  requiredLevel,
} from "@/lib/level/unlock";
import { usePassport } from "@/lib/passport/store";
import { getSceneKit, sceneIdForLevel } from "@/lib/scene";
import type { Level } from "@/lib/types";

export interface LevelCardProps {
  level: Level;
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
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function LockOpenIcon({ className }: { className?: string }) {
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
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.6-1.7" />
    </svg>
  );
}

export function LevelCard({ level, delay = 0 }: LevelCardProps) {
  const reduced = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [demo, setDemo] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [unlockPulse, setUnlockPulse] = useState(false);
  const [shakeScope, animateShake] = useAnimate();
  const reqId = useId();
  const levels = usePassport((s) => s.levels);

  useEffect(() => {
    setDemo(demoUnlockAll(window.location.search));
    const done = () => setHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  const locked = hydrated && !isLevelUnlocked(level, { levels }, demo);
  const reallyUnlocked = isLevelUnlocked(level, { levels });
  const hasUnlockRule = Boolean(level.unlock);
  const stars = hydrated ? levels[level.id]?.stars : undefined;
  const required = useMemo(
    () => (hasUnlockRule ? requiredLevel(level, getLevels()) : undefined),
    [hasUnlockRule, level],
  );

  useEffect(() => {
    if (!hydrated || demo || !reallyUnlocked || !level.unlock) return;
    const key = `dn-unlock-seen:${level.id}`;
    try {
      if (window.localStorage.getItem(key) === "1") return;
      window.localStorage.setItem(key, "1");
    } catch {
      // Ignore storage errors in restricted environments.
    }
    if (reduced) return;
    setUnlockPulse(true);
  }, [hydrated, demo, reallyUnlocked, level.unlock, level.id, reduced]);

  useEffect(() => {
    if (!unlockPulse) return;
    const timer = window.setTimeout(() => setUnlockPulse(false), 1800);
    return () => window.clearTimeout(timer);
  }, [unlockPulse]);

  const kit = getSceneKit(sceneIdForLevel(level));

  function handleLockedTap() {
    haptic("error");
    setTapCount((c) => c + 1);
    if (!reduced && shakeScope.current) {
      animateShake(
        shakeScope.current,
        { x: [0, -8, 8, -5, 5, 0] },
        { duration: 0.32 },
      );
    }
  }

  const requirementText = required
    ? `Hoàn thành Màn ${required.order}: ${required.title} để mở`
    : "Hoàn thành màn trước để mở";

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
      {locked ? (
        <article ref={shakeScope} className="relative">
          <button
            type="button"
            aria-describedby={reqId}
            onClick={handleLockedTap}
            className="block min-h-11 w-full cursor-pointer overflow-hidden rounded-lg border border-ink/15 bg-white/70 text-left transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta motion-reduce:transition-none"
          >
            <div className="relative h-[140px] lg:h-56 overflow-hidden rounded-t-lg bg-ink/10">
              <div className="pointer-events-none absolute inset-0 opacity-45 grayscale">
                <SceneBackdrop kit={kit} intensity="calm" />
              </div>
              <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-white/55 px-2.5 py-1 text-xs font-bold tracking-wider text-ink/75 uppercase backdrop-blur-md">
                Màn {level.order}
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/80 shadow-sm backdrop-blur-sm">
                  <LockIcon className="h-5 w-5" />
                </span>
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-base lg:text-2xl font-bold text-ink/80">
                  {level.title}
                </span>
                <LockIcon className="h-4 w-4 shrink-0 text-muted" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {level.status === "draft" && (
                  <span className="rounded-sm border border-gold/60 bg-gold/20 px-2 py-0.5 text-xs font-semibold text-ink">
                    Nội dung nháp
                  </span>
                )}
                <p id={reqId} className="text-xs font-medium text-muted">
                  {requirementText}
                </p>
              </div>
            </div>
          </button>
          <p
            role="status"
            className={
              tapCount > 0
                ? "mt-2 rounded-md border border-terracotta/30 bg-terracotta/10 px-2.5 py-1.5 text-xs font-semibold text-terracotta"
                : "sr-only"
            }
          >
            {tapCount > 0
              ? `Địa điểm này đang khóa. ${requirementText}.${tapCount % 2 === 0 ? "\u00A0" : ""}`
              : ""}
          </p>
        </article>
      ) : (
        <TiltCard as="article" max={6}>
          <ZoomNavigate
            href={`/kham-pha/${level.id}`}
            sky={kit.sky}
            label={level.title}
            className={`group block overflow-hidden rounded-lg border border-ink/15 bg-white/80 transition-[background-color,border-color,box-shadow] lg:transition-[background-color,border-color,translate,box-shadow] lg:hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 hover:border-terracotta hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
              unlockPulse
                ? "ring-2 ring-gold ring-offset-2 shadow-[0_0_24px_rgba(201,154,46,0.45)]"
                : ""
            }`}
          >
            <div className="relative h-[140px] lg:h-56 overflow-hidden rounded-t-lg">
              <SceneBackdrop
                kit={kit}
                intensity="calm"
                className="lg:transition-transform lg:duration-500 lg:group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 text-xs font-bold tracking-wider text-ink uppercase backdrop-blur-md">
                Màn {level.order}
              </span>
              {unlockPulse && (
                <motion.span
                  aria-hidden="true"
                  initial={{ opacity: 1, scale: 0.9 }}
                  animate={{ opacity: 0, scale: 1.35, y: -6 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-gold/25 text-gold shadow-[0_0_20px_rgba(201,154,46,0.5)] backdrop-blur-sm">
                    <LockOpenIcon className="h-6 w-6" />
                  </span>
                </motion.span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <KineticText
                  as="h2"
                  className="text-base lg:text-2xl font-bold text-ink group-hover:text-terracotta"
                  stagger={0.02}
                >
                  {level.title}
                </KineticText>
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
              <div className="mt-2 flex items-center gap-2">
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
          </ZoomNavigate>
        </TiltCard>
      )}
    </motion.div>
  );
}

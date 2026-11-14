"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowLink } from "@/components/fx/GlowButton";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { getLevels } from "@/lib/content";
import {
  demoUnlockAll,
  isLevelOpen,
  requiredLevel,
} from "@/lib/level/unlock";
import { usePassport } from "@/lib/passport/store";
import { getSceneKit, sceneIdForLevel } from "@/lib/scene";
import type { Level } from "@/lib/types";

export interface LockedLevelProps {
  level: Level;
  required?: Level;
}

export interface LevelGateProps {
  level: Level;
  required?: Level;
  children: ReactNode;
}

export function LockedLevel({ level, required }: LockedLevelProps) {
  const reduced = Boolean(useReducedMotion());
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const kit = getSceneKit(sceneIdForLevel(level));
  const resolvedRequired = required ?? requiredLevel(level, getLevels());

  return (
    <motion.section
      aria-labelledby="locked-level-heading"
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0 : 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mx-auto max-w-2xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        style={{ background: kit.sky }}
      >
        <div className="absolute inset-0 opacity-55 grayscale contrast-90 brightness-75">
          <SceneBackdrop kit={kit} intensity="calm" godRays={false} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, transparent 15%, rgba(31, 26, 23, 0.55) 100%)",
          }}
        />
      </div>

      <GlassPanel
        tone="light"
        className="relative z-10 flex flex-col items-center rounded-2xl! bg-sand/75! px-6 py-10 text-center sm:px-10 sm:py-12"
      >
        <div
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-ink/15 bg-sand/90 text-terracotta shadow-sm"
          style={{ borderColor: kit.accent }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>

        <h2
          id="locked-level-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 text-xl font-bold tracking-tight text-ink focus:outline-none sm:text-2xl"
        >
          Địa điểm chưa mở
        </h2>

        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/90 sm:text-base">
          {resolvedRequired
            ? `Hoàn thành Màn ${resolvedRequired.order}: ${resolvedRequired.title} để mở ${level.title}`
            : `Hoàn thành màn trước để mở ${level.title}`}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {resolvedRequired && (
            <GlowLink
              href={`/kham-pha/${resolvedRequired.id}`}
              className="min-h-11 px-5 py-2.5 text-sm"
            >
              {`Chơi Màn ${resolvedRequired.order}: ${resolvedRequired.title}`}
            </GlowLink>
          )}
          <Link
            href="/kham-pha"
            className="fx-glass fx-glass--light inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Về danh sách màn
          </Link>
        </div>
      </GlassPanel>
    </motion.section>
  );
}

export function LevelGate({ level, required, children }: LevelGateProps) {
  const [hydrated, setHydrated] = useState(false);
  const [demoUnlock, setDemoUnlock] = useState(false);
  const [demoChecked, setDemoChecked] = useState(false);
  const levels = usePassport((s) => s.levels);

  useEffect(() => {
    setDemoUnlock(demoUnlockAll(window.location.search));
    setDemoChecked(true);

    const done = () => setHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  if (!hydrated || !demoChecked) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex min-h-[260px] max-w-2xl items-center justify-center rounded-2xl border border-ink/10 bg-sand/60 p-6 text-center text-sm font-medium text-muted"
      >
        Đang mở màn…
      </div>
    );
  }

  const unlocked = isLevelOpen(level, getLevels(), { levels }, demoUnlock);
  if (unlocked) {
    return <>{children}</>;
  }

  return <LockedLevel level={level} required={required} />;
}

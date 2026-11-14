"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { TiltCard } from "@/components/fx/TiltCard";
import { usePassport } from "@/lib/passport/store";
import { getSceneKit, sceneIdForLevel } from "@/lib/scene";
import type { Level } from "@/lib/types";

export interface LevelCardProps {
  level: Level;
}

export function LevelCard({ level }: LevelCardProps) {
  const [hydrated, setHydrated] = useState(false);
  const stars = usePassport((s) => s.levels[level.id]?.stars);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  const kit = getSceneKit(sceneIdForLevel(level));

  return (
    <TiltCard as="article" max={6} className="h-full">
      <Link
        href={`/kham-pha/${level.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface/95 text-ink backdrop-blur-md transition-colors hover:border-ink/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      >
        <div className="relative h-[140px] overflow-hidden rounded-t-xl bg-sand lg:h-56">
          <SceneBackdrop
            kit={kit}
            intensity="calm"
            className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span className="absolute top-3 left-3 z-10 rounded-full border border-white/20 bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            Màn {level.order}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between bg-surface/95 p-4 text-ink">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-ink transition-colors group-hover:text-terracotta lg:text-lg">
                {level.title}
              </h2>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            {kit.subtitle && (
              <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                {kit.subtitle}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center">
            {!hydrated ? (
              <span aria-hidden="true" className="inline-block h-4 w-20" />
            ) : stars !== undefined ? (
              <span
                role="img"
                aria-label={`${stars} trên 3 sao`}
                className="inline-flex items-center gap-1 text-terracotta"
              >
                {[1, 2, 3].map((n) => (
                  <svg
                    key={n}
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill={n <= stars ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className={
                      n <= stars
                        ? "h-4 w-4 text-terracotta"
                        : "h-4 w-4 text-muted/40"
                    }
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                ))}
              </span>
            ) : (
              <span className="text-xs font-medium text-muted">
                Chưa khám phá
              </span>
            )}
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

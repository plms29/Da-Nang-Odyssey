"use client";

import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/fx/Glass";
import { usePassport } from "@/lib/passport/store";
import { pagesFound } from "@/lib/story";
import type { Level } from "@/lib/types";

export interface PageProgressProps {
  levels: Level[];
}

export function PageProgress({ levels }: PageProgressProps) {
  const [hydrated, setHydrated] = useState(false);
  const levelProgress = usePassport((s) => s.levels);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  const sortedLevels = levels.slice().sort((a, b) => a.order - b.order);
  const total = sortedLevels.length;
  const done = hydrated ? levelProgress : {};
  const found = pagesFound(sortedLevels, done);

  return (
    <GlassPanel
      as="section"
      tone="light"
      aria-label="Tiến độ tìm trang sổ tay"
      className="rounded-lg p-3.5 lg:p-4"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live={hydrated ? "polite" : undefined}
          className="text-sm font-bold text-ink lg:text-base"
        >
          Đã tìm {found}/{total} trang sổ
        </p>

        <ol
          className="grid grid-cols-6 gap-1.5 sm:flex sm:items-center sm:gap-2"
          aria-label="Danh sách các trang sổ tay"
        >
          {sortedLevels.map((level) => {
            const isFound = pagesFound([level], done) > 0;
            const pageLabel = level.page ?? `Trang ${level.order}: ${level.title}`;

            return (
              <li key={level.id}>
                <div
                  title={pageLabel}
                  className={`flex h-9 items-center justify-center gap-1 rounded-sm border px-1.5 text-xs font-bold transition-colors motion-reduce:transition-none sm:w-10 ${
                    isFound
                      ? "border-gold bg-gold/35 text-ink shadow-xs"
                      : "border-ink/15 bg-sand/70 text-muted"
                  }`}
                >
                  <span className="sr-only">
                    {pageLabel}: {isFound ? "đã tìm thấy" : "chưa tìm"}
                  </span>
                  <span aria-hidden="true">{level.order}</span>
                  {isFound && (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 shrink-0 text-terracotta"
                      aria-hidden="true"
                    >
                      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                    </svg>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </GlassPanel>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Celebrate } from "@/components/fx/Celebrate";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowLink } from "@/components/fx/GlowButton";
import { usePassport } from "@/lib/passport/store";
import { getStory, pagesFound } from "@/lib/story";
import type { Level } from "@/lib/types";

const COLLAPSE_STORAGE_KEY = "dn-guide-intro-collapsed";
const CELEBRATED_SESSION_KEY = "dn-guide-intro-celebrated";

export interface GuideIntroProps {
  levels: Level[];
}

function HanAvatar() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-12 w-12 shrink-0 lg:h-14 lg:w-14"
      aria-hidden="true"
    >
      {/* Background river-sky circle */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="#F6EFE4"
        stroke="#C99A2E"
        strokeWidth="2"
      />
      {/* Hair back */}
      <path
        d="M19 30 C19 42, 22 48, 25 50 L39 50 C42 48, 45 42, 45 30 Z"
        fill="#1F1A17"
      />
      {/* Áo dài collar & shoulders */}
      <path
        d="M16 57 C18 47, 25 44, 32 44 C39 44, 46 47, 48 57 Z"
        fill="#A84825"
      />
      <path d="M28 44 L32 49 L36 44" fill="#F6EFE4" />
      {/* Face */}
      <circle cx="32" cy="34" r="10.5" fill="#F6D7B8" />
      {/* Eyes & gentle smile */}
      <circle cx="28.2" cy="34.5" r="1.2" fill="#1F1A17" />
      <circle cx="35.8" cy="34.5" r="1.2" fill="#1F1A17" />
      <path
        d="M29.5 38.5 Q32 40.8 34.5 38.5"
        fill="none"
        stroke="#A84825"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Rosy cheeks */}
      <circle cx="25.8" cy="36.5" r="1.6" fill="#A84825" opacity="0.25" />
      <circle cx="38.2" cy="36.5" r="1.6" fill="#A84825" opacity="0.25" />
      {/* Nón lá (conical hat) */}
      <polygon
        points="32,8 8,29 56,29"
        fill="#E6C67A"
        stroke="#C99A2E"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Nón lá ribs */}
      <line x1="32" y1="9" x2="20" y2="29" stroke="#C99A2E" strokeWidth="1" opacity="0.7" />
      <line x1="32" y1="9" x2="32" y2="29" stroke="#C99A2E" strokeWidth="1" opacity="0.7" />
      <line x1="32" y1="9" x2="44" y2="29" stroke="#C99A2E" strokeWidth="1" opacity="0.7" />
      {/* Chin strap */}
      <path
        d="M21 29 Q24 41 32 43 Q40 41 43 29"
        fill="none"
        stroke="#A84825"
        strokeWidth="1.2"
        opacity="0.7"
      />
    </svg>
  );
}

export function GuideIntro({ levels }: GuideIntroProps) {
  const reduced = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedLoaded, setCollapsedLoaded] = useState(false);
  const [shouldCelebrate, setShouldCelebrate] = useState(false);
  const levelProgress = usePassport((s) => s.levels);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (saved === "1") {
        setCollapsed(true);
      }
    } catch {
      // Ignore storage errors (private mode or blocked).
    } finally {
      setCollapsedLoaded(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage errors.
      }
      return next;
    });
  };

  const story = getStory();
  const total = levels.length;
  const found = hydrated ? pagesFound(levels, levelProgress) : 0;
  const completedAll = hydrated && total > 0 && found >= total;
  const paragraphs = completedAll ? story.epilogue : story.prologue;

  useEffect(() => {
    if (!completedAll) return;
    try {
      if (sessionStorage.getItem(CELEBRATED_SESSION_KEY) === "1") {
        return;
      }
      sessionStorage.setItem(CELEBRATED_SESSION_KEY, "1");
    } catch {
      // Ignore storage errors (private mode or blocked).
    }
    setShouldCelebrate(true);
  }, [completedAll]);

  return (
    <GlassPanel
      as="section"
      tone="light"
      aria-label={`Lời kể của ${story.guide.name}`}
      className="relative overflow-hidden rounded-lg p-4 lg:p-6"
    >
      <Celebrate kind="gold-burst" play={shouldCelebrate} />

      <p className="sr-only" aria-live="polite">
        {completedAll ? `Đã tìm đủ ${total} trang sổ tay` : ""}
      </p>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <HanAvatar />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-ink lg:text-lg">
                  {story.guide.name}
                </h2>
                {completedAll && (
                  <span className="rounded-full border border-gold/70 bg-gold/25 px-2.5 py-0.5 text-xs font-semibold text-ink">
                    Đủ {total}/{total} trang
                  </span>
                )}
              </div>
              <p className="text-xs leading-snug text-muted lg:text-sm">
                {story.guide.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="guide-intro-body"
            aria-label={
              collapsed
                ? "Mở rộng lời kể của Hàn"
                : "Thu gọn lời kể của Hàn"
            }
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-ink/15 bg-white/70 px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-terracotta hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta motion-reduce:transition-none"
          >
            <span>{collapsed ? "Mở rộng" : "Thu gọn"}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 ${
                reduced ? "" : "transition-transform duration-200"
              } ${collapsed ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>

        {collapsedLoaded && !collapsed && (
          <div
            id="guide-intro-body"
            className="mt-3 space-y-2 border-t border-ink/10 pt-3 text-sm leading-relaxed text-ink lg:text-base"
          >
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}

            {completedAll && (
              <div className="pt-2">
                <GlowLink
                  href="/ho-chieu"
                  className="min-h-11 px-5 text-sm font-semibold"
                >
                  Xem hộ chiếu văn hóa
                </GlowLink>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

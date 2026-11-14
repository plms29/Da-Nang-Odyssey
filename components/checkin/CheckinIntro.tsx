"use client";

import type { RefObject } from "react";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowButton } from "@/components/fx/GlowButton";
import { KineticText } from "@/components/fx/KineticText";
import type { Spot } from "@/lib/types";

export interface CheckinIntroProps {
  requestedSpot: Spot | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onLocate: () => void;
}

export function CheckinIntro({
  requestedSpot,
  headingRef,
  onLocate,
}: CheckinIntroProps) {
  const headingText = requestedSpot
    ? `Check-in tại chỗ: ${requestedSpot.name}`
    : "Check-in tại chỗ";

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <GlassPanel
        as="section"
        tone="light"
        className="rounded-2xl! p-4 lg:p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-terracotta/25 bg-terracotta/10 text-terracotta"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10Z" />
                <circle cx="12" cy="11" r="2.25" />
              </svg>
            </span>

            <div className="space-y-1">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-lg font-bold text-ink focus:outline-none lg:text-xl"
              >
                <KineticText as="span" shimmer>
                  {headingText}
                </KineticText>
              </h2>

              <p className="text-sm leading-relaxed text-ink/90">
                Đứng tại điểm tham quan để nhận dấu ĐÃ ĐẾN
              </p>
            </div>
          </div>

          <GlowButton
            type="button"
            onClick={onLocate}
            className="min-h-11 shrink-0 px-5 py-2.5 text-sm"
          >
            Xác định vị trí
          </GlowButton>
        </div>
      </GlassPanel>
    </div>
  );
}

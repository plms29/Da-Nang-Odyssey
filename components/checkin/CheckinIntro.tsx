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
  onRemote: () => void;
}

export function CheckinIntro({
  requestedSpot,
  headingRef,
  onLocate,
  onRemote,
}: CheckinIntroProps) {
  const headingText = requestedSpot
    ? `Check-in tại ${requestedSpot.name}`
    : "Xác định điểm tham quan";

  return (
    <GlassPanel
      as="section"
      tone="light"
      className="space-y-5 rounded-2xl p-5 lg:mx-auto lg:max-w-2xl lg:p-8"
    >
      <div className="flex items-start gap-3.5">
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

        <div className="space-y-1.5">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-bold text-ink focus:outline-none lg:text-2xl"
          >
            <KineticText as="span" shimmer>
              {headingText}
            </KineticText>
          </h2>

          <p className="text-sm leading-relaxed text-ink/90 lg:text-base">
            Ứng dụng dùng vị trí một lần để biết bạn đang ở điểm nào. Tọa độ
            không được lưu hay gửi đi.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
        <GlowButton
          type="button"
          onClick={onLocate}
          className="min-h-11 px-5 py-2.5 text-sm"
        >
          Xác định vị trí
        </GlowButton>

        <button
          type="button"
          onClick={onRemote}
          className="fx-glass fx-glass--light inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl! border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20! focus-visible:outline-2 focus-visible:outline-river focus-visible:outline-offset-[3px]"
        >
          Ghé thăm từ xa
        </button>
      </div>
    </GlassPanel>
  );
}

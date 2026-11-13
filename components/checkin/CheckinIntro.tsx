import type { RefObject } from "react";
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
  return (
    <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-5">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-bold text-ink focus:outline-none"
      >
        {requestedSpot
          ? `Check-in tại ${requestedSpot.name}`
          : "Xác định điểm tham quan"}
      </h2>

      <p className="text-sm leading-relaxed text-ink">
        Ứng dụng dùng vị trí một lần để biết bạn đang ở điểm nào. Tọa độ không
        được lưu hay gửi đi.
      </p>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onLocate}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2.5 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Xác định vị trí
        </button>

        <button
          type="button"
          onClick={onRemote}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Ghé thăm từ xa
        </button>
      </div>
    </section>
  );
}

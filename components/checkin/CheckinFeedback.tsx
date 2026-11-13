import type { RefObject } from "react";
import type { Spot } from "@/lib/types";
import { formatDistance } from "./formatDistance";

export type CheckinFeedbackState =
  | { kind: "locating" }
  | { kind: "outside"; spot: Spot; distance_m: number }
  | { kind: "inaccurate"; accuracy_m: number }
  | { kind: "error"; message: string };

export interface CheckinFeedbackProps {
  state: CheckinFeedbackState;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onRetry: () => void;
  onRemote: () => void;
}

export function CheckinFeedback({
  state,
  headingRef,
  onRetry,
  onRemote,
}: CheckinFeedbackProps) {
  if (state.kind === "locating") {
    return (
      <section
        role="status"
        className="flex flex-col items-center gap-3 rounded-lg border border-ink/15 bg-white/80 p-6 text-center"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="h-8 w-8 animate-spin text-terracotta"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" className="opacity-25" />
          <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
        </svg>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-base font-semibold text-ink focus:outline-none"
        >
          Đang xác định vị trí…
        </h2>
      </section>
    );
  }

  if (state.kind === "outside") {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${state.spot.checkin.lat},${state.spot.checkin.lng}`;

    return (
      <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-5">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-ink focus:outline-none"
        >
          Chưa ở trong điểm tham quan
        </h2>

        <p className="text-sm leading-relaxed text-ink">
          Bạn còn cách <strong>{state.spot.name}</strong> khoảng{" "}
          <strong>{formatDistance(state.distance_m)}</strong>
        </p>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-river px-5 py-2.5 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Chỉ đường đến đây
          </a>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2.5 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Thử lại
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

  if (state.kind === "inaccurate") {
    return (
      <section className="space-y-4 rounded-lg border border-gold/60 bg-white/80 p-5">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-ink focus:outline-none"
        >
          Độ chính xác vị trí chưa đủ
        </h2>

        <p
          role="status"
          className="text-sm leading-relaxed text-ink"
        >
          Định vị chưa đủ chính xác (sai số khoảng{" "}
          {Math.round(state.accuracy_m)} m). Hãy ra chỗ thoáng và thử lại.
        </p>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2.5 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Thử lại
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

  return (
    <section className="space-y-4 rounded-lg border border-terracotta/40 bg-white/80 p-5">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-bold text-ink focus:outline-none"
      >
        Chưa lấy được vị trí
      </h2>

      <p
        role="alert"
        className="text-sm leading-relaxed text-ink"
      >
        {state.message}
      </p>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onRemote}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-river px-5 py-2.5 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Ghé thăm từ xa
        </button>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Thử lại
        </button>
      </div>
    </section>
  );
}

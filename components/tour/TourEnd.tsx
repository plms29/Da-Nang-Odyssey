"use client";

import { useEffect, useMemo, useRef, type Dispatch } from "react";
import Link from "next/link";
import { getSpot, levelForSpot } from "@/lib/content";
import { usePassport } from "@/lib/passport/store";
import { listenedSpotIds, type TourAction, type TourState } from "@/lib/tour/player";
import type { Spot } from "@/lib/types";

export interface TourEndProps {
  state: TourState;
  spots: Spot[];
  dispatch: Dispatch<TourAction>;
}

export function TourEnd({ state, spots, dispatch }: TourEndProps) {
  const stampedRef = useRef(false);
  const listenedIds = useMemo(() => listenedSpotIds(state), [state]);

  useEffect(() => {
    if (stampedRef.current) return;
    stampedRef.current = true;

    if (listenedIds.length === 0) return;

    const passport = usePassport.getState();
    for (const id of listenedIds) {
      passport.stamp(id, "tour");
    }
  }, [listenedIds]);

  if (listenedIds.length === 0) {
    return (
      <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-5">
        <h2 className="text-lg font-bold text-ink">Kết thúc tour</h2>
        <p className="text-sm leading-relaxed text-ink">
          Bạn đã bỏ qua tất cả điểm dừng nên chưa có điểm nào được ghi dấu đã
          nghe tour.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "restart" })}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Nghe tour khác
          </button>
          <Link
            href="/ho-chieu"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Xem hộ chiếu
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-5">
      <div>
        <h2 className="text-lg font-bold text-ink">
          Bạn đã nghe {listenedIds.length} điểm
        </h2>
        <p className="mt-1 text-xs text-muted">
          Đã ghi nhận dấu đã nghe tour vào hộ chiếu văn hóa của bạn.
        </p>
      </div>

      <ul className="space-y-3">
        {listenedIds.map((id) => {
          const spot = spots.find((item) => item.id === id) ?? getSpot(id);
          const level = levelForSpot(id);
          const hasCoords =
            spot !== undefined &&
            (spot.checkin.lat !== 0 || spot.checkin.lng !== 0);

          return (
            <li
              key={id}
              className="space-y-3 rounded-md border border-ink/15 bg-sand/60 p-3.5"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river text-xs font-bold text-sand"
                >
                  ✓
                </span>
                <span className="text-sm font-bold text-ink">
                  {spot?.name ?? id}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {level && (
                  <Link
                    href={`/kham-pha/${level.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-3.5 py-2 text-xs font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                  >
                    Chơi trọn màn
                  </Link>
                )}

                {hasCoords && spot && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${spot.checkin.lat},${spot.checkin.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-river px-3.5 py-2 text-xs font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                  >
                    Chỉ đường đến đây
                  </a>
                )}

                <Link
                  href={`/photobooth?spot=${encodeURIComponent(id)}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-white px-3.5 py-2 text-xs font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                >
                  Chụp ảnh check-in
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => dispatch({ type: "restart" })}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Nghe tour khác
        </button>
        <Link
          href="/ho-chieu"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Xem hộ chiếu
        </Link>
      </div>
    </section>
  );
}

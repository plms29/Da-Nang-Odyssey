"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Celebrate } from "@/components/fx/Celebrate";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowButton, GlowLink } from "@/components/fx/GlowButton";
import { KineticText } from "@/components/fx/KineticText";
import { StampPress } from "@/components/fx/StampPress";
import { TiltCard } from "@/components/fx/TiltCard";
import { getSpot, levelForSpot } from "@/lib/content";
import { usePassport } from "@/lib/passport/store";
import { listenedSpotIds, type TourAction, type TourState } from "@/lib/tour/player";
import type { Spot } from "@/lib/types";

export interface TourEndProps {
  state: TourState;
  spots: Spot[];
  dispatch: Dispatch<TourAction>;
}

const GLASS_LINK_CLASS =
  "fx-glass fx-glass--light inline-flex min-h-11 items-center justify-center rounded-xl px-3.5 py-2 text-xs font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta";

function SpotStampBadge({
  index,
  reducedMotion,
}: {
  index: number;
  reducedMotion: boolean;
}) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setTimeout(() => {
      setStarted(true);
    }, index * 180 + 220);
    return () => window.clearTimeout(timer);
  }, [index, reducedMotion]);

  const visible = reducedMotion || started;

  return (
    <StampPress
      play={!reducedMotion && started}
      className={visible ? undefined : "opacity-0"}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/70 bg-river text-xs font-bold text-sand shadow-sm"
      >
        ✓
      </span>
    </StampPress>
  );
}

export function TourEnd({ state, spots, dispatch }: TourEndProps) {
  const stampedRef = useRef(false);
  const listenedIds = useMemo(() => listenedSpotIds(state), [state]);
  const reducedMotion = Boolean(useReducedMotion());

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
      <GlassPanel
        as="section"
        tone="light"
        className="relative space-y-4 overflow-hidden p-5 lg:p-8"
      >
        <h2 className="text-lg font-bold text-ink lg:text-xl">Kết thúc tour</h2>
        <p className="text-sm leading-relaxed text-ink">
          Bạn đã bỏ qua tất cả điểm dừng nên chưa có điểm nào được ghi dấu đã
          nghe tour.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <GlowButton
            type="button"
            onClick={() => dispatch({ type: "restart" })}
            className="min-h-11 px-5 py-2 text-sm"
          >
            Nghe tour khác
          </GlowButton>
          <Link
            href="/ho-chieu"
            className={`${GLASS_LINK_CLASS} px-4 text-sm`}
          >
            Xem hộ chiếu
          </Link>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      as="section"
      tone="light"
      className="relative space-y-5 overflow-hidden p-5 lg:p-8"
    >
      <Celebrate kind="gold-burst" play={true} />

      <div>
        <KineticText
          as="h2"
          shimmer
          className="text-lg font-bold text-ink lg:text-2xl"
        >
          {`Bạn đã nghe ${listenedIds.length} điểm`}
        </KineticText>
        <p className="mt-1 text-xs text-muted lg:text-sm">
          Đã ghi nhận dấu đã nghe tour vào hộ chiếu văn hóa của bạn.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        {listenedIds.map((id, index) => {
          const spot = spots.find((item) => item.id === id) ?? getSpot(id);
          const level = levelForSpot(id);
          const hasCoords =
            spot !== undefined &&
            (spot.checkin.lat !== 0 || spot.checkin.lng !== 0);

          const cardContent = (
            <TiltCard
              max={6}
              className="flex h-full flex-col justify-between space-y-3 rounded-lg border border-ink/15 bg-sand/70 p-3.5 lg:p-4"
            >
              <div className="flex items-center gap-2.5">
                <SpotStampBadge index={index} reducedMotion={reducedMotion} />
                <span className="text-sm font-bold text-ink">
                  {spot?.name ?? id}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {level && (
                  <GlowLink
                    href={`/kham-pha/${level.id}`}
                    className="min-h-11 px-3.5 py-2 text-xs"
                  >
                    Chơi trọn màn
                  </GlowLink>
                )}

                {hasCoords && spot && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${spot.checkin.lat},${spot.checkin.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={GLASS_LINK_CLASS}
                  >
                    Chỉ đường đến đây
                  </a>
                )}

                <Link
                  href={`/photobooth?spot=${encodeURIComponent(id)}`}
                  className={GLASS_LINK_CLASS}
                >
                  Chụp ảnh check-in
                </Link>
              </div>
            </TiltCard>
          );

          if (reducedMotion) {
            return <li key={id}>{cardContent}</li>;
          }

          return (
            <motion.li
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: index * 0.08,
                ease: "easeOut",
              }}
            >
              {cardContent}
            </motion.li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <GlowButton
          type="button"
          onClick={() => dispatch({ type: "restart" })}
          className="min-h-11 px-5 py-2 text-sm"
        >
          Nghe tour khác
        </GlowButton>
        <GlowLink
          href="/ho-chieu"
          className="min-h-11 px-4 py-2 text-sm"
        >
          Xem hộ chiếu
        </GlowLink>
      </div>
    </GlassPanel>
  );
}

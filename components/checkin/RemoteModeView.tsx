"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowButton } from "@/components/fx/GlowButton";
import { KineticText } from "@/components/fx/KineticText";
import { ThemeScope } from "@/components/fx/ThemeScope";
import { TiltCard } from "@/components/fx/TiltCard";
import { PhotoBooth } from "@/components/photobooth/PhotoBooth";
import { getLevels, levelForSpot } from "@/lib/content";
import { haptic } from "@/lib/haptics";
import { demoUnlockAll, isSpotUnlocked, requiredLevel } from "@/lib/level/unlock";
import { usePassport } from "@/lib/passport/store";
import { getSceneKit, sceneIdForSpot } from "@/lib/scene";
import type { Spot } from "@/lib/types";

export interface RemoteModeViewProps {
  spots: Spot[];
  headingRef: RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
}

function subscribeHydration(onStoreChange: () => void): () => void {
  return usePassport.persist.onFinishHydration(() => onStoreChange());
}

function getHydrationSnapshot(): boolean {
  return usePassport.persist.hasHydrated();
}

function getServerHydrationSnapshot(): boolean {
  return false;
}

export function RemoteModeView({
  spots,
  headingRef,
  onBack,
}: RemoteModeViewProps) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const stamps = usePassport((state) => state.stamps);
  const levels = usePassport((state) => state.levels);
  const [demo, setDemo] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const prevSelectedSpotIdRef = useRef<string | null>(selectedSpotId);

  useEffect(() => {
    setDemo(demoUnlockAll(window.location.search));
  }, []);

  useEffect(() => {
    if (prevSelectedSpotIdRef.current === selectedSpotId) {
      return;
    }
    prevSelectedSpotIdRef.current = selectedSpotId;
    headingRef.current?.focus();
  }, [selectedSpotId, headingRef]);

  const selectedSpot =
    hydrated && selectedSpotId
      ? spots.find((spot) => {
          if (spot.id !== selectedSpotId) return false;
          const entry = stamps[spot.id];
          return Boolean(entry?.level || entry?.tour);
        }) ?? null
      : null;

  if (selectedSpot) {
    return (
      <ThemeScope spotId={selectedSpot.id} className="rounded-2xl p-2.5 lg:p-4">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-8">
          <div className="lg:sticky lg:top-24 lg:order-2 lg:col-span-5">
            <GlassPanel tone="light" className="space-y-4 p-4 lg:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-col lg:items-stretch">
                <div className="min-w-0">
                  <h2
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-base font-bold text-ink focus:outline-none lg:text-xl"
                  >
                    Ghé thăm từ xa: {selectedSpot.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted lg:mt-1.5 lg:text-sm">
                    Ảnh kỷ niệm trực tuyến không ghi thêm dấu ĐÃ ĐẾN.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptic("tap");
                    setSelectedSpotId(null);
                  }}
                  className="fx-glass fx-glass--light inline-flex min-h-11 items-center justify-center rounded-xl! px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta lg:w-full"
                >
                  Chọn điểm khác
                </button>
              </div>
            </GlassPanel>
          </div>

          <div className="min-w-0 lg:order-1 lg:col-span-7">
            <PhotoBooth spot={selectedSpot} mode="remote" />
          </div>
        </section>
      </ThemeScope>
    );
  }

  const allLevels = getLevels();

  return (
    <GlassPanel as="section" tone="light" className="space-y-5 p-5 lg:p-8">
      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-ink focus:outline-none lg:text-2xl"
        >
          <KineticText as="span" shimmer>
            Ghé thăm từ xa
          </KineticText>
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Chọn điểm bạn đã mở khóa để chụp ảnh với khung hình từ xa (không ghi
          dấu ĐÃ ĐẾN).
        </p>
      </div>

      {!hydrated ? (
        <p role="status" className="text-sm text-muted">
          Đang kiểm tra hộ chiếu…
        </p>
      ) : spots.length === 0 ? (
        <p className="text-sm text-muted">Chưa có điểm tham quan nào.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
          {spots.map((spot) => {
            const entry = stamps[spot.id];
            const unlocked = Boolean(entry?.level || entry?.tour);
            const placeOpen = isSpotUnlocked(spot.id, allLevels, { levels }, demo);
            const ownerLevel = levelForSpot(spot.id);
            const required = ownerLevel
              ? requiredLevel(ownerLevel, allLevels)
              : undefined;
            const worldAccent = getSceneKit(sceneIdForSpot(spot.id)).accent;
            const hasStamp = Boolean(
              entry?.level || entry?.tour || entry?.visited,
            );

            return (
              <li key={spot.id}>
                <TiltCard
                  max={5}
                  glare={false}
                  className="flex h-full flex-col justify-between gap-3 rounded-xl border border-ink/15 bg-sand/70 p-3.5 transition-shadow motion-reduce:transition-none lg:p-4"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-[11px]"
                    style={{ backgroundColor: worldAccent }}
                  />
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-bold text-ink">{spot.name}</p>
                      {hasStamp && (
                        <span className="inline-flex shrink-0 items-center rounded-full border border-gold/60 bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-ink">
                          Đã có dấu
                        </span>
                      )}
                    </div>

                    {!placeOpen ? (
                      <p className="flex items-start gap-1.5 text-xs text-muted">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-terracotta"
                        >
                          <rect x="4" y="11" width="16" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        </svg>
                        <span>
                          {required
                            ? `Hoàn thành Màn ${required.order}: ${required.title} để mở địa điểm này`
                            : "Hoàn thành màn trước đó để mở địa điểm này"}
                        </span>
                      </p>
                    ) : (
                      !unlocked && (
                        <p className="text-xs text-muted">
                          Hoàn thành màn hoặc nghe tour để mở khóa
                        </p>
                      )
                    )}
                  </div>

                  {!placeOpen ? (
                    <Link
                      href={required ? `/kham-pha/${required.id}` : "/kham-pha"}
                      className="fx-glass fx-glass--light inline-flex min-h-11 w-full items-center justify-center rounded-xl! border border-terracotta/40 px-4 py-2 text-sm font-semibold text-terracotta transition-colors motion-reduce:transition-none hover:bg-terracotta/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    >
                      Đến màn cần chơi
                    </Link>
                  ) : unlocked ? (
                    <GlowButton
                      type="button"
                      onClick={() => {
                        haptic("tap");
                        setSelectedSpotId(spot.id);
                      }}
                      className="min-h-11 w-full px-4 py-2 text-sm"
                    >
                      Chụp ảnh từ xa
                    </GlowButton>
                  ) : (
                    <Link
                      href="/kham-pha"
                      className="fx-glass fx-glass--light inline-flex min-h-11 w-full items-center justify-center rounded-xl! border border-terracotta/40 px-4 py-2 text-sm font-semibold text-terracotta transition-colors motion-reduce:transition-none hover:bg-terracotta/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    >
                      Đến Khám phá
                    </Link>
                  )}
                </TiltCard>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            haptic("tap");
            onBack();
          }}
          className="fx-glass fx-glass--light inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Quay lại check-in tại chỗ
        </button>
      </div>
    </GlassPanel>
  );
}

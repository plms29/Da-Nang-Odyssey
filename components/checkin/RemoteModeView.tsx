"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import Link from "next/link";
import { PhotoBooth } from "@/components/photobooth/PhotoBooth";
import { usePassport } from "@/lib/passport/store";
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
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const prevSelectedSpotIdRef = useRef<string | null>(selectedSpotId);

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
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink/15 bg-white/80 p-4">
          <div>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-base font-bold text-ink focus:outline-none"
            >
              Ghé thăm từ xa: {selectedSpot.name}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Ảnh kỷ niệm trực tuyến không ghi thêm dấu ĐÃ ĐẾN.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSpotId(null)}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Chọn điểm khác
          </button>
        </div>

        <PhotoBooth spot={selectedSpot} mode="remote" />
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-5">
      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-ink focus:outline-none"
        >
          Ghé thăm từ xa
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
        <ul className="space-y-3">
          {spots.map((spot) => {
            const entry = stamps[spot.id];
            const unlocked = Boolean(entry?.level || entry?.tour);

            return (
              <li
                key={spot.id}
                className="rounded-md border border-ink/15 bg-sand/60 p-3.5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-ink">{spot.name}</p>
                    {!unlocked && (
                      <p className="mt-1 text-xs text-muted">
                        Hoàn thành màn hoặc nghe tour để mở khóa
                      </p>
                    )}
                  </div>

                  {unlocked ? (
                    <button
                      type="button"
                      onClick={() => setSelectedSpotId(spot.id)}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-river px-4 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    >
                      Chụp ảnh từ xa
                    </button>
                  ) : (
                    <Link
                      href="/kham-pha"
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-terracotta/40 bg-white px-4 py-2 text-sm font-semibold text-terracotta transition-colors hover:bg-terracotta/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    >
                      Đến Khám phá
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Quay lại check-in tại chỗ
        </button>
      </div>
    </section>
  );
}

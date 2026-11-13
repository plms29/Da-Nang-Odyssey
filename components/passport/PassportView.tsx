"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { countStamps } from "@/lib/passport/logic";
import { usePassport } from "@/lib/passport/store";
import type { Level, Spot } from "@/lib/types";
import { StampCard } from "./StampCard";

export interface PassportViewProps {
  spots: Spot[];
  levels: Level[];
}

export function PassportView({ spots, levels }: PassportViewProps) {
  const [hydrated, setHydrated] = useState(false);

  const stamps = usePassport((s) => s.stamps);
  const levelProgress = usePassport((s) => s.levels);
  const totalCodeScore = usePassport((s) => s.total_code_score);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  if (!hydrated) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Đang tải hộ chiếu"
        className="space-y-5"
      >
        <span className="sr-only">Đang tải hộ chiếu…</span>
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-18 animate-pulse rounded-lg border border-ink/10 bg-white/60 p-3"
            />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-lg border border-ink/10 bg-white/60 p-4"
            />
          ))}
        </div>
      </div>
    );
  }

  const counts = countStamps({
    stamps,
    levels: levelProgress,
    total_code_score: totalCodeScore,
  });
  const hasAnyStamp =
    counts.level > 0 || counts.tour > 0 || counts.visited > 0;

  const handleReset = () => {
    if (window.confirm("Xóa toàn bộ dấu và điểm trên máy này?")) {
      usePassport.getState().reset();
    }
  };

  return (
    <div className="space-y-6">
      <section aria-label="Tổng kết hộ chiếu">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-ink/15 bg-white/80 p-3">
            <p className="text-xs font-semibold text-muted">Hoàn thành màn</p>
            <p className="mt-1 text-xl font-bold text-terracotta">
              {counts.level}
            </p>
          </div>
          <div className="rounded-lg border border-ink/15 bg-white/80 p-3">
            <p className="text-xs font-semibold text-muted">Đã nghe tour</p>
            <p className="mt-1 text-xl font-bold text-river">{counts.tour}</p>
          </div>
          <div className="rounded-lg border border-ink/15 bg-white/80 p-3">
            <p className="text-xs font-semibold text-muted">Đã đến</p>
            <p className="mt-1 text-xl font-bold text-ink">{counts.visited}</p>
          </div>
          <div className="rounded-lg border border-ink/15 bg-white/80 p-3">
            <p className="text-xs font-semibold text-muted">Điểm hoạt động</p>
            <p className="mt-1 text-xl font-bold text-river">
              {totalCodeScore}
            </p>
          </div>
        </div>
      </section>

      {!hasAnyStamp && (
        <section
          aria-label="Hộ chiếu chưa có dấu"
          className="rounded-lg border border-dashed border-gold/80 bg-gold/15 p-4 text-sm text-ink"
        >
          <p className="font-bold">Hộ chiếu của bạn chưa có con dấu nào.</p>
          <p className="mt-1 leading-relaxed text-muted">
            Hãy thử một màn khám phá hoặc ghé điểm di sản để sưu tầm những con
            dấu đầu tiên trên hành trình Đà Nẵng.
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <Link
              href="/kham-pha"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-4 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Khám phá ngay
            </Link>
            <Link
              href="/photobooth"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-river px-4 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Check-in tại điểm
            </Link>
          </div>
        </section>
      )}

      <section aria-labelledby="stamps-heading" className="space-y-3">
        <h2 id="stamps-heading" className="text-lg font-bold text-ink">
          Dấu theo điểm văn hóa
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {spots.map((spot) => (
            <StampCard
              key={spot.id}
              spot={spot}
              stamp={stamps[spot.id]}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="levels-heading" className="space-y-3">
        <h2 id="levels-heading" className="text-lg font-bold text-ink">
          Màn đã chơi
        </h2>
        <ul className="space-y-2.5">
          {levels.map((level) => {
            const entry = levelProgress[level.id];
            const stars = entry?.stars;

            return (
              <li
                key={level.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink/15 bg-white/80 px-4 py-3"
              >
                <span className="text-sm font-semibold text-ink">
                  Màn {level.order}: {level.title}
                </span>

                {stars !== undefined ? (
                  <span
                    role="img"
                    aria-label={`${stars} trên 3 sao`}
                    className="text-lg leading-none tracking-widest text-terracotta"
                  >
                    <span aria-hidden="true">
                      {"★".repeat(stars) + "☆".repeat(3 - stars)}
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted">
                      Chưa chơi
                    </span>
                    <Link
                      href={`/kham-pha/${level.id}`}
                      className="inline-flex min-h-11 items-center rounded-md border border-terracotta/40 bg-sand px-3 py-1.5 text-xs font-semibold text-terracotta transition-colors hover:bg-terracotta hover:text-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    >
                      Chơi ngay
                    </Link>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-xs font-semibold text-muted transition-colors hover:border-terracotta hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Xóa tiến độ
        </button>
      </div>
    </div>
  );
}

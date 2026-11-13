"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { GlassPanel } from "@/components/fx/Glass";
import { KineticText } from "@/components/fx/KineticText";
import { countStamps } from "@/lib/passport/logic";
import { usePassport } from "@/lib/passport/store";
import type { Level, Spot, StampKind } from "@/lib/types";
import { CountUp } from "./CountUp";
import { StampCard } from "./StampCard";

export interface PassportViewProps {
  spots: Spot[];
  levels: Level[];
}

const SEEN_STORAGE_KEY = "passport-seen";

const gridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

function readSeenSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((item): item is string => typeof item === "string"),
    );
  } catch {
    return new Set();
  }
}

function writeSeenSet(seen: Set<string>): void {
  try {
    sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    // Ignore storage errors (blocked or quota exceeded).
  }
}

export function PassportView({ spots, levels }: PassportViewProps) {
  const [hydrated, setHydrated] = useState(false);
  const reducedMotion = Boolean(useReducedMotion());
  const [freshBySpot, setFreshBySpot] = useState<
    Record<string, Partial<Record<StampKind, boolean>>>
  >({});
  const computedFreshRef = useRef(false);
  const seenSetRef = useRef<Set<string>>(new Set());

  const stamps = usePassport((s) => s.stamps);
  const levelProgress = usePassport((s) => s.levels);
  const totalCodeScore = usePassport((s) => s.total_code_score);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  useEffect(() => {
    if (!hydrated || computedFreshRef.current) return;
    computedFreshRef.current = true;

    const seen = readSeenSet();
    seenSetRef.current = seen;

    const nextFresh: Record<string, Partial<Record<StampKind, boolean>>> = {};
    const freshKeys: string[] = [];

    for (const spot of spots) {
      const stamp = stamps[spot.id];
      if (!stamp) continue;

      const spotFresh: Partial<Record<StampKind, boolean>> = {};
      const kinds: StampKind[] = [];
      if (stamp.level) kinds.push("level");
      if (stamp.tour) kinds.push("tour");
      if (stamp.visited) kinds.push("visited");

      for (const kind of kinds) {
        const key = `${spot.id}:${kind}`;
        if (!seen.has(key)) {
          spotFresh[kind] = true;
          freshKeys.push(key);
        }
      }

      if (Object.keys(spotFresh).length > 0) {
        nextFresh[spot.id] = spotFresh;
      }
    }

    if (reducedMotion) {
      if (freshKeys.length > 0) {
        for (const key of freshKeys) {
          seen.add(key);
        }
        writeSeenSet(seen);
      }
      return;
    }

    if (freshKeys.length > 0) {
      setFreshBySpot(nextFresh);
    }
  }, [hydrated, reducedMotion, spots, stamps]);

  const markSeen = useCallback((spotId: string, kind: StampKind) => {
    const key = `${spotId}:${kind}`;
    if (seenSetRef.current.has(key)) return;
    seenSetRef.current.add(key);
    writeSeenSet(seenSetRef.current);
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
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-18 animate-pulse rounded-lg border border-ink/10 bg-white/60 p-3 lg:h-28 lg:p-5"
            />
          ))}
        </div>
        <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-lg border border-ink/10 bg-white/60 p-4 lg:h-56 lg:p-6"
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

  const emptyStateContent = (
    <>
      <p className="font-bold">Hộ chiếu của bạn chưa có con dấu nào.</p>
      <p className="mt-1 leading-relaxed text-muted">
        Hãy thử một màn khám phá hoặc ghé điểm di sản để sưu tầm những con dấu
        đầu tiên trên hành trình Đà Nẵng.
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
    </>
  );

  const stampCards = spots.map((spot, index) => (
    <StampCard
      key={spot.id}
      spot={spot}
      stamp={stamps[spot.id]}
      index={index}
      fresh={freshBySpot[spot.id]}
      reduced={reducedMotion}
      onPressed={(kind) => markSeen(spot.id, kind)}
    />
  ));

  return (
    <div className="space-y-6">
      <section aria-label="Tổng kết hộ chiếu">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
          <GlassPanel className="rounded-lg p-3 lg:p-5">
            <p className="text-xs font-semibold text-muted">Hoàn thành màn</p>
            <p className="mt-1 text-xl font-bold text-terracotta lg:text-4xl">
              {counts.level}
            </p>
          </GlassPanel>
          <GlassPanel className="rounded-lg p-3 lg:p-5">
            <p className="text-xs font-semibold text-muted">Đã nghe tour</p>
            <p className="mt-1 text-xl font-bold text-river lg:text-4xl">
              {counts.tour}
            </p>
          </GlassPanel>
          <GlassPanel className="rounded-lg p-3 lg:p-5">
            <p className="text-xs font-semibold text-muted">Đã đến</p>
            <p className="mt-1 text-xl font-bold text-ink lg:text-4xl">
              {counts.visited}
            </p>
          </GlassPanel>
          <GlassPanel className="rounded-lg p-3 lg:p-5">
            <p className="text-xs font-semibold text-muted">Điểm hoạt động</p>
            <p className="mt-1 text-xl font-bold text-river lg:text-4xl">
              <CountUp value={totalCodeScore} />
            </p>
          </GlassPanel>
        </div>
      </section>

      {!hasAnyStamp &&
        (reducedMotion ? (
          <section
            aria-label="Hộ chiếu chưa có dấu"
            className="rounded-lg border border-dashed border-gold/80 bg-gold/15 p-4 text-sm text-ink lg:mx-auto lg:max-w-2xl lg:p-6"
          >
            {emptyStateContent}
          </section>
        ) : (
          <motion.section
            aria-label="Hộ chiếu chưa có dấu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-lg border border-dashed border-gold/80 bg-gold/15 p-4 text-sm text-ink lg:mx-auto lg:max-w-2xl lg:p-6"
          >
            {emptyStateContent}
          </motion.section>
        ))}

      <section aria-labelledby="stamps-heading" className="space-y-3">
        <h2 id="stamps-heading" className="text-lg font-bold text-ink">
          <KineticText as="span">Dấu theo điểm văn hóa</KineticText>
        </h2>
        {reducedMotion ? (
          <div className="grid grid-cols-1 gap-3 lg:grid lg:grid-cols-3 lg:gap-6">
            {stampCards}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-3 lg:grid lg:grid-cols-3 lg:gap-6"
            variants={gridVariants}
            initial="hidden"
            animate="show"
          >
            {stampCards}
          </motion.div>
        )}
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

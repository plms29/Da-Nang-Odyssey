"use client";

import { useEffect, useReducer, useRef, type Dispatch } from "react";
import Link from "next/link";
import {
  codeScore,
  currentStation,
  initLevel,
  levelReducer,
  levelStars,
  type LevelAction,
} from "@/lib/level/engine";
import { usePassport } from "@/lib/passport/store";
import type { Level, Station } from "@/lib/types";
import { MapPinStation } from "./stations/MapPinStation";
import { JigsawStation } from "./stations/JigsawStation";
import { OrderStation } from "./stations/OrderStation";
import { MatchStation } from "./stations/MatchStation";
import { ExpressStation } from "./stations/ExpressStation";

export interface LevelPlayerProps {
  level: Level;
}

const STEPS = ["Tìm", "Làm", "Thể hiện"] as const;

export function LevelPlayer({ level }: LevelPlayerProps) {
  const [state, dispatch] = useReducer(levelReducer, level, initLevel);
  const recordedRevealRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMountedRef = useRef(false);

  const stars = levelStars(state);
  const score = codeScore(state);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [state.phase, state.stationIndex]);

  useEffect(() => {
    if (state.phase !== "reveal") {
      recordedRevealRef.current = false;
      return;
    }
    if (recordedRevealRef.current) return;
    recordedRevealRef.current = true;

    const passport = usePassport.getState();
    for (const spotId of level.spot_ids) {
      passport.stamp(spotId, "level");
    }
    if (stars !== null) {
      passport.recordLevel(level.id, stars, score);
    }
  }, [state.phase, level.id, level.spot_ids, stars, score]);

  if (state.phase === "intro") {
    return (
      <section className="rounded-lg border border-ink/15 bg-white/80 p-5">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mb-2 text-lg font-bold text-ink focus:outline-none"
        >
          Giới thiệu
        </h2>
        <p className="text-base leading-relaxed text-ink">{level.intro.text}</p>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => dispatch({ type: "start" })}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-6 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Bắt đầu
          </button>
        </div>
      </section>
    );
  }

  if (state.phase === "station") {
    const station = currentStation(level, state);

    return (
      <div className="space-y-4">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-ink focus:outline-none"
        >
          Chặng {state.stationIndex + 1}: {STEPS[state.stationIndex] ?? ""}
        </h2>
        <nav aria-label="Tiến trình màn chơi">
          <ol className="grid grid-cols-3 gap-2">
            {STEPS.map((label, index) => {
              const isCurrent = index === state.stationIndex;
              const isDone = index < state.stationIndex;
              return (
                <li
                  key={label}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`rounded-md border px-2 py-2 text-center text-xs font-bold ${
                    isCurrent
                      ? "border-terracotta bg-terracotta text-sand"
                      : isDone
                        ? "border-river bg-river/15 text-river"
                        : "border-ink/15 bg-white/60 text-muted"
                  }`}
                >
                  {index + 1}. {label}
                </li>
              );
            })}
          </ol>
        </nav>

        {station && renderStation(station, level.id, dispatch)}
      </div>
    );
  }

  const starCount = stars ?? 0;

  return (
    <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-5">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-bold text-ink focus:outline-none"
      >
        Hoàn thành màn chơi
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Đánh giá
          </p>
          <p
            role="img"
            aria-label={`${starCount} trên 3 sao`}
            className="mt-1 text-2xl leading-none tracking-widest text-gold"
          >
            <span aria-hidden="true">
              {"★".repeat(starCount) + "☆".repeat(3 - starCount)}
            </span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Điểm hoạt động
          </p>
          <p className="mt-1 text-xl font-bold text-river">{score}</p>
        </div>
      </div>

      <p className="text-base leading-relaxed text-ink">{level.reveal.text}</p>

      {level.reveal.sources.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Nguồn tham khảo
          </h2>
          <ul className="mt-1.5 space-y-1 text-sm text-ink">
            {level.reveal.sources.map((source, index) => (
              <li key={index}>
                {source.url.trim().length > 0 ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-river underline hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                  >
                    {source.title}
                  </a>
                ) : (
                  <span>{source.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md border border-gold/60 bg-gold/15 p-3 text-sm text-ink">
        <p className="font-semibold">Con dấu hộ chiếu</p>
        <p className="mt-0.5 text-xs text-muted">
          Đã ghi nhận dấu hoàn thành màn chơi vào hộ chiếu của bạn.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          href="/photobooth"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-river px-4 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Đến tận nơi để lấy dấu đã đến
        </Link>

        <button
          type="button"
          onClick={() => dispatch({ type: "restart" })}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Chơi lại
        </button>
      </div>
    </section>
  );
}

function renderStation(
  station: Station,
  levelId: string,
  dispatch: Dispatch<LevelAction>,
) {
  switch (station.type) {
    case "map_pin":
      return (
        <MapPinStation
          key={station.id}
          station={station}
          onDone={(result) => dispatch({ type: "completeActivity", result })}
        />
      );
    case "jigsaw":
      return (
        <JigsawStation
          key={station.id}
          station={station}
          onDone={(result) => dispatch({ type: "completeActivity", result })}
        />
      );
    case "order":
      return (
        <OrderStation
          key={station.id}
          station={station}
          onDone={(result) => dispatch({ type: "completeActivity", result })}
        />
      );
    case "match":
      return (
        <MatchStation
          key={station.id}
          station={station}
          onDone={(result) => dispatch({ type: "completeActivity", result })}
        />
      );
    case "open_text_or_voice":
    case "open_drawing":
      return (
        <ExpressStation
          key={station.id}
          station={station}
          levelId={levelId}
          onDone={(judge) => dispatch({ type: "submitExpress", judge })}
        />
      );
  }
}

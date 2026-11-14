"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import {
  codeScore,
  currentStation,
  initLevel,
  levelReducer,
  levelStars,
  type LevelAction,
  type LevelState,
} from "@/lib/level/engine";
import { usePassport } from "@/lib/passport/store";
import { getSceneKit, sceneIdForLevel } from "@/lib/scene";
import type { Level, Station } from "@/lib/types";
import { Celebrate } from "@/components/fx/Celebrate";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowButton, GlowLink } from "@/components/fx/GlowButton";
import { ParallaxScene } from "@/components/fx/ParallaxScene";
import { PhaseTransition } from "@/components/fx/PhaseTransition";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { StampPress } from "@/components/fx/StampPress";
import { TextReveal } from "@/components/fx/TextReveal";
import { MapPinStation } from "./stations/MapPinStation";
import { JigsawStation } from "./stations/JigsawStation";
import { OrderStation } from "./stations/OrderStation";
import { MatchStation } from "./stations/MatchStation";
import { ExpressStation } from "./stations/ExpressStation";

export interface LevelPlayerProps {
  level: Level;
}

const STEPS = ["Tìm", "Làm", "Thể hiện"] as const;

type ShownView = Pick<LevelState, "phase" | "stationIndex">;

export function LevelPlayer({ level }: LevelPlayerProps) {
  const [state, dispatch] = useReducer(levelReducer, level, initLevel);
  const [shown, setShown] = useState<ShownView>(() => ({
    phase: state.phase,
    stationIndex: state.stationIndex,
  }));
  const [playing, setPlaying] = useState(false);

  const stateRef = useRef(state);
  const recordedRevealRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMountedRef = useRef(false);
  const prefersReducedMotion = Boolean(useReducedMotion());

  const kit = useMemo(() => getSceneKit(sceneIdForLevel(level)), [level]);
  const introParagraphs = useMemo(
    () => splitIntroTextPanels(level.intro.text),
    [level.intro.text],
  );

  const stars = levelStars(state);
  const score = codeScore(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (playing) return;
    if (
      state.phase !== shown.phase ||
      state.stationIndex !== shown.stationIndex
    ) {
      setPlaying(true);
    }
  }, [playing, state.phase, state.stationIndex, shown.phase, shown.stationIndex]);

  const handleCovered = useCallback(() => {
    setShown({
      phase: stateRef.current.phase,
      stationIndex: stateRef.current.stationIndex,
    });
  }, []);

  const handleTransitionDone = useCallback(() => {
    setPlaying(false);
  }, []);

  const guarded = (action: LevelAction) => {
    const s = stateRef.current;
    if (playing || s.phase !== shown.phase || s.stationIndex !== shown.stationIndex) {
      return;
    }
    dispatch(action);
  };

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    headingRef.current?.focus({ preventScroll: true });
  }, [shown.phase, shown.stationIndex]);

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

  let content: ReactNode;

  if (shown.phase === "intro") {
    const panels: ReactNode[] = [
      <div key="intro-title" className="min-w-0 space-y-2">
        <h2
          ref={(el) => {
            if (el && !el.closest('[aria-hidden="true"]')) {
              headingRef.current = el;
            }
          }}
          tabIndex={-1}
          className="sr-only focus:outline-none"
        >
          Giới thiệu
        </h2>
        <p className="text-xs font-medium text-muted">
          Màn {level.order}
        </p>
        <p className="break-words text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {level.title}
        </p>
      </div>,
      ...introParagraphs.map((paragraph, index) => (
        <p
          key={`intro-text-${index}`}
          className="text-base leading-relaxed text-ink"
        >
          {paragraph}
        </p>
      )),
    ];

    const cta = (
      <GlowButton
        type="button"
        onClick={() => guarded({ type: "start" })}
        className="min-h-11 px-6 py-2 text-sm"
      >
        Bắt đầu
      </GlowButton>
    );

    content = <ParallaxScene kit={kit} panels={panels} cta={cta} />;
  } else if (shown.phase === "station") {
    const shownState: LevelState = {
      ...state,
      phase: shown.phase,
      stationIndex: shown.stationIndex,
    };
    const station = currentStation(level, shownState);

    const renderProgressNav = (navClassName?: string) => (
      <nav aria-label="Tiến trình màn chơi" className={navClassName}>
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((label, index) => {
            const isCurrent = index === shown.stationIndex;
            const isDone = index < shown.stationIndex;
            return (
              <li
                key={label}
                aria-current={isCurrent ? "step" : undefined}
                className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center text-xs font-semibold transition-colors ${
                  isCurrent
                    ? "border-terracotta bg-terracotta text-on-accent"
                    : isDone
                      ? "border-river/30 bg-river/10 text-river"
                      : "border-border bg-surface/60 text-muted"
                }`}
              >
                {isDone && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    className="h-3.5 w-3.5 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.5 8.5l3 3 6-6.5"
                    />
                  </svg>
                )}
                <span>
                  {index + 1}. {label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    );

    content = (
      <div className="relative isolate -mx-4 overflow-hidden lg:mx-0 lg:flex lg:items-start lg:gap-8 lg:overflow-visible">
        <SceneBackdrop kit={kit} intensity="calm" className="lg:hidden" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-sand/70 via-sand/85 to-sand lg:hidden"
        />

        <div className="hidden lg:sticky lg:top-24 lg:flex lg:w-[42%] lg:flex-col lg:gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted">
              Màn {level.order}
            </p>
            <p className="break-words text-2xl font-bold tracking-tight text-ink">
              {level.title}
            </p>
          </div>
          {renderProgressNav()}
          <div className="relative h-[60vh] overflow-hidden rounded-3xl border border-border shadow-sm">
            <SceneBackdrop kit={kit} intensity="calm" />
          </div>
        </div>

        <div className="relative z-10 px-4 py-2 lg:w-[58%] lg:min-w-0 lg:px-0 lg:py-0">
          <GlassPanel tone="light" className="min-w-0 space-y-4 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-2">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-lg font-bold tracking-tight text-ink focus:outline-none sm:text-xl"
              >
                {`Chặng ${shown.stationIndex + 1}: ${STEPS[shown.stationIndex] ?? ""}`}
              </h2>
              <span className="text-xs font-medium text-muted">
                {shown.stationIndex + 1}/{STEPS.length}
              </span>
            </div>

            {renderProgressNav("lg:hidden")}

            <div className="rounded-xl border border-border bg-surface/85 p-3.5 sm:p-5">
              {station && renderStation(station, level.id, guarded)}
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  } else {
    const starCount = stars ?? 0;

    content = (
      <section className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-sm">
        <Celebrate kind={kit.celebrate} play={true} />

        <div className="space-y-5 p-5 sm:p-8">
          <div className="border-b border-border pb-4">
            {kit.subtitle && (
              <p className="text-xs font-medium text-muted">
                {kit.subtitle}
              </p>
            )}
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="mt-1 text-xl font-bold tracking-tight text-ink focus:outline-none sm:text-2xl"
            >
              {`Hoàn thành màn ${level.order}: ${level.title}`}
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="text-xs font-medium text-muted">
                Đánh giá
              </p>
              <div
                role="img"
                aria-label={`${starCount} trên 3 sao`}
                className="mt-1.5 inline-flex items-center gap-1.5"
              >
                {[0, 1, 2].map((i) => {
                  const filled = i < starCount;
                  return (
                    <motion.span
                      key={i}
                      aria-hidden="true"
                      className={`inline-flex ${filled ? "text-gold" : "text-muted/35"}`}
                      initial={
                        prefersReducedMotion
                          ? { y: 0, opacity: 1, scale: 1 }
                          : { y: 16, opacity: 0, scale: 0.7 }
                      }
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : {
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                              delay: i * 0.18,
                            }
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={filled ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.75"
                        className="h-7 w-7 sm:h-9 sm:w-9"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    </motion.span>
                  );
                })}
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-medium text-muted">
                Điểm hoạt động
              </p>
              <RevealScore score={score} reducedMotion={prefersReducedMotion} />
            </div>
          </div>

          <TextReveal
            mode="fade-up"
            as="p"
            className="text-base leading-relaxed text-ink"
          >
            {level.reveal.text}
          </TextReveal>

          {level.reveal.sources.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted">
                Nguồn tham khảo
              </h3>
              <ul className="mt-1.5 space-y-1 text-sm text-ink">
                {level.reveal.sources.map((source, index) => (
                  <li key={index} className="break-words">
                    {source.url.trim().length > 0 ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-river underline underline-offset-2 hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
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

          <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-ink">
            <p className="font-semibold">
              <StampPress play={true}>Con dấu hộ chiếu</StampPress>
            </p>
            <p className="mt-1 text-xs text-muted">
              Đã ghi nhận dấu hoàn thành màn chơi vào hộ chiếu của bạn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <GlowLink
              href="/photobooth"
              className="min-h-11 px-5 py-2.5 text-sm"
            >
              Đến nơi để chụp ảnh check-in
            </GlowLink>

            <button
              type="button"
              onClick={() => guarded({ type: "restart" })}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-sand/70 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Chơi lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  const isTransitioning =
    playing ||
    state.phase !== shown.phase ||
    state.stationIndex !== shown.stationIndex;

  return (
    <>
      <div inert={isTransitioning}>{content}</div>
      <PhaseTransition
        kind={kit.transition}
        play={playing}
        onCovered={handleCovered}
        onDone={handleTransitionDone}
      />
    </>
  );
}

function RevealScore({
  score,
  reducedMotion,
}: {
  score: number;
  reducedMotion: boolean;
}) {
  const [display, setDisplay] = useState(() => (reducedMotion ? score : 0));

  useEffect(() => {
    if (reducedMotion) return;
    const controls = animate(0, score, {
      duration: 0.9,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [score, reducedMotion]);

  return (
    <p className="mt-1 text-2xl font-bold tabular-nums text-river sm:text-4xl">
      {reducedMotion ? score : display}
    </p>
  );
}

function splitIntroTextPanels(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const sentences = trimmed
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length === 0) return [];
  const panelCount = Math.min(3, sentences.length);
  const base = Math.floor(sentences.length / panelCount);
  const rem = sentences.length % panelCount;
  const panels: string[] = [];
  let cursor = 0;
  for (let i = 0; i < panelCount; i++) {
    const size = base + (i < rem ? 1 : 0);
    panels.push(sentences.slice(cursor, cursor + size).join(" "));
    cursor += size;
  }
  return panels;
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

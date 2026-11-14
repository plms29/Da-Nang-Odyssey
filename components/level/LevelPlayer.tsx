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
import { KineticText } from "@/components/fx/KineticText";
import { ParallaxScene } from "@/components/fx/ParallaxScene";
import { PhaseTransition } from "@/components/fx/PhaseTransition";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { StampPress } from "@/components/fx/StampPress";
import { TextReveal } from "@/components/fx/TextReveal";
import { TiltCard } from "@/components/fx/TiltCard";
import { MapPinStation } from "./stations/MapPinStation";
import { JigsawStation } from "./stations/JigsawStation";
import { OrderStation } from "./stations/OrderStation";
import { MatchStation } from "./stations/MatchStation";
import { ExpressStation } from "./stations/ExpressStation";
import { RecipeStation } from "./stations/RecipeStation";
import { SpotDiffStation } from "./stations/SpotDiffStation";

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
      <div key="intro-title" className="min-w-0 space-y-3">
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
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Màn {level.order}
        </p>
        <KineticText
          as="h2"
          shimmer
          className="break-words text-2xl font-bold text-ink sm:text-3xl"
        >
          {level.title}
        </KineticText>
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
                className={`relative overflow-hidden rounded-md border px-2 py-2 text-center text-xs font-bold backdrop-blur-sm ${
                  isCurrent
                    ? "border-gold bg-gold text-ink shadow-[0_0_18px_rgba(201,154,46,0.7)]"
                    : isDone
                      ? "border-river/40 bg-river/15 text-river"
                      : "border-ink/15 bg-white/40 text-muted"
                }`}
              >
                {isDone && (
                  <span aria-hidden="true" className="mr-1">
                    ✓
                  </span>
                )}
                {index + 1}. {label}
                {isCurrent && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1 bg-gold"
                    style={{ originX: 0 }}
                    initial={
                      prefersReducedMotion
                        ? { scaleX: 1 }
                        : { scaleX: 0 }
                    }
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.5,
                      ease: "easeOut",
                    }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );

    content = (
      <div className="relative isolate -mx-4 overflow-hidden lg:mx-0 lg:overflow-visible lg:flex lg:items-start lg:gap-8">
        <SceneBackdrop kit={kit} intensity="calm" className="lg:hidden" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-sand/70 via-sand/85 to-sand lg:hidden"
        />
        <div className="hidden lg:sticky lg:top-24 lg:flex lg:w-[42%] lg:flex-col lg:gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Màn {level.order}
            </p>
            <p className="break-words text-2xl font-bold text-ink">
              {level.title}
            </p>
          </div>
          {renderProgressNav()}
          <div className="relative h-[60vh] overflow-hidden rounded-3xl border border-ink/10 shadow-sm">
            <SceneBackdrop kit={kit} intensity="calm" />
          </div>
        </div>
        <div className="relative z-10 px-4 py-2 lg:w-[58%] lg:min-w-0 lg:px-0 lg:py-0">
          <GlassPanel tone="light" className="min-w-0 space-y-4 p-4 lg:p-10">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-lg font-bold text-ink focus:outline-none lg:text-xl"
            >
              <KineticText key={shown.stationIndex} as="span">
                {`Chặng ${shown.stationIndex + 1}: ${STEPS[shown.stationIndex] ?? ""}`}
              </KineticText>
            </h2>
            <div className="space-y-4 rounded-md bg-white/70 p-3 lg:space-y-0 lg:p-5">
              {renderProgressNav("lg:hidden")}

              {station && renderStation(station, level.id, guarded)}
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  } else {
    const starCount = stars ?? 0;

    content = (
      <TiltCard max={6} className="rounded-lg lg:mx-auto lg:max-w-3xl">
        <GlassPanel
          as="section"
          tone="light"
          className="relative space-y-4 overflow-hidden p-5 lg:space-y-6 lg:p-10"
        >
          <Celebrate kind={kit.celebrate} play={true} />

          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-bold text-ink focus:outline-none lg:text-xl"
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
                className="mt-1 text-2xl leading-none tracking-widest text-gold lg:text-5xl"
              >
                <span aria-hidden="true" className="inline-flex gap-0.5">
                  {[0, 1, 2].map((i) => {
                    const filled = i < starCount;
                    return (
                      <motion.span
                        key={i}
                        className="inline-block"
                        initial={
                          prefersReducedMotion
                            ? { y: 0, opacity: 1, scale: 1 }
                            : { y: 24, opacity: 0, scale: 0.6 }
                        }
                        animate={
                          prefersReducedMotion
                            ? { y: 0, opacity: 1, scale: 1 }
                            : {
                                y: 0,
                                opacity: 1,
                                scale: 1,
                                textShadow: [
                                  "0 0 0px rgba(201, 154, 46, 0)",
                                  "0 0 18px rgba(201, 154, 46, 0.95)",
                                  "0 0 0px rgba(201, 154, 46, 0)",
                                ],
                              }
                        }
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : {
                                y: {
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 18,
                                  delay: i * 0.25,
                                },
                                opacity: {
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 18,
                                  delay: i * 0.25,
                                },
                                scale: {
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 18,
                                  delay: i * 0.25,
                                },
                                textShadow: {
                                  duration: 0.65,
                                  delay: i * 0.25 + 0.3,
                                  times: [0, 0.45, 1],
                                  ease: "easeOut",
                                },
                              }
                        }
                      >
                        {filled ? "★" : "☆"}
                      </motion.span>
                    );
                  })}
                </span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                Nguồn tham khảo
              </h2>
              <ul className="mt-1.5 space-y-1 text-sm text-ink">
                {level.reveal.sources.map((source, index) => (
                  <li key={index} className="break-words">
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
            <p className="font-semibold">
              <StampPress play={true}>Con dấu hộ chiếu</StampPress>
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Đã ghi nhận dấu hoàn thành màn chơi vào hộ chiếu của bạn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <GlowLink
              href="/photobooth"
              className="min-h-11 px-4 py-2 text-sm"
            >
              Đến tận nơi để lấy dấu đã đến
            </GlowLink>

            <button
              type="button"
              onClick={() => guarded({ type: "restart" })}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Chơi lại
            </button>
          </div>
        </GlassPanel>
      </TiltCard>
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
    <p className="mt-1 text-xl font-bold text-river lg:text-6xl">
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
    case "recipe":
      return (
        <RecipeStation
          key={station.id}
          station={station}
          onDone={(result) => dispatch({ type: "completeActivity", result })}
        />
      );
    case "spot_diff":
      return (
        <SpotDiffStation
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowButton } from "@/components/fx/GlowButton";
import { ThemeScope } from "@/components/fx/ThemeScope";
import { getSpot } from "@/lib/content";
import type { TourAction, TourState } from "@/lib/tour/player";
import { sentenceTimings, splitSentences } from "@/lib/tour/subtitles";
import type { Spot } from "@/lib/types";
import { TourMap } from "./TourMap";
import { TourStopStation } from "./TourStopStation";
import { useSpeech } from "./useSpeech";

export interface TourPlayerProps {
  state: TourState;
  dispatch: Dispatch<TourAction>;
  spots?: Spot[];
}

function resolvePublicAsset(path: string | undefined): string {
  if (!path) return "";
  if (path.startsWith("/") || path.startsWith("http")) return path;
  return `/${path}`;
}

export function TourPlayer({ state, dispatch, spots }: TourPlayerProps) {
  const plan = state.plan!;
  const stop = plan.stops[state.stopIndex];
  const spot = stop
    ? (getSpot(stop.spot_id) ?? spots?.find((item) => item.id === stop.spot_id))
    : undefined;

  const mapStops = useMemo(() => {
    const resolved: Spot[] = [];
    for (const item of plan.stops) {
      const found =
        getSpot(item.spot_id) ?? spots?.find((s) => s.id === item.spot_id);
      if (found) resolved.push(found);
    }
    return resolved;
  }, [plan.stops, spots]);

  const speech = useSpeech();
  const speechRef = useRef(speech);
  useEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  const reducedMotion = Boolean(useReducedMotion());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const prevStepRef = useRef<{
    phase: TourState["phase"];
    stopIndex: number;
  } | null>(null);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [failedAudioKey, setFailedAudioKey] = useState<string | null>(null);
  const [failedImageKey, setFailedImageKey] = useState<string | null>(null);
  const [voicesSettled, setVoicesSettled] = useState(false);

  const stopKey = `${state.stopIndex}:${stop?.spot_id ?? ""}`;
  const audioSrc = resolvePublicAsset(spot?.narration_audio);
  const useAudioMode = Boolean(audioSrc) && failedAudioKey !== stopKey;
  const imageSrc = resolvePublicAsset(spot?.image);
  const showImage = Boolean(imageSrc) && failedImageKey !== stopKey;

  const fullText = stop
    ? stop.narration + (stop.transition ? ` ${stop.transition}` : "")
    : "";
  const sentences = useMemo(() => splitSentences(fullText), [fullText]);

  const stopPlayback = useCallback(() => {
    speechRef.current.cancel();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    setPaused(false);
    setSentenceIndex(0);

    const prev = prevStepRef.current;
    if (prev === null) {
      prevStepRef.current = { phase: state.phase, stopIndex: state.stopIndex };
      return;
    }

    if (prev.phase !== state.phase || prev.stopIndex !== state.stopIndex) {
      prevStepRef.current = { phase: state.phase, stopIndex: state.stopIndex };
      headingRef.current?.focus();
    }
  }, [state.phase, state.stopIndex]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoicesSettled(true);
      return;
    }

    const synth = window.speechSynthesis;
    if (
      typeof synth.getVoices === "function" &&
      synth.getVoices().length > 0
    ) {
      setVoicesSettled(true);
      return;
    }

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timerId);
      if (typeof synth.removeEventListener === "function") {
        synth.removeEventListener("voiceschanged", settle);
      }
      setVoicesSettled(true);
    };

    const timerId = setTimeout(settle, 800);
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", settle);
    }

    return () => {
      settled = true;
      clearTimeout(timerId);
      if (typeof synth.removeEventListener === "function") {
        synth.removeEventListener("voiceschanged", settle);
      }
    };
  }, []);

  const canSpeak = voicesSettled || speech.supported || state.stopIndex > 0;

  useEffect(() => {
    if (state.phase !== "stop" || !stop || !spot || !useAudioMode) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        if (!cancelled) {
          setPaused(true);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [state.phase, state.stopIndex, stop, spot, useAudioMode, stopKey]);

  useEffect(() => {
    if (state.phase !== "stop" || !stop || !spot || useAudioMode || !canSpeak) {
      return;
    }

    speechRef.current.speak(sentences, {
      onSentence(index) {
        setSentenceIndex(index);
      },
      onEnd() {
        dispatch({ type: "narrationEnded" });
      },
      fallbackSeconds: stop.seconds,
    });

    return () => {
      speechRef.current.cancel();
    };
  }, [
    state.phase,
    state.stopIndex,
    stop,
    spot,
    useAudioMode,
    canSpeak,
    sentences,
    replayCount,
    dispatch,
  ]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  if (!stop || !spot) {
    return (
      <GlassPanel as="section" tone="light" className="space-y-3 p-5">
        <p role="status" className="text-sm font-medium text-ink">
          Không tìm thấy thông tin điểm dừng này.
        </p>
        <GlowButton
          type="button"
          onClick={() => dispatch({ type: "skipStop" })}
          className="min-h-11 px-4 py-2 text-sm"
        >
          Bỏ qua điểm
        </GlowButton>
      </GlassPanel>
    );
  }

  function handleTogglePause() {
    if (useAudioMode) {
      const audio = audioRef.current;
      if (!audio) return;
      if (paused) {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            setPaused(true);
          });
        }
        setPaused(false);
      } else {
        audio.pause();
        setPaused(true);
      }
      return;
    }

    if (paused) {
      speechRef.current.resume();
      setPaused(false);
    } else {
      speechRef.current.pause();
      setPaused(true);
    }
  }

  function handleReplay() {
    stopPlayback();
    setPaused(false);
    setSentenceIndex(0);
    if (useAudioMode) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            setPaused(true);
          });
        }
      }
      return;
    }
    setReplayCount((prev) => prev + 1);
  }

  function handleSkipStop() {
    stopPlayback();
    setPaused(false);
    dispatch({ type: "skipStop" });
  }

  function handleAudioTimeUpdate() {
    const audio = audioRef.current;
    if (!audio || sentences.length === 0) return;
    const duration =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : stop.seconds;
    const timings = sentenceTimings(sentences, duration);
    let activeIdx = 0;
    for (let i = 0; i < timings.length; i += 1) {
      if (audio.currentTime >= timings[i]) {
        activeIdx = i;
      }
    }
    setSentenceIndex(activeIdx);
  }

  const currentSentence = sentences[sentenceIndex] ?? sentences[0] ?? fullText;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
      <div className="w-full lg:sticky lg:top-24 lg:w-[42%] lg:shrink-0">
        <TourMap stops={mapStops} activeSpotId={spot.id} />
      </div>

      <div className="w-full min-w-0 lg:flex-1">
        <ThemeScope
          spotId={spot.id}
          className="rounded-2xl p-2.5 sm:p-3.5 lg:p-4"
        >
          <GlassPanel
            as="section"
            tone="light"
            className="min-w-0 space-y-4 p-4 lg:space-y-5 lg:p-8"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink"
                style={{
                  borderColor: "color-mix(in srgb, var(--world-accent, #B5532F) 40%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--world-accent, #B5532F) 12%, transparent)",
                }}
              >
                Điểm {state.stopIndex + 1}/{plan.stops.length}
              </span>
              <span className="text-xs font-semibold text-muted">
                {state.phase === "stop" ? "Đang kể chuyện" : "Hoạt động tại điểm"}
              </span>
            </div>

            <h2
              tabIndex={-1}
              ref={headingRef}
              className="text-xl font-bold tracking-tight text-ink focus:outline-none lg:text-2xl"
            >
              <motion.span
                key={stopKey}
                initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.25,
                  ease: "easeOut",
                }}
                className="inline-block"
              >
                {spot.name}
              </motion.span>
            </h2>

            <motion.div
              key={`${stopKey}:${state.phase}`}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="space-y-4"
            >
              {showImage && (
                <div className="overflow-hidden rounded-xl border border-ink/10 bg-sand/40 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt=""
                    onError={() => setFailedImageKey(stopKey)}
                    className="h-44 w-full object-cover lg:h-64"
                  />
                </div>
              )}

              {state.phase === "stop" ? (
                <div className="space-y-4">
                  {useAudioMode && (
                    <audio
                      key={stopKey}
                      ref={audioRef}
                      src={audioSrc}
                      autoPlay
                      onPlay={() => setPaused(false)}
                      onPause={() => setPaused(true)}
                      onTimeUpdate={handleAudioTimeUpdate}
                      onEnded={() => dispatch({ type: "narrationEnded" })}
                      onError={() => setFailedAudioKey(stopKey)}
                      className="sr-only"
                    />
                  )}

                  <div
                    aria-live="off"
                    className="relative overflow-hidden rounded-xl border border-gold/45 bg-white/75 p-4 shadow-sm backdrop-blur-md lg:p-5"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ background: "var(--world-accent, #B5532F)" }}
                    />
                    <div className="space-y-2 pl-2">
                      {sentences.length > 1 && (
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted">
                          <span className="uppercase tracking-wider text-ink">
                            Phụ đề đang đọc
                          </span>
                          <span>
                            {Math.min(sentenceIndex + 1, sentences.length)}/{sentences.length}
                          </span>
                        </div>
                      )}

                      <div className="min-h-16">
                        <motion.p
                          key={`${stopKey}:${sentenceIndex}`}
                          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: reducedMotion ? 0 : 0.25,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="text-lg font-semibold leading-relaxed text-ink lg:text-xl"
                        >
                          {currentSentence}
                        </motion.p>
                      </div>

                      {sentences.length > 1 && (
                        <div
                          aria-hidden="true"
                          className="h-1 w-full overflow-hidden rounded-full bg-ink/10"
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: "var(--world-accent, #B5532F)" }}
                            initial={false}
                            animate={{
                              width: `${Math.min(
                                100,
                                Math.round(((sentenceIndex + 1) / sentences.length) * 100),
                              )}%`,
                            }}
                            transition={{
                              duration: reducedMotion ? 0 : 0.25,
                              ease: "easeOut",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {!useAudioMode && (
                    <p className="text-xs text-muted">
                      {speech.supported
                        ? "Giọng đọc của trình duyệt"
                        : "Chưa có giọng tiếng Việt, phụ đề tự chạy"}
                    </p>
                  )}

                  <details className="rounded-xl border border-ink/12 bg-white/50 px-3.5 py-2.5 text-sm text-ink backdrop-blur-sm">
                    <summary className="cursor-pointer py-1 font-semibold text-river focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta">
                      Xem toàn bộ lời kể
                    </summary>
                    <p className="mt-2 leading-relaxed text-muted">{fullText}</p>
                  </details>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <GlowButton
                      type="button"
                      onClick={handleTogglePause}
                      className="min-h-11 flex-1 px-4 py-2 text-sm whitespace-nowrap"
                    >
                      {paused ? "Tiếp tục" : "Tạm dừng"}
                    </GlowButton>

                    <button
                      type="button"
                      onClick={handleReplay}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink/15 bg-white/65 px-4 py-2 text-sm font-semibold text-ink shadow-xs backdrop-blur-md transition-colors motion-reduce:transition-none hover:border-gold/50 hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    >
                      Nghe lại
                    </button>

                    <button
                      type="button"
                      onClick={handleSkipStop}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink/15 bg-sand/70 px-4 py-2 text-sm font-semibold text-ink shadow-xs backdrop-blur-md transition-colors motion-reduce:transition-none hover:border-terracotta/40 hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    >
                      Bỏ qua điểm
                    </button>
                  </div>
                </div>
              ) : (
                <TourStopStation key={spot.id} spot={spot} dispatch={dispatch} />
              )}
            </motion.div>
          </GlassPanel>
        </ThemeScope>
      </div>
    </div>
  );
}

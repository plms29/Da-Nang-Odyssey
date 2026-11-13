"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch } from "react";
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
      <section className="space-y-3 rounded-lg border border-ink/15 bg-white/80 p-5">
        <p role="status" className="text-sm font-medium text-ink">
          Không tìm thấy thông tin điểm dừng này.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "skipStop" })}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-4 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Bỏ qua điểm
        </button>
      </section>
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
    <div className="space-y-4">
      <TourMap stops={mapStops} activeSpotId={spot.id} />

      <section className="space-y-4 rounded-lg border border-ink/15 bg-white/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-terracotta">
            Điểm {state.stopIndex + 1}/{plan.stops.length}
          </span>
        </div>

        <h2
          tabIndex={-1}
          ref={headingRef}
          className="text-lg font-bold text-ink focus:outline-none"
        >
          {spot.name}
        </h2>

        {showImage && (
          <div className="overflow-hidden rounded-md border border-ink/10 bg-sand/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              onError={() => setFailedImageKey(stopKey)}
              className="h-44 w-full object-cover"
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
              className="min-h-20 rounded-md border border-ink/10 bg-sand/60 p-4 text-lg font-medium leading-relaxed text-ink"
            >
              {currentSentence}
            </div>

            {!useAudioMode && (
              <p className="text-xs text-muted">
                {speech.supported
                  ? "Giọng đọc của trình duyệt"
                  : "Chưa có giọng tiếng Việt, phụ đề tự chạy"}
              </p>
            )}

            <details className="rounded-md border border-ink/10 bg-sand/30 px-3 py-2 text-sm text-ink">
              <summary className="cursor-pointer py-1 font-semibold text-river focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta">
                Xem toàn bộ lời kể
              </summary>
              <p className="mt-2 leading-relaxed text-muted">{fullText}</p>
            </details>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePause}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-terracotta px-4 py-2 text-sm font-semibold text-sand transition-opacity motion-reduce:transition-none hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                {paused ? "Tiếp tục" : "Tạm dừng"}
              </button>

              <button
                type="button"
                onClick={handleReplay}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                Nghe lại
              </button>

              <button
                type="button"
                onClick={handleSkipStop}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                Bỏ qua điểm
              </button>
            </div>
          </div>
        ) : (
          <TourStopStation key={spot.id} spot={spot} dispatch={dispatch} />
        )}
      </section>
    </div>
  );
}

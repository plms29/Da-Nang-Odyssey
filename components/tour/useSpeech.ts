"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sentenceTimings } from "@/lib/tour/subtitles";

export interface UseSpeechSpeakOptions {
  onSentence(i: number): void;
  onEnd(): void;
  fallbackSeconds?: number;
}

export interface UseSpeechResult {
  supported: boolean;
  speak(sentences: string[], opts: UseSpeechSpeakOptions): void;
  pause(): void;
  resume(): void;
  cancel(): void;
  speaking: boolean;
}

interface FallbackRunner {
  runId: number;
  timingsMs: number[];
  totalMs: number;
  nextIndex: number;
  elapsedMs: number;
  startedAt: number | null;
  paused: boolean;
  timeoutId: ReturnType<typeof setTimeout> | null;
  onSentence: (i: number) => void;
  onEnd: () => void;
}

function findVietnameseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  const synth = window.speechSynthesis;
  if (!synth || typeof synth.getVoices !== "function") {
    return null;
  }
  const voices = synth.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase() === "vi-vn") ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("vi")) ??
    null
  );
}

/**
 * Browser Vietnamese speech synthesis hook with a timer-based subtitle fallback
 * when no `vi*` voice is available.
 */
export function useSpeech(): UseSpeechResult {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const supportedRef = useRef(false);
  const speakingRef = useRef(false);
  const mountedRef = useRef(true);
  const runIdRef = useRef(0);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackRef = useRef<FallbackRunner | null>(null);

  const setSpeakingState = useCallback((next: boolean) => {
    speakingRef.current = next;
    if (mountedRef.current) {
      setSpeaking(next);
    }
  }, []);

  const stopActiveRun = useCallback(() => {
    runIdRef.current += 1;

    const fallback = fallbackRef.current;
    if (fallback) {
      if (fallback.timeoutId !== null) {
        clearTimeout(fallback.timeoutId);
      }
      fallbackRef.current = null;
    }

    const activeUtterance = activeUtteranceRef.current;
    if (activeUtterance) {
      activeUtterance.onstart = null;
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
      activeUtteranceRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch {
        // Ignore teardown errors from browser speech synthesis.
      }
    }

    setSpeakingState(false);
  }, [setSpeakingState]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    const refreshVoices = () => {
      const voice = findVietnameseVoice();
      voiceRef.current = voice;
      const isSupported = voice !== null;
      supportedRef.current = isSupported;
      if (mountedRef.current) {
        setSupported(isSupported);
      }
    };

    refreshVoices();

    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", refreshVoices);
      return () => {
        synth.removeEventListener("voiceschanged", refreshVoices);
      };
    }

    const previousHandler = synth.onvoiceschanged;
    synth.onvoiceschanged = refreshVoices;
    return () => {
      if (synth.onvoiceschanged === refreshVoices) {
        synth.onvoiceschanged = previousHandler ?? null;
      }
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopActiveRun();
    };
  }, [stopActiveRun]);

  const scheduleFallbackStep = useCallback(
    (runner: FallbackRunner) => {
      if (runner.paused || runIdRef.current !== runner.runId) {
        return;
      }

      const elapsedNow =
        runner.elapsedMs +
        (runner.startedAt !== null ? Date.now() - runner.startedAt : 0);

      const targetMs =
        runner.nextIndex < runner.timingsMs.length
          ? runner.timingsMs[runner.nextIndex]
          : runner.totalMs;

      const delayMs = Math.max(0, targetMs - elapsedNow);

      runner.timeoutId = setTimeout(() => {
        runner.timeoutId = null;
        if (runner.paused || runIdRef.current !== runner.runId) {
          return;
        }

        const currentElapsed =
          runner.elapsedMs +
          (runner.startedAt !== null ? Date.now() - runner.startedAt : 0);

        if (runner.nextIndex < runner.timingsMs.length) {
          const emitIndex = runner.nextIndex;
          runner.nextIndex += 1;
          runner.onSentence(emitIndex);

          if (runner.paused || runIdRef.current !== runner.runId) {
            return;
          }

          // Emit any additional sentences whose timestamps have already passed (e.g. 0s duration).
          while (
            runner.nextIndex < runner.timingsMs.length &&
            runner.timingsMs[runner.nextIndex] <= currentElapsed
          ) {
            const extraIndex = runner.nextIndex;
            runner.nextIndex += 1;
            runner.onSentence(extraIndex);

            if (runner.paused || runIdRef.current !== runner.runId) {
              return;
            }
          }

          scheduleFallbackStep(runner);
          return;
        }

        fallbackRef.current = null;
        setSpeakingState(false);
        runner.onEnd();
      }, delayMs);
    },
    [setSpeakingState]
  );

  // onEnd may fire synchronously for an empty sentences list.
  const speak = useCallback(
    (sentences: string[], opts: UseSpeechSpeakOptions) => {
      stopActiveRun();
      const runId = ++runIdRef.current;

      if (sentences.length === 0) {
        setSpeakingState(false);
        if (runIdRef.current === runId) {
          opts.onEnd();
        }
        return;
      }

      const voice = voiceRef.current;
      if (
        supportedRef.current &&
        voice !== null &&
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        setSpeakingState(true);
        const firedSentences = new Set<number>();
        const emitSentence = (index: number) => {
          if (runIdRef.current !== runId || firedSentences.has(index)) {
            return;
          }
          firedSentences.add(index);
          opts.onSentence(index);
        };

        const speakSentence = (index: number) => {
          if (runIdRef.current !== runId) return;

          if (index >= sentences.length) {
            activeUtteranceRef.current = null;
            setSpeakingState(false);
            opts.onEnd();
            return;
          }

          const utterance = new SpeechSynthesisUtterance(sentences[index]);
          utterance.lang = "vi-VN";
          utterance.voice = voice;
          utterance.rate = 1;
          activeUtteranceRef.current = utterance;

          let handledEnd = false;
          const handleSentenceFinish = () => {
            if (handledEnd || runIdRef.current !== runId) return;
            handledEnd = true;
            utterance.onstart = null;
            utterance.onend = null;
            utterance.onerror = null;
            emitSentence(index);
            if (runIdRef.current !== runId) return;
            speakSentence(index + 1);
          };

          utterance.onstart = () => {
            emitSentence(index);
          };
          utterance.onend = handleSentenceFinish;
          utterance.onerror = handleSentenceFinish;

          window.speechSynthesis.speak(utterance);
        };

        speakSentence(0);
        return;
      }

      const fallbackSeconds = Math.max(0, opts.fallbackSeconds ?? 20);
      const timingsMs = sentenceTimings(sentences, fallbackSeconds).map(
        (seconds) => seconds * 1000
      );

      const runner: FallbackRunner = {
        runId,
        timingsMs,
        totalMs: fallbackSeconds * 1000,
        nextIndex: 0,
        elapsedMs: 0,
        startedAt: Date.now(),
        paused: false,
        timeoutId: null,
        onSentence: opts.onSentence,
        onEnd: opts.onEnd,
      };

      fallbackRef.current = runner;
      setSpeakingState(true);
      scheduleFallbackStep(runner);
    },
    [scheduleFallbackStep, setSpeakingState, stopActiveRun]
  );

  const pause = useCallback(() => {
    if (!speakingRef.current) return;

    const fallback = fallbackRef.current;
    if (fallback) {
      if (fallback.paused) return;
      if (fallback.timeoutId !== null) {
        clearTimeout(fallback.timeoutId);
        fallback.timeoutId = null;
      }
      if (fallback.startedAt !== null) {
        fallback.elapsedMs += Date.now() - fallback.startedAt;
        fallback.startedAt = null;
      }
      fallback.paused = true;
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (!speakingRef.current) return;

    const fallback = fallbackRef.current;
    if (fallback) {
      if (!fallback.paused) return;
      fallback.paused = false;
      fallback.startedAt = Date.now();
      scheduleFallbackStep(fallback);
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  }, [scheduleFallbackStep]);

  const cancel = useCallback(() => {
    stopActiveRun();
  }, [stopActiveRun]);

  return {
    supported,
    speak,
    pause,
    resume,
    cancel,
    speaking,
  };
}

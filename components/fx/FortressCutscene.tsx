"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type CutscenePhase = "idle" | "fade-in" | "playing" | "fade-out";

const TARGET_ROUTE = "/kham-pha/man-2-giu-thanh";
const VIDEO_SRC = "/background/nguyen-tri-phuong-pov.mp4";

let lastTriggeredAt = 0;
const listeners = new Set<() => void>();

export function triggerFortressCutscene(): void {
  const now = Date.now();
  if (now - lastTriggeredAt < 1500) return;
  lastTriggeredAt = now;
  listeners.forEach((fn) => fn());
}

export function FortressCutsceneHost() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(pathname);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fadeOutTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<CutscenePhase>("idle");
  const phaseRef = useRef<CutscenePhase>("idle");

  const updatePhase = useCallback((next: CutscenePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (fadeOutTimerRef.current !== null) {
      window.clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const beginFadeOut = useCallback(() => {
    if (phaseRef.current === "idle" || phaseRef.current === "fade-out") {
      return;
    }
    clearTimers();
    updatePhase("fade-out");
    fadeOutTimerRef.current = window.setTimeout(() => {
      const vid = videoRef.current;
      if (vid) {
        vid.pause();
      }
      updatePhase("idle");
    }, 700);
  }, [clearTimers, updatePhase]);

  const startCutscene = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    clearTimers();
    updatePhase("fade-in");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (phaseRef.current === "fade-in") {
          updatePhase("playing");
        }
      });
    });

    // Safety fallback in case video stalls or browser throttles media events
    safetyTimerRef.current = window.setTimeout(() => {
      beginFadeOut();
    }, 5200);
  }, [beginFadeOut, clearTimers, updatePhase]);

  useEffect(() => {
    listeners.add(startCutscene);
    return () => {
      listeners.delete(startCutscene);
    };
  }, [startCutscene]);

  // Intercept clicks on any link pointing to /kham-pha/man-2-giu-thanh so the fade-in starts immediately
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith(TARGET_ROUTE)) {
        triggerFortressCutscene();
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  // Also trigger if pathname navigates into /kham-pha/man-2-giu-thanh
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (pathname?.startsWith(TARGET_ROUTE) && prev !== pathname) {
      triggerFortressCutscene();
    }
  }, [pathname]);

  // Start playing the video whenever cutscene becomes active
  useEffect(() => {
    if (phase !== "fade-in" && phase !== "playing") return;
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.currentTime = 0;
      vid.muted = false;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          vid.muted = true;
          vid.play().catch(() => {
            beginFadeOut();
          });
        });
      }
    }
  }, [phase, beginFadeOut]);

  useEffect(() => {
    if (phase === "idle") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        beginFadeOut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, beginFadeOut]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  if (phase === "idle") {
    return null;
  }

  const isVisible = phase === "playing";

  return (
    <div
      role="dialog"
      aria-label="Chuyển cảnh Thành Điện Hải"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-700 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        playsInline
        preload="auto"
        onTimeUpdate={(event) => {
          const vid = event.currentTarget;
          if (
            vid.duration > 0 &&
            vid.duration - vid.currentTime <= 0.65 &&
            phase === "playing"
          ) {
            beginFadeOut();
          }
        }}
        onEnded={beginFadeOut}
        onError={beginFadeOut}
        className="h-full w-full object-cover"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-8 lg:px-12 lg:pb-10">
        <div className="space-y-1 text-white">
          <p className="text-xs font-medium text-white/75">
            Thành Điện Hải, Đà Nẵng (1858)
          </p>
          <p className="text-base font-semibold tracking-tight sm:text-lg">
            Danh tướng Nguyễn Tri Phương chỉ huy giữ thành
          </p>
        </div>

        <button
          type="button"
          onClick={beginFadeOut}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-black/50 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  );
}


"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";
import {
  type JSX,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

export interface ZoomNavigateProps {
  href: string;
  sky: string;
  label: string;
  className?: string;
  children: ReactNode;
}

export interface ZoomRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ZoomPayload {
  rect: ZoomRect;
  sky: string;
  label: string;
  href: string;
  radius: number;
}

export interface ZoomTransform {
  x: number;
  y: number;
  sx: number;
  sy: number;
}

const ANIMATION_MS = 420;
const NAVIGATE_DELAY_MS = 300;
const FADE_OUT_MS = 150;
const TEARDOWN_DELAY_MS = 50;
const CLEAR_AFTER_FADE_MS = 180;
const SAFETY_TIMEOUT_MS = 2000;

let current: ZoomPayload | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ZoomPayload | null {
  return current;
}

function getServerSnapshot(): ZoomPayload | null {
  return null;
}

/**
 * Starts a route-persistent zoom transition using the given payload.
 */
export function startZoom(payload: ZoomPayload): void {
  current = payload;
  notify();
}

/**
 * Clears the active zoom transition payload and hides the overlay host.
 */
export function clearZoom(): void {
  current = null;
  notify();
}

/**
 * Subscribes a client component to the active zoom payload store.
 */
export function useZoomPayload(): ZoomPayload | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Computes the initial translate and scale transform needed to match a viewport rect.
 */
export function zoomFromRect(
  rect: ZoomRect,
  vw: number,
  vh: number,
): ZoomTransform {
  return {
    x: rect.left,
    y: rect.top,
    sx: vw > 0 ? rect.width / vw : 1,
    sy: vh > 0 ? rect.height / vh : 1,
  };
}

/**
 * Evaluates cubic-bezier(0.22, 1, 0.36, 1) at normalized progress t in [0, 1].
 */
function easeOutCurve(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  const x1 = 0.22;
  const y1 = 1;
  const x2 = 0.36;
  const y2 = 1;

  let u = t;
  for (let i = 0; i < 5; i += 1) {
    const inv = 1 - u;
    const x =
      3 * inv * inv * u * x1 + 3 * inv * u * u * x2 + u * u * u;
    const dx =
      3 * inv * inv * x1 +
      6 * inv * u * (x2 - x1) +
      3 * u * u * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    u = Math.min(1, Math.max(0, u - (x - t) / dx));
  }

  const inv = 1 - u;
  return 3 * inv * inv * u * y1 + 3 * inv * u * u * y2 + u * u * u;
}

/**
 * Root-level host that renders and animates the zoom overlay across route changes.
 */
export function ZoomOverlayHost(): JSX.Element | null {
  const payload = useZoomPayload();
  const router = useRouter();
  const pathname = usePathname();

  const routerRef = useRef(router);
  routerRef.current = router;

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const navTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const teardownTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const animRafRef = useRef<number>(0);
  const fadingRef = useRef<boolean>(false);

  const clearScheduled = useCallback((): void => {
    if (navTimerRef.current !== null) {
      window.clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    if (teardownTimerRef.current !== null) {
      window.clearTimeout(teardownTimerRef.current);
      teardownTimerRef.current = null;
    }
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (animRafRef.current) {
      window.cancelAnimationFrame(animRafRef.current);
      animRafRef.current = 0;
    }
  }, []);

  const startFadeOut = useCallback((): void => {
    if (fadingRef.current) return;
    fadingRef.current = true;

    if (navTimerRef.current !== null) {
      window.clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    if (teardownTimerRef.current !== null) {
      window.clearTimeout(teardownTimerRef.current);
      teardownTimerRef.current = null;
    }

    const el = overlayRef.current;
    if (!el) {
      clearZoom();
      return;
    }

    el.style.transition = `opacity ${FADE_OUT_MS}ms ease-out`;
    el.style.opacity = "0";

    fadeTimerRef.current = window.setTimeout(() => {
      fadeTimerRef.current = null;
      clearZoom();
    }, CLEAR_AFTER_FADE_MS);
  }, []);

  useEffect(() => {
    clearScheduled();
    fadingRef.current = false;

    if (!payload) return;
    const el = overlayRef.current;
    if (!el) return;

    const labelEl = labelRef.current;
    const vw = el.clientWidth > 0 ? el.clientWidth : window.innerWidth;
    const vh = el.clientHeight > 0 ? el.clientHeight : window.innerHeight;
    const start = zoomFromRect(payload.rect, vw, vh);

    el.style.opacity = "1";
    el.style.transform = `translate(${start.x}px, ${start.y}px) scale(${start.sx}, ${start.sy})`;
    el.style.borderRadius = `${payload.radius}px`;
    if (labelEl) {
      labelEl.style.opacity = "0";
    }

    let startTime: number | null = null;
    const tick = (now: number): void => {
      if (startTime === null) startTime = now;
      const t = Math.min(1, (now - startTime) / ANIMATION_MS);
      const eased = easeOutCurve(t);

      const cx = start.x * (1 - eased);
      const cy = start.y * (1 - eased);
      const csx = start.sx + (1 - start.sx) * eased;
      const csy = start.sy + (1 - start.sy) * eased;
      const cr = payload.radius * (1 - eased);

      el.style.transform = `translate(${cx}px, ${cy}px) scale(${csx}, ${csy})`;
      el.style.borderRadius = `${cr}px`;

      if (labelEl) {
        const opacity =
          t < 0.35 ? t / 0.35 : t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1;
        labelEl.style.opacity = String(opacity);
      }

      if (t < 1) {
        animRafRef.current = window.requestAnimationFrame(tick);
      } else {
        animRafRef.current = 0;
      }
    };

    animRafRef.current = window.requestAnimationFrame(tick);

    navTimerRef.current = window.setTimeout(() => {
      navTimerRef.current = null;
      routerRef.current.push(payload.href);
    }, NAVIGATE_DELAY_MS);

    safetyTimerRef.current = window.setTimeout(() => {
      safetyTimerRef.current = null;
      startFadeOut();
    }, SAFETY_TIMEOUT_MS);

    return () => {
      clearScheduled();
    };
  }, [payload, clearScheduled, startFadeOut]);

  useEffect(() => {
    if (!payload || pathname !== payload.href) return;

    teardownTimerRef.current = window.setTimeout(() => {
      teardownTimerRef.current = null;
      startFadeOut();
    }, TEARDOWN_DELAY_MS);

    return () => {
      if (teardownTimerRef.current !== null) {
        window.clearTimeout(teardownTimerRef.current);
        teardownTimerRef.current = null;
      }
    };
  }, [payload, pathname, startFadeOut]);

  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (
        document.visibilityState === "visible" &&
        payload &&
        pathname === payload.href
      ) {
        startFadeOut();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [payload, pathname, startFadeOut]);

  const initialTransform = useMemo(() => {
    if (!payload || typeof window === "undefined") return undefined;
    const z = zoomFromRect(
      payload.rect,
      window.innerWidth,
      window.innerHeight,
    );
    return `translate(${z.x}px, ${z.y}px) scale(${z.sx}, ${z.sy})`;
  }, [payload]);

  if (!payload) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="fixed inset-0 z-[100] overflow-hidden pointer-events-none"
      style={{
        background: payload.sky,
        transformOrigin: "0 0",
        transform: initialTransform,
        borderRadius: `${payload.radius}px`,
      }}
    >
      <div
        ref={labelRef}
        className="absolute right-6 bottom-8 left-6 text-2xl font-bold tracking-tight text-white opacity-0 sm:bottom-12 sm:left-10 sm:text-4xl"
        style={{ textShadow: "0 2px 12px rgba(31, 26, 23, 0.45)" }}
      >
        {payload.label}
      </div>
    </div>
  );
}

/**
 * Anchor link that triggers a route-persistent zoom overlay from the card rect into the target route.
 */
export function ZoomNavigate({
  href,
  sky,
  label,
  className,
  children,
}: ZoomNavigateProps): JSX.Element {
  const router = useRouter();
  const reduced = useReducedMotion();

  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  const prefetchedRef = useRef(false);

  const triggerPrefetch = (): void => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    router.prefetch(href);
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>): void => {
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      reduced
    ) {
      return;
    }

    const anchor = anchorRef.current;
    if (!anchor) return;

    e.preventDefault();

    const domRect = anchor.getBoundingClientRect();
    const rect: ZoomRect = {
      left: domRect.left,
      top: domRect.top,
      width: domRect.width,
      height: domRect.height,
    };
    const computedRadius = Number.parseFloat(
      window.getComputedStyle(anchor).borderRadius,
    );
    const radius =
      Number.isFinite(computedRadius) && computedRadius > 0
        ? computedRadius
        : 8;

    startZoom({
      rect,
      sky,
      label,
      href,
      radius,
    });
  };

  return (
    <Link
      href={href}
      prefetch={false}
      ref={anchorRef}
      className={className}
      onClick={handleClick}
      onPointerEnter={triggerPrefetch}
      onFocus={triggerPrefetch}
    >
      {children}
    </Link>
  );
}

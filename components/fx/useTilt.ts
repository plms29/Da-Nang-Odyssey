"use client";

import { motionValue, useSpring, type MotionValue } from "motion/react";
import { useEffect, useSyncExternalStore } from "react";

export type TiltSource = "pointer" | "device" | "none";

interface DeviceOrientationEventWithPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

const SPRING_CONFIG = { stiffness: 120, damping: 20 };
const TILT_GRANTED_KEY = "tilt-granted";
const STALE_GRANT_TIMEOUT_MS = 1000;
const DEVICE_STALE_MS = 1500;

const rawX = motionValue(0);
const rawY = motionValue(0);

let currentSource: TiltSource = "none";
let needsPermission = false;
let subscribers = 0;
let pointerListenerAttached = false;
let deviceListenerAttached = false;
let base: { beta: number; gamma: number } | null = null;
let lastDeviceEventAt = 0;
let staleGrantTimer: ReturnType<typeof setTimeout> | null = null;

const sourceListeners = new Set<() => void>();
const permissionListeners = new Set<() => void>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function subscribeTo(listeners: Set<() => void>, listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setSource(next: TiltSource): void {
  if (currentSource === next) return;
  currentSource = next;
  sourceListeners.forEach((listener) => listener());
}

function subscribeSource(listener: () => void): () => void {
  return subscribeTo(sourceListeners, listener);
}

function getSourceSnapshot(): TiltSource {
  return currentSource;
}

function getServerSourceSnapshot(): TiltSource {
  return "none";
}

function setNeedsPermission(next: boolean): void {
  if (needsPermission === next) return;
  needsPermission = next;
  permissionListeners.forEach((listener) => listener());
}

function subscribeNeedsPermission(listener: () => void): () => void {
  return subscribeTo(permissionListeners, listener);
}

function getNeedsPermissionSnapshot(): boolean {
  return needsPermission;
}

function getServerNeedsPermissionSnapshot(): boolean {
  return false;
}

function clearStaleGrantTimer(): void {
  if (staleGrantTimer !== null) {
    clearTimeout(staleGrantTimer);
    staleGrantTimer = null;
  }
}

/**
 * Returns true when a valid deviceorientation event was observed within the staleness window.
 */
export function deviceIsLive(
  now: number,
  lastEventAt: number = lastDeviceEventAt
): boolean {
  return lastEventAt > 0 && now - lastEventAt < DEVICE_STALE_MS;
}

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isIOSPermissionRequired(): boolean {
  return (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof (
      DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission
    ).requestPermission === "function"
  );
}

function handleDeviceOrientation(event: DeviceOrientationEvent): void {
  if (event.beta === null || event.gamma === null) return;
  lastDeviceEventAt = Date.now();
  setNeedsPermission(false);
  clearStaleGrantTimer();
  if (base === null) {
    base = { beta: event.beta, gamma: event.gamma };
  }
  setSource("device");
  const { x, y } = orientationToTilt(event.beta, event.gamma, base);
  rawX.set(x);
  rawY.set(y);
}

function handlePointerMove(event: PointerEvent): void {
  if (event.pointerType === "touch") return;
  // Source stays "device" after device events stop until the next pointer event arrives.
  if (deviceIsLive(Date.now())) return;

  const halfWidth = window.innerWidth / 2;
  const halfHeight = window.innerHeight / 2;
  const x = halfWidth > 0 ? clamp((event.clientX - halfWidth) / halfWidth, -1, 1) : 0;
  const y = halfHeight > 0 ? clamp((event.clientY - halfHeight) / halfHeight, -1, 1) : 0;

  setSource("pointer");
  rawX.set(x);
  rawY.set(y);
}

function attachListeners(): void {
  if (typeof window === "undefined" || isReducedMotion()) return;

  if (!pointerListenerAttached) {
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    pointerListenerAttached = true;
  }

  if (isIOSPermissionRequired()) {
    let granted = false;
    try {
      granted = window.localStorage.getItem(TILT_GRANTED_KEY) === "1";
    } catch {
      granted = false;
    }
    if (granted) {
      enableDeviceTilt();
      clearStaleGrantTimer();
      staleGrantTimer = setTimeout(() => {
        staleGrantTimer = null;
        if (lastDeviceEventAt === 0 || currentSource !== "device") {
          try {
            window.localStorage.removeItem(TILT_GRANTED_KEY);
          } catch {
            // Ignore storage errors (e.g. private mode restrictions)
          }
          setNeedsPermission(true);
          if (deviceListenerAttached) {
            window.removeEventListener("deviceorientation", handleDeviceOrientation);
            deviceListenerAttached = false;
          }
        }
      }, STALE_GRANT_TIMEOUT_MS);
    }
  } else {
    enableDeviceTilt();
  }
}

function detachListeners(): void {
  if (typeof window === "undefined") return;

  clearStaleGrantTimer();
  if (pointerListenerAttached) {
    window.removeEventListener("pointermove", handlePointerMove);
    pointerListenerAttached = false;
  }
  if (deviceListenerAttached) {
    window.removeEventListener("deviceorientation", handleDeviceOrientation);
    deviceListenerAttached = false;
  }

  lastDeviceEventAt = 0;
  base = null;
  rawX.set(0);
  rawY.set(0);
  setSource("none");
}

/**
 * Converts deviceorientation beta/gamma angles relative to a baseline into clamped [-1, 1] tilt coordinates.
 */
export function orientationToTilt(
  beta: number,
  gamma: number,
  baseline: { beta: number; gamma: number },
  maxDeg = 12
): { x: number; y: number } {
  const x = clamp((gamma - baseline.gamma) / maxDeg, -1, 1) || 0;
  const y = clamp((beta - baseline.beta) / maxDeg, -1, 1) || 0;
  return { x, y };
}

/**
 * Attaches the global deviceorientation listener; called by MotionPermissionButton after iOS permission is granted.
 */
export function enableDeviceTilt(): void {
  if (typeof window === "undefined" || isReducedMotion()) return;
  setNeedsPermission(false);
  if (deviceListenerAttached) return;

  window.addEventListener("deviceorientation", handleDeviceOrientation);
  deviceListenerAttached = true;
}

/**
 * Returns true when a stored iOS motion permission grant appears stale and must be re-requested.
 */
export function useNeedsMotionPermission(): boolean {
  return useSyncExternalStore(
    subscribeNeedsPermission,
    getNeedsPermissionSnapshot,
    getServerNeedsPermissionSnapshot
  );
}

/**
 * Returns shared, spring-smoothed x/y tilt MotionValues in [-1, 1] and the active tilt input source.
 */
export function useTilt(): {
  x: MotionValue<number>;
  y: MotionValue<number>;
  source: TiltSource;
} {
  const source = useSyncExternalStore(
    subscribeSource,
    getSourceSnapshot,
    getServerSourceSnapshot
  );

  useEffect(() => {
    subscribers += 1;
    if (subscribers === 1) {
      attachListeners();
    }

    return () => {
      subscribers -= 1;
      if (subscribers <= 0) {
        subscribers = 0;
        detachListeners();
      }
    };
  }, []);

  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  return { x, y, source };
}

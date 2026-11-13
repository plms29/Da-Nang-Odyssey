export type HapticKind = "tap" | "success" | "error";

export const HAPTIC_PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 10,
  success: [20, 40, 30],
  error: [40, 60, 40],
};

export function haptic(kind: HapticKind): void {
  if (typeof window === "undefined") return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate(HAPTIC_PATTERNS[kind]);
  } catch {
    // Ignore vibration errors in restricted environments.
  }
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { HAPTIC_PATTERNS, haptic } from "@/lib/haptics";

describe("haptics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defines expected vibration patterns", () => {
    expect(HAPTIC_PATTERNS.tap).toBe(10);
    expect(HAPTIC_PATTERNS.success).toEqual([20, 40, 30]);
    expect(HAPTIC_PATTERNS.error).toEqual([40, 60, 40]);
  });

  it("does not throw when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);
    expect(() => haptic("tap")).not.toThrow();
  });

  it("does not throw when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(() => haptic("success")).not.toThrow();
  });

  it("calls navigator.vibrate when supported and motion is allowed", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: false })),
    });
    vi.stubGlobal("navigator", { vibrate });

    haptic("success");
    expect(vibrate).toHaveBeenCalledWith([20, 40, 30]);
  });

  it("skips vibration when prefers-reduced-motion is enabled", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });
    vi.stubGlobal("navigator", { vibrate });

    haptic("error");
    expect(vibrate).not.toHaveBeenCalled();
  });
});

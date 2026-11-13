import { describe, expect, it } from "vitest";
import { deviceIsLive, orientationToTilt } from "./useTilt";

describe("orientationToTilt", () => {
  it("returns zero tilt at baseline", () => {
    expect(orientationToTilt(30, 5, { beta: 30, gamma: 5 })).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("maps gamma +6 to x = 0.5 and beta -6 to y = -0.5 with default maxDeg", () => {
    expect(orientationToTilt(24, 11, { beta: 30, gamma: 5 })).toEqual({
      x: 0.5,
      y: -0.5,
    });
  });

  it("clamps large positive and negative deltas to [-1, 1]", () => {
    expect(orientationToTilt(100, 100, { beta: 0, gamma: 0 })).toEqual({
      x: 1,
      y: 1,
    });
    expect(orientationToTilt(-100, -100, { beta: 0, gamma: 0 })).toEqual({
      x: -1,
      y: -1,
    });
  });

  it("supports custom maxDeg", () => {
    expect(orientationToTilt(0, 10, { beta: 0, gamma: 0 }, 20)).toEqual({
      x: 0.5,
      y: 0,
    });
  });

  it("maps delta equal to maxDeg to x = 1", () => {
    expect(orientationToTilt(0, 12, { beta: 0, gamma: 0 })).toEqual({
      x: 1,
      y: 0,
    });
  });
});

describe("deviceIsLive", () => {
  it("returns false when no device event has arrived", () => {
    expect(deviceIsLive(1000, 0)).toBe(false);
  });

  it("returns true while within the 1500 ms staleness window", () => {
    expect(deviceIsLive(1000, 1000)).toBe(true);
    expect(deviceIsLive(2499, 1000)).toBe(true);
  });

  it("returns false at or beyond the 1500 ms staleness boundary", () => {
    expect(deviceIsLive(2500, 1000)).toBe(false);
    expect(deviceIsLive(5000, 1000)).toBe(false);
  });
});

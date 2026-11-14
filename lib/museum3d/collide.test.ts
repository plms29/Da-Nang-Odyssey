import { describe, it, expect } from "vitest";
import { clampToBounds, type Bounds } from "./collide";

const ROOM: Bounds = {
  minX: -6,
  maxX: 6,
  minZ: -10,
  maxZ: 10,
};

describe("clampToBounds", () => {
  it("keeps a point well inside the bounds unchanged", () => {
    expect(clampToBounds(1.5, -2.25, ROOM)).toEqual({ x: 1.5, z: -2.25 });
    expect(clampToBounds(0, 0, ROOM)).toEqual({ x: 0, z: 0 });
  });

  it("keeps a point right on the inset boundary unchanged", () => {
    expect(clampToBounds(-5.6, 9.6, ROOM)).toEqual({ x: -5.6, z: 9.6 });
  });

  it("clamps points outside each single edge respecting default radius 0.4", () => {
    expect(clampToBounds(-8, 0, ROOM)).toEqual({ x: -5.6, z: 0 });
    expect(clampToBounds(7.2, 0, ROOM)).toEqual({ x: 5.6, z: 0 });
    expect(clampToBounds(0, -12, ROOM)).toEqual({ x: 0, z: -9.6 });
    expect(clampToBounds(0, 15, ROOM)).toEqual({ x: 0, z: 9.6 });
  });

  it("clamps points outside corners on both X and Z axes", () => {
    expect(clampToBounds(-10, -20, ROOM)).toEqual({ x: -5.6, z: -9.6 });
    expect(clampToBounds(10, 20, ROOM)).toEqual({ x: 5.6, z: 9.6 });
    expect(clampToBounds(-10, 20, ROOM)).toEqual({ x: -5.6, z: 9.6 });
    expect(clampToBounds(10, -20, ROOM)).toEqual({ x: 5.6, z: -9.6 });
  });

  it("respects custom radius values including zero", () => {
    expect(clampToBounds(6, 10, ROOM, 1.0)).toEqual({ x: 5, z: 9 });
    expect(clampToBounds(6, 10, ROOM, 0)).toEqual({ x: 6, z: 10 });
  });

  it("centers on an axis when radius exceeds half the room width", () => {
    const narrow: Bounds = { minX: 0, maxX: 0.5, minZ: -5, maxZ: 5 };
    expect(clampToBounds(10, 0, narrow, 0.4)).toEqual({ x: 0.25, z: 0 });
  });
});

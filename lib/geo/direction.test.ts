import { describe, it, expect } from "vitest";
import { bearingDeg, directionHint, directionName, formatDistance } from "./direction";

const o = { lat: 16, lng: 108 };

describe("direction", () => {
  it("bearing: north 0, east ~90", () => {
    expect(bearingDeg(o, { lat: 16.01, lng: 108 })).toBeCloseTo(0, 5);
    expect(bearingDeg(o, { lat: 16, lng: 108.01 })).toBeCloseTo(90, 1);
  });
  it("8 sectors split at 22.5°", () => {
    expect(directionName(22.4)).toBe("Bắc");
    expect(directionName(22.6)).toBe("Đông Bắc");
    expect(directionName(359)).toBe("Bắc");
    expect(directionName(225)).toBe("Tây Nam");
  });
  it("formats distance", () => {
    expect(formatDistance(5)).toBe("5 m");
    expect(formatDistance(994)).toBe("990 m");
    expect(formatDistance(996)).toBe("1,0 km");
    expect(formatDistance(1234)).toBe("1,2 km");
  });
  it("hint", () => {
    expect(directionHint(o, o)).toBe("Bạn đang ở ngay đây!");
    expect(directionHint(o, { lat: 16.01, lng: 108 })).toBe("còn ~1,1 km về phía Bắc");
  });
});

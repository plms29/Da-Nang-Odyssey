import { describe, expect, it } from "vitest";
import { formatDistance } from "./formatDistance";

describe("formatDistance", () => {
  it("rounds distances under 1000 m to the nearest 10 m", () => {
    expect(formatDistance(87)).toBe("90 m");
    expect(formatDistance(994)).toBe("990 m");
  });

  it("formats distances from 1000 m upwards in km with a Vietnamese comma", () => {
    expect(formatDistance(997)).toBe("1,0 km");
    expect(formatDistance(1000)).toBe("1,0 km");
    expect(formatDistance(2345)).toBe("2,3 km");
  });
});

import { describe, it, expect } from "vitest";
import {
  attemptScore,
  checkJigsaw,
  checkMapPin,
  checkMatch,
  checkOrder,
  finalResult,
} from "@/lib/activities/scoring";
import type { MapPinStation, MatchStation, OrderStation } from "@/lib/types";

describe("attemptScore and finalResult", () => {
  it("returns 100 with no hints or wrong attempts", () => {
    expect(attemptScore(0, 0)).toBe(100);
  });

  it("deducts 20 per hint and 10 per wrong attempt", () => {
    expect(attemptScore(1, 0)).toBe(80);
    expect(attemptScore(0, 2)).toBe(80);
    expect(attemptScore(2, 3)).toBe(30);
  });

  it("floors the score at 20", () => {
    expect(attemptScore(3, 5)).toBe(20);
    expect(attemptScore(10, 10)).toBe(20);
  });

  it("builds finalResult with score 0 when incorrect", () => {
    expect(finalResult(true, 1, 2)).toEqual({
      correct: true,
      score: 60,
      hints_used: 1,
    });
    expect(finalResult(false, 1, 2)).toEqual({
      correct: false,
      score: 0,
      hints_used: 1,
    });
  });
});

describe("checkMapPin", () => {
  const station: MapPinStation = {
    id: "tim",
    type: "map_pin",
    clue: "Bên bờ sông Hàn",
    target: { lat: 16.06, lng: 108.22, radius_m: 150 },
    hints: ["Gợi ý 1", "Gợi ý 2", "Gợi ý 3"],
  };

  it("accepts a pin ~100 m away inside a 150 m radius", () => {
    const res = checkMapPin(station, { lat: 16.0609, lng: 108.22 });
    expect(res.correct).toBe(true);
    expect(res.distance_m).toBeGreaterThan(90);
    expect(res.distance_m).toBeLessThan(110);
  });

  it("rejects a pin ~500 m away outside a 150 m radius", () => {
    const res = checkMapPin(station, { lat: 16.0645, lng: 108.22 });
    expect(res.correct).toBe(false);
    expect(res.distance_m).toBeGreaterThan(490);
    expect(res.distance_m).toBeLessThan(510);
  });
});

describe("checkJigsaw", () => {
  it("returns true when all pieces are in their matching slots", () => {
    expect(checkJigsaw([0, 1, 2, 3, 4, 5, 6, 7, 8], [3, 3])).toBe(true);
  });

  it("returns false when pieces are swapped or count mismatches", () => {
    expect(checkJigsaw([1, 0, 2, 3, 4, 5, 6, 7, 8], [3, 3])).toBe(false);
    expect(checkJigsaw([0, 1, 2], [3, 3])).toBe(false);
  });
});

describe("checkOrder", () => {
  const station: OrderStation = {
    id: "lam",
    type: "order",
    instruction: "Xếp đúng thứ tự",
    items: [
      { id: "su-kien-1", label: "Sự kiện 1" },
      { id: "su-kien-2", label: "Sự kiện 2" },
      { id: "su-kien-3", label: "Sự kiện 3" },
      { id: "su-kien-4", label: "Sự kiện 4" },
    ],
    hints: ["Gợi ý 1", "Gợi ý 2", "Gợi ý 3"],
  };

  it("returns true for the exact item order", () => {
    expect(
      checkOrder(station, ["su-kien-1", "su-kien-2", "su-kien-3", "su-kien-4"])
    ).toBe(true);
  });

  it("returns false for wrong order or missing items", () => {
    expect(
      checkOrder(station, ["su-kien-2", "su-kien-1", "su-kien-3", "su-kien-4"])
    ).toBe(false);
    expect(checkOrder(station, ["su-kien-1", "su-kien-2", "su-kien-3"])).toBe(
      false
    );
  });
});

describe("checkMatch", () => {
  const station: MatchStation = {
    id: "lam",
    type: "match",
    instruction: "Ghép đúng cặp",
    pairs: [
      { id: "con-bai-1", left: "Con 1", right: "Hô 1" },
      { id: "con-bai-2", left: "Con 2", right: "Hô 2" },
      { id: "con-bai-3", left: "Con 3", right: "Hô 3" },
    ],
    hints: ["Gợi ý 1", "Gợi ý 2", "Gợi ý 3"],
  };

  it("returns true when every pair id maps to itself", () => {
    expect(
      checkMatch(station, {
        "con-bai-1": "con-bai-1",
        "con-bai-2": "con-bai-2",
        "con-bai-3": "con-bai-3",
      })
    ).toBe(true);
  });

  it("returns false for mismatched pairs or wrong key count", () => {
    expect(
      checkMatch(station, {
        "con-bai-1": "con-bai-2",
        "con-bai-2": "con-bai-1",
        "con-bai-3": "con-bai-3",
      })
    ).toBe(false);
    expect(
      checkMatch(station, {
        "con-bai-1": "con-bai-1",
        "con-bai-2": "con-bai-2",
      })
    ).toBe(false);
    expect(
      checkMatch(station, {
        "con-bai-1": "con-bai-1",
        "con-bai-2": "con-bai-2",
        "con-bai-3": "con-bai-3",
        extra: "extra",
      })
    ).toBe(false);
  });
});

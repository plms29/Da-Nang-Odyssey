import { describe, it, expect } from "vitest";
import {
  applyLevelResult,
  applyStamp,
  countStamps,
  emptyPassport,
  type PassportState,
} from "./logic";

describe("passport logic", () => {
  it("creates an empty passport", () => {
    expect(emptyPassport()).toEqual({
      stamps: {},
      levels: {},
      total_code_score: 0,
    });
  });

  it("applies level, tour, and visited stamps and keeps first visited date", () => {
    let state = emptyPassport();
    state = applyStamp(state, "bao-tang-cham", "level", "2026-11-10");
    state = applyStamp(state, "bao-tang-cham", "tour", "2026-11-11");
    state = applyStamp(state, "bao-tang-cham", "visited", "2026-11-12");
    state = applyStamp(state, "bao-tang-cham", "visited", "2026-11-20");

    expect(state.stamps["bao-tang-cham"]).toEqual({
      level: true,
      tour: true,
      visited: "2026-11-12",
    });
  });

  it("does not mutate input state on applyStamp or applyLevelResult", () => {
    const initial: PassportState = {
      stamps: { "bao-tang-cham": { level: true } },
      levels: { "level-1": { stars: 2, code_score: 5 } },
      total_code_score: 5,
    };
    const snapshot = structuredClone(initial);

    Object.freeze(initial);
    Object.freeze(initial.stamps);
    Object.freeze(initial.stamps["bao-tang-cham"]);
    Object.freeze(initial.levels);
    Object.freeze(initial.levels["level-1"]);

    const afterStamp = applyStamp(initial, "bao-tang-cham", "visited", "2026-11-13");
    const afterLevel = applyLevelResult(afterStamp, "level-1", 3, 8);

    expect(initial).toEqual(snapshot);
    expect(afterStamp).not.toBe(initial);
    expect(afterStamp.stamps["bao-tang-cham"]).toEqual({
      level: true,
      visited: "2026-11-13",
    });
    expect(afterLevel).not.toBe(afterStamp);
    expect(afterLevel.levels["level-1"]).toEqual({ stars: 3, code_score: 8 });
  });

  it("keeps best stars and best code_score separately per level and sums total_code_score", () => {
    let state = emptyPassport();
    state = applyLevelResult(state, "level-1", 3, 6);
    state = applyLevelResult(state, "level-1", 2, 10);
    state = applyLevelResult(state, "level-1", 1, 4);
    state = applyLevelResult(state, "level-2", 2, 7);

    expect(state.levels["level-1"]).toEqual({ stars: 3, code_score: 10 });
    expect(state.levels["level-2"]).toEqual({ stars: 2, code_score: 7 });
    expect(state.total_code_score).toBe(17);
  });

  it("counts stamps across spots by kind", () => {
    let state = emptyPassport();
    expect(countStamps(state)).toEqual({ level: 0, tour: 0, visited: 0 });

    state = applyStamp(state, "bao-tang-cham", "level", "2026-11-13");
    state = applyStamp(state, "bao-tang-cham", "visited", "2026-11-13");
    state = applyStamp(state, "thanh-dien-hai", "tour", "2026-11-13");
    state = applyStamp(state, "diem-bai-choi", "level", "2026-11-13");
    state = applyStamp(state, "diem-bai-choi", "tour", "2026-11-13");

    expect(countStamps(state)).toEqual({
      level: 2,
      tour: 2,
      visited: 1,
    });
  });
});

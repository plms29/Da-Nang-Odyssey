import { describe, expect, it } from "vitest";
import type { Level } from "@/lib/types";
import {
  demoUnlockAll,
  isLevelUnlocked,
  isSpotUnlocked,
  newlyUnlocked,
  requiredLevel,
  unlockedLevelIds,
  unlockedSpotIds,
} from "./unlock";

const lv = (id: string, spot_ids: string[], unlock?: Level["unlock"]) =>
  ({ id, spot_ids, unlock }) as Level;

const levels = [
  lv("m3", ["a"]),
  lv("m4", ["b", "c"], { after: "m3", min_stars: 1 }),
  lv("m5", ["c", "d"], { after: "m4", min_stars: 2 }),
];
const empty = { levels: {} };
const m3Done = { levels: { m3: { stars: 1 as const, code_score: 10 } } };

describe("unlock", () => {
  it("opens levels without unlock and locks chained ones", () => {
    expect(unlockedLevelIds(levels, empty)).toEqual(["m3"]);
    expect(unlockedLevelIds(levels, m3Done)).toEqual(["m3", "m4"]);
  });

  it("respects min_stars", () => {
    const m4OneStar = { levels: { ...m3Done.levels, m4: { stars: 1 as const, code_score: 5 } } };
    expect(isLevelUnlocked(levels[2], m4OneStar)).toBe(false);
    const m4TwoStars = { levels: { ...m3Done.levels, m4: { stars: 2 as const, code_score: 5 } } };
    expect(isLevelUnlocked(levels[2], m4TwoStars)).toBe(true);
  });

  it("unlockAll opens everything", () => {
    expect(unlockedLevelIds(levels, empty, true)).toEqual(["m3", "m4", "m5"]);
  });

  it("reports only newly opened levels", () => {
    expect(newlyUnlocked(levels, empty, m3Done).map((l) => l.id)).toEqual(["m4"]);
    expect(newlyUnlocked(levels, m3Done, m3Done)).toEqual([]);
  });

  it("opens a spot if any owning level is open; tour-only spots are open", () => {
    expect(isSpotUnlocked("a", levels, empty)).toBe(true);
    expect(isSpotUnlocked("b", levels, empty)).toBe(false);
    expect(isSpotUnlocked("c", levels, m3Done)).toBe(true);
    expect(isSpotUnlocked("tour-only", levels, empty)).toBe(true);
    expect(unlockedSpotIds(["a", "b", "d"], levels, m3Done)).toEqual(["a", "b"]);
  });

  it("finds the required level", () => {
    expect(requiredLevel(levels[1], levels)?.id).toBe("m3");
    expect(requiredLevel(levels[0], levels)).toBeUndefined();
  });

  it("reads the demo flag", () => {
    expect(demoUnlockAll("?mo-khoa=tat-ca")).toBe(true);
    expect(demoUnlockAll("mo-khoa=tat-ca&demo=x")).toBe(true);
    expect(demoUnlockAll("?mo-khoa=1")).toBe(false);
    expect(demoUnlockAll("")).toBe(false);
  });
});

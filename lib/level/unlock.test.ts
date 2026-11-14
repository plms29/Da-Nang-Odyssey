import { describe, expect, it } from "vitest";
import type { Level } from "@/lib/types";
import {
  demoUnlockAll,
  isLevelOpen,
  isSpotUnlocked,
  newlyUnlocked,
  requiredLevel,
  unlockedLevelIds,
  unlockedSpotIds,
} from "./unlock";

const lv = (id: string, order: number, spot_ids: string[]) => ({ id, order, spot_ids }) as Level;

// Deliberately out of order: the rule sorts by `order`.
const levels = [lv("m2", 2, ["b", "c"]), lv("m1", 1, ["a"]), lv("m3", 3, ["c", "d"])];
const empty = { levels: {} };
const m1Done = { levels: { m1: { stars: 1 as const, code_score: 10 } } };

describe("unlock (linear campaign)", () => {
  it("opens only the first level at the start, then the next one after finishing", () => {
    expect(unlockedLevelIds(levels, empty)).toEqual(["m1"]);
    expect(unlockedLevelIds(levels, m1Done)).toEqual(["m2", "m1"]);
    expect(isLevelOpen(levels[2], levels, m1Done)).toBe(false);
  });

  it("unlockAll opens everything", () => {
    expect(unlockedLevelIds(levels, empty, true)).toHaveLength(3);
  });

  it("reports only newly opened levels", () => {
    expect(newlyUnlocked(levels, empty, m1Done).map((l) => l.id)).toEqual(["m2"]);
    expect(newlyUnlocked(levels, m1Done, m1Done)).toEqual([]);
  });

  it("opens a spot if any owning level is open; tour-only spots are open", () => {
    expect(isSpotUnlocked("a", levels, empty)).toBe(true);
    expect(isSpotUnlocked("b", levels, empty)).toBe(false);
    expect(isSpotUnlocked("c", levels, m1Done)).toBe(true);
    expect(isSpotUnlocked("tour-only", levels, empty)).toBe(true);
    expect(unlockedSpotIds(["a", "b", "d"], levels, m1Done)).toEqual(["a", "b"]);
  });

  it("required level is the previous one by order", () => {
    expect(requiredLevel(levels[0], levels)?.id).toBe("m1");
    expect(requiredLevel(levels[2], levels)?.id).toBe("m2");
    expect(requiredLevel(levels[1], levels)).toBeUndefined();
  });

  it("reads the demo flag", () => {
    expect(demoUnlockAll("?mo-khoa=tat-ca")).toBe(true);
    expect(demoUnlockAll("mo-khoa=tat-ca&demo=x")).toBe(true);
    expect(demoUnlockAll("?mo-khoa=1")).toBe(false);
    expect(demoUnlockAll("")).toBe(false);
  });
});

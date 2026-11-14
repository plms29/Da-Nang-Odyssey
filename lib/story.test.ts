import { describe, expect, it } from "vitest";
import { getLevels } from "@/lib/content";
import { getStory, isLevelUnlocked, pagesFound } from "./story";

const levels = getLevels();

describe("story", () => {
  it("opens only the first level at the start", () => {
    expect(isLevelUnlocked(levels, {}, levels[0].id)).toBe(true);
    expect(isLevelUnlocked(levels, {}, levels[1].id)).toBe(false);
    expect(isLevelUnlocked(levels, {}, "khong-co")).toBe(false);
  });

  it("opens the next level once the previous one is done", () => {
    const done = { [levels[0].id]: { stars: 2 } };
    expect(isLevelUnlocked(levels, done, levels[1].id)).toBe(true);
    expect(isLevelUnlocked(levels, done, levels[2].id)).toBe(false);
    expect(pagesFound(levels, done)).toBe(1);
  });

  it("has a guide, prologue and epilogue, and six pages", () => {
    const story = getStory();
    expect(story.guide.name).toBeTruthy();
    expect(story.prologue.length).toBeGreaterThan(0);
    expect(story.epilogue.length).toBeGreaterThan(0);
    expect(levels).toHaveLength(6);
    expect(levels.every((l) => l.page)).toBe(true);
  });
});

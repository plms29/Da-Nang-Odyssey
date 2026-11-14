import storyJson from "@/content/story.json";
import type { Level, Story } from "./types";

export const getStory = (): Story => storyJson as Story;

type Done = Record<string, unknown>;

/** Campaign is linear: a level opens once the level before it (by order) is finished. */
export function isLevelUnlocked(levels: Level[], done: Done, levelId: string): boolean {
  const sorted = levels.slice().sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((l) => l.id === levelId);
  if (index <= 0) return index === 0;
  return Boolean(done[sorted[index - 1].id]);
}

/** Notebook pages found = levels finished. */
export function pagesFound(levels: Level[], done: Done): number {
  return levels.filter((l) => done[l.id]).length;
}

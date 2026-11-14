import type { PassportState } from "@/lib/passport/logic";
import { isLevelUnlocked as storyUnlocked } from "@/lib/story";
import type { Level } from "@/lib/types";

// Thin layer over the campaign rule in lib/story.ts (linear: finish the previous level to open the next).
// Pure functions only; UI reads the passport after hydration and passes it in.

type LevelProgress = Pick<PassportState, "levels">;

export const DEMO_UNLOCK_PARAM = "mo-khoa";
export const DEMO_UNLOCK_VALUE = "tat-ca";

/** `?mo-khoa=tat-ca` opens every level for this page view; nothing is written to the passport. */
export function demoUnlockAll(search: string): boolean {
  return new URLSearchParams(search).get(DEMO_UNLOCK_PARAM)?.trim() === DEMO_UNLOCK_VALUE;
}

export function isLevelOpen(
  level: Pick<Level, "id">,
  levels: Level[],
  passport: LevelProgress,
  unlockAll = false,
): boolean {
  return unlockAll || storyUnlocked(levels, passport.levels, level.id);
}

export function unlockedLevelIds(levels: Level[], passport: LevelProgress, unlockAll = false): string[] {
  return levels.filter((l) => isLevelOpen(l, levels, passport, unlockAll)).map((l) => l.id);
}

/** Levels that were locked in `before` and are open in `after` (e.g. right after recordLevel). */
export function newlyUnlocked(levels: Level[], before: LevelProgress, after: LevelProgress): Level[] {
  return levels.filter((l) => !isLevelOpen(l, levels, before) && isLevelOpen(l, levels, after));
}

/** A spot is open if any level that uses it is open. Spots used by no level (tour-only) are open. */
export function isSpotUnlocked(
  spotId: string,
  levels: Level[],
  passport: LevelProgress,
  unlockAll = false,
): boolean {
  const owners = levels.filter((l) => l.spot_ids.includes(spotId));
  return owners.length === 0 || owners.some((l) => isLevelOpen(l, levels, passport, unlockAll));
}

/** Spot ids the player may visit in tour / remote check-in. */
export function unlockedSpotIds(
  spotIds: string[],
  levels: Level[],
  passport: LevelProgress,
  unlockAll = false,
): string[] {
  return spotIds.filter((id) => isSpotUnlocked(id, levels, passport, unlockAll));
}

/** The level to finish to open `level` (the previous one by order), for "Hoàn thành Màn X để mở". */
export function requiredLevel(level: Pick<Level, "id">, levels: Level[]): Level | undefined {
  const sorted = levels.slice().sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((l) => l.id === level.id);
  return index > 0 ? sorted[index - 1] : undefined;
}

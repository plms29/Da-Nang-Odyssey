import type { PassportState } from "@/lib/passport/logic";
import type { Level } from "@/lib/types";

// Chain unlock (plan giai đoạn E): a level with `unlock` opens once level `after` has >= `min_stars`.
// Pure functions only; UI reads the passport after hydration and passes it in.

type LevelProgress = Pick<PassportState, "levels">;

export const DEMO_UNLOCK_PARAM = "mo-khoa";
export const DEMO_UNLOCK_VALUE = "tat-ca";

/** `?mo-khoa=tat-ca` opens every level for this page view; nothing is written to the passport. */
export function demoUnlockAll(search: string): boolean {
  return new URLSearchParams(search).get(DEMO_UNLOCK_PARAM)?.trim() === DEMO_UNLOCK_VALUE;
}

export function isLevelUnlocked(
  level: Pick<Level, "unlock">,
  passport: LevelProgress,
  unlockAll = false,
): boolean {
  if (unlockAll || !level.unlock) return true;
  const stars = passport.levels[level.unlock.after]?.stars ?? 0;
  return stars >= level.unlock.min_stars;
}

export function unlockedLevelIds(
  levels: Level[],
  passport: LevelProgress,
  unlockAll = false,
): string[] {
  return levels.filter((l) => isLevelUnlocked(l, passport, unlockAll)).map((l) => l.id);
}

/** Levels that were locked in `before` and are open in `after` (e.g. right after recordLevel). */
export function newlyUnlocked(
  levels: Level[],
  before: LevelProgress,
  after: LevelProgress,
): Level[] {
  return levels.filter((l) => !isLevelUnlocked(l, before) && isLevelUnlocked(l, after));
}

/** A spot is open if any level that uses it is open. Spots used by no level (tour-only) are open. */
export function isSpotUnlocked(
  spotId: string,
  levels: Level[],
  passport: LevelProgress,
  unlockAll = false,
): boolean {
  const owners = levels.filter((l) => l.spot_ids.includes(spotId));
  return owners.length === 0 || owners.some((l) => isLevelUnlocked(l, passport, unlockAll));
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

/** The level that must be played to open `level`, for "Hoàn thành Màn X để mở". */
export function requiredLevel(level: Pick<Level, "unlock">, levels: Level[]): Level | undefined {
  return level.unlock ? levels.find((l) => l.id === level.unlock?.after) : undefined;
}

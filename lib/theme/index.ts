import { unlockedLevelIds } from "@/lib/level/unlock";
import type { PassportState } from "@/lib/passport/logic";
import { sceneIdForLevel, type SceneId } from "@/lib/scene";
import { pagesFound } from "@/lib/story";
import type { Level } from "@/lib/types";

type LevelProgress = Pick<PassportState, "levels">;

/** App looks the player may pick: "home" plus the world of every open level, in campaign order. */
export function availableThemes(levels: Level[], passport: LevelProgress): SceneId[] {
  const open = new Set(unlockedLevelIds(levels, passport));
  const worlds = levels
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((l) => open.has(l.id))
    .map((l) => sceneIdForLevel(l));
  return [...new Set<SceneId>(["home", ...worlds])];
}

// shortcut: placeholder titles, the content team picks the final wording.
const TITLES = [
  { min: 0, title: "[Lữ khách mới]" },
  { min: 1, title: "[Người nhặt trang sổ]" },
  { min: 3, title: "[Người kể chuyện sông Hàn]" },
  { min: 6, title: "[Người giữ sổ tay sông Hàn]" },
] as const;

/** Title by notebook pages found (levels finished), plus how many pages to the next title. */
export function playerTitle(
  levels: Level[],
  passport: LevelProgress,
): { title: string; pages: number; nextAt: number | null } {
  const pages = pagesFound(levels, passport.levels);
  const current = [...TITLES].reverse().find((t) => pages >= t.min) ?? TITLES[0];
  const next = TITLES.find((t) => t.min > pages);
  return { title: current.title, pages, nextAt: next ? next.min : null };
}

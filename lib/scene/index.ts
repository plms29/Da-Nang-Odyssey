import { getSpot } from "@/lib/content";
import type { Level } from "@/lib/types";
import { kits } from "./kits";
import type { SceneId, SceneKit } from "./types";

export type * from "./types";

const FALLBACK: SceneKit = {
  id: "home",
  sky: "linear-gradient(180deg, #F6EFE4 0%, #E8D8BF 100%)",
  layers: [],
  ambient: [],
  transition: "river-wipe",
  celebrate: "gold-burst",
  ink: "dark",
  accent: "#1F4E6B",
};

/** Kit của scene; id chưa có kit thì trả kit "home". */
export function getSceneKit(id: SceneId): SceneKit {
  return kits[id] ?? kits.home ?? FALLBACK;
}

/** Thế giới của một điểm = theme của điểm; id lạ thì "home". */
export function sceneIdForSpot(spotId: string): SceneId {
  return getSpot(spotId)?.theme ?? "home";
}

/** Theme của spot đầu tiên trong level; không tìm thấy thì "home". */
export function sceneIdForLevel(level: Pick<Level, "spot_ids">): SceneId {
  return level.spot_ids[0] ? sceneIdForSpot(level.spot_ids[0]) : "home";
}

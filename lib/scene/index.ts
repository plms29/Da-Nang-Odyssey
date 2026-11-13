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
};

/** Kit của scene; id chưa có kit thì trả kit "home". */
export function getSceneKit(id: SceneId): SceneKit {
  return kits[id] ?? kits.home ?? FALLBACK;
}

/** Theme của spot đầu tiên trong level; không tìm thấy thì "home". */
export function sceneIdForLevel(level: Pick<Level, "spot_ids">): SceneId {
  const spot = level.spot_ids[0] ? getSpot(level.spot_ids[0]) : undefined;
  return spot?.theme ?? "home";
}

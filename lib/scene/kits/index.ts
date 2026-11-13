import type { SceneId, SceneKit } from "../types";
import { diSanCham } from "./di-san-cham";
import { home } from "./home";
import { lichSuGiuThanh } from "./lich-su-giu-thanh";
import { ngheThuatDanGian } from "./nghe-thuat-dan-gian";

export const kits: Partial<Record<SceneId, SceneKit>> = {
  home,
  "di-san-cham": diSanCham,
  "lich-su-giu-thanh": lichSuGiuThanh,
  "nghe-thuat-dan-gian": ngheThuatDanGian,
};

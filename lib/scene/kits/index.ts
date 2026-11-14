import type { SceneId, SceneKit } from "../types";
import { amThuc } from "./am-thuc";
import { diSanCham } from "./di-san-cham";
import { doThiSongLeHoi } from "./do-thi-song-le-hoi";
import { home } from "./home";
import { langNghe } from "./lang-nghe";
import { lichSuGiuThanh } from "./lich-su-giu-thanh";
import { ngheThuatDanGian } from "./nghe-thuat-dan-gian";

export const kits: Partial<Record<SceneId, SceneKit>> = {
  home,
  "di-san-cham": diSanCham,
  "lich-su-giu-thanh": lichSuGiuThanh,
  "nghe-thuat-dan-gian": ngheThuatDanGian,
  "lang-nghe": langNghe,
  "am-thuc": amThuc,
  "do-thi-song-le-hoi": doThiSongLeHoi,
};

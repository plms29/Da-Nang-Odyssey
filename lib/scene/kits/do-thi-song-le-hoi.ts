import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "do-thi-song-le-hoi";

// Các lớp AI sẽ được bổ sung sau khi có tranh.
const layers: SceneLayer[] = [];

export const doThiSongLeHoi: SceneKit = {
  id,
  sky: "linear-gradient(180deg, #1B1440 0%, #3B2A6B 45%, #6B3FA0 75%, #C99A2E 100%)",
  layers,
  ambient: ["fireworks", "waves"],
  transition: "river-wipe",
  celebrate: "fireworks",
  ink: "light",
  accent: "#6B3FA0",
};

export default doThiSongLeHoi;

import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "do-thi-song-le-hoi";

const layers: SceneLayer[] = [
  {
    src: "/scenes/home/ai-son-tra.webp",
    depth: 0.1,
    className: "bottom-[36%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/home/ai-thanh-pho.webp",
    depth: 0.35,
    className: "bottom-[18%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/home/ai-bo-song.webp",
    depth: 1,
    className: "bottom-0 left-0 w-full h-auto",
  },
];

export const doThiSongLeHoi: SceneKit = {
  id,
  sky: "linear-gradient(180deg, rgba(16, 18, 46, 0.78) 0%, rgba(36, 29, 74, 0.68) 50%, rgba(56, 39, 94, 0.58) 100%), url(/scenes/home/ai-sky.webp) center / cover no-repeat, linear-gradient(180deg, #0E122B 0%, #241D4A 55%, #3B2863 100%)",
  layers,
  ambient: ["fireworks", "waves"],
  transition: "river-wipe",
  celebrate: "fireworks",
  ink: "light",
};

export default doThiSongLeHoi;

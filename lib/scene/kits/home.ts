import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "home";

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
    src: "/scenes/home/thuyen.svg",
    depth: 0.7,
    className: "bottom-[12%] left-[10%] w-[28%] h-auto",
    animate: "waves",
  },
  {
    src: "/scenes/home/ai-bo-song.webp",
    depth: 1,
    className: "bottom-0 left-0 w-full h-auto",
  },
];

export const home: SceneKit = {
  id,
  sky: "url(/scenes/home/ai-sky.webp) center / cover no-repeat, linear-gradient(180deg, #F6EFE4 0%, #EBD29B 45%, #C99A2E 75%, #C87A55 100%)",
  layers,
  ambient: ["waves", "drift", "fireworks"],
  transition: "river-wipe",
  celebrate: "fireworks",
  ink: "dark",
};

export default home;

import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "home";

const layers: SceneLayer[] = [
  {
    src: "/scenes/home/son-tra.svg",
    depth: 0,
    className: "bottom-[40%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/home/nha-ven-song.svg",
    depth: 0.2,
    className: "bottom-[30%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/home/cau-rong.svg",
    depth: 0.4,
    className: "bottom-[22%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/home/thuyen.svg",
    depth: 0.6,
    className: "bottom-[12%] left-[10%] w-[28%] h-auto",
    animate: "waves",
  },
  {
    src: "/scenes/home/bo-song.svg",
    depth: 1,
    className: "bottom-0 left-0 w-full h-auto",
  },
];

export const home: SceneKit = {
  id,
  sky: "linear-gradient(180deg, #F6EFE4 0%, #EBD29B 45%, #C99A2E 75%, #C87A55 100%)",
  layers,
  ambient: ["waves", "drift", "fireworks"],
  transition: "river-wipe",
  celebrate: "fireworks",
  ink: "dark",
};

export default home;

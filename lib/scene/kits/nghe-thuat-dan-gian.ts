import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "nghe-thuat-dan-gian";

const layers: SceneLayer[] = [
  {
    src: "/scenes/nghe-thuat-dan-gian/day-choi.svg",
    depth: 0.2,
    className: "bottom-[28%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/san-choi.svg",
    depth: 0.5,
    className: "bottom-[10%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/den-long-1.svg",
    depth: 0.6,
    className: "top-[4%] left-[12%] w-[22%] h-auto",
    animate: "sway",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/den-long-2.svg",
    depth: 0.6,
    className: "top-[8%] right-[14%] w-[18%] h-auto",
    animate: "sway",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/trong.svg",
    depth: 0.8,
    className: "bottom-[14%] left-[8%] w-[24%] h-auto",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/tre.svg",
    depth: 1,
    className: "bottom-0 right-0 w-[45%] h-auto",
  },
];

export const ngheThuatDanGian: SceneKit = {
  id,
  sky: "linear-gradient(180deg, #1F1A17 0%, #172A3A 50%, #1F4E6B 100%)",
  layers,
  ambient: ["fireflies", "sway"],
  transition: "card-flip",
  celebrate: "drum-confetti",
  ink: "light",
};

export default ngheThuatDanGian;

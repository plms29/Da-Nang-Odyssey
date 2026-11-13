import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "nghe-thuat-dan-gian";

const layers: SceneLayer[] = [
  {
    src: "/scenes/nghe-thuat-dan-gian/lang-cay.svg",
    depth: 0.08,
    className: "bottom-[40%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/ai-day-choi.webp",
    depth: 0.3,
    className: "bottom-[30%] left-[3%] w-[94%] h-auto",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/ai-san.webp",
    depth: 0.55,
    className: "bottom-0 left-0 w-full h-auto",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/ai-den-long.webp",
    depth: 0.65,
    className: "top-[2%] left-[8%] w-[13%] h-auto",
    animate: "sway",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/ai-trong.webp",
    depth: 0.75,
    className: "bottom-[6%] left-[4%] w-[26%] h-auto",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/ai-den-long.webp",
    depth: 0.85,
    className: "top-[0%] right-[10%] w-[16%] h-auto",
    animate: "sway",
  },
  {
    src: "/scenes/nghe-thuat-dan-gian/tre.svg",
    depth: 1,
    className: "bottom-0 right-0 w-[44%] h-auto",
  },
];

export const ngheThuatDanGian: SceneKit = {
  id,
  sky: "url(/scenes/nghe-thuat-dan-gian/ai-sky.webp) center / cover no-repeat, linear-gradient(180deg, #1F1A17 0%, #172A3A 50%, #1F4E6B 100%)",
  layers,
  ambient: ["fireflies", "sway"],
  transition: "card-flip",
  celebrate: "drum-confetti",
  ink: "light",
};

export default ngheThuatDanGian;

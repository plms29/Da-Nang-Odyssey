import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "di-san-cham";

const layers: SceneLayer[] = [
  {
    src: "/scenes/di-san-cham/ai-doi-xa.webp",
    depth: 0.1,
    className: "bottom-[34%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/di-san-cham/ai-thap.webp",
    depth: 0.45,
    className: "bottom-[20%] left-[6%] w-[88%] h-auto",
  },
  {
    src: "/scenes/di-san-cham/khoi-huong.svg",
    depth: 0.5,
    className: "bottom-[22%] left-[44%] w-[16%] h-auto",
    animate: "smoke",
  },
  {
    src: "/scenes/di-san-cham/ai-be-tho.webp",
    depth: 0.7,
    className: "bottom-[6%] left-[4%] w-[92%] h-auto",
  },
  {
    src: "/scenes/di-san-cham/ai-hoa-sen.webp",
    depth: 1,
    className: "bottom-0 left-0 w-full h-auto",
  },
];

export const diSanCham: SceneKit = {
  id,
  photo: "/background/cham.jpeg",
  subtitle: "Di sản điêu khắc và kiến trúc Chăm Pa",
  sky: "url(/scenes/di-san-cham/ai-sky.webp) center / cover no-repeat, linear-gradient(180deg, #2B1D28 0%, #5E2B27 35%, #A84825 70%, #C99A2E 100%)",
  layers,
  ambient: ["dust", "smoke"],
  transition: "dust-sweep",
  celebrate: "gold-burst",
  ink: "light",
  accent: "#B5532F",
};

export default diSanCham;

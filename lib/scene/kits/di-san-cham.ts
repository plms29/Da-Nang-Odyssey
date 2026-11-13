import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "di-san-cham";

const layers: SceneLayer[] = [
  {
    src: "/scenes/di-san-cham/doi-xa.svg",
    depth: 0,
    className: "bottom-[35%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/di-san-cham/thap.svg",
    depth: 0.4,
    className: "bottom-[22%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/di-san-cham/khoi-huong.svg",
    depth: 0.5,
    className: "bottom-[30%] left-[20%] w-[30%] h-auto",
    animate: "smoke",
  },
  {
    src: "/scenes/di-san-cham/be-tho.svg",
    depth: 0.7,
    className: "bottom-[6%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/di-san-cham/hoa-sen.svg",
    depth: 1,
    className: "bottom-0 left-0 w-full h-auto",
  },
];

export const diSanCham: SceneKit = {
  id,
  sky: "linear-gradient(180deg, #2B1D28 0%, #5E2B27 35%, #A84825 70%, #C99A2E 100%)",
  layers,
  ambient: ["dust", "smoke"],
  transition: "dust-sweep",
  celebrate: "gold-burst",
  ink: "light",
};

export default diSanCham;

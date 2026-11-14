import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "am-thuc";

const layers: SceneLayer[] = [
  {
    src: "/scenes/am-thuc/mai-cho.svg",
    depth: 0.15,
    className: "bottom-[34%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/am-thuc/quay-mi.svg",
    depth: 0.45,
    className: "bottom-[14%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/am-thuc/khoi-noi.svg",
    depth: 0.55,
    className: "bottom-[34%] left-[36%] w-[18%] h-auto",
    animate: "smoke",
  },
  {
    src: "/scenes/am-thuc/den-long.svg",
    depth: 0.65,
    className: "top-[2%] left-[6%] w-[12%] h-auto",
    animate: "sway",
  },
  {
    src: "/scenes/am-thuc/den-long.svg",
    depth: 0.72,
    className: "top-0 right-[8%] w-[14%] h-auto",
    animate: "sway",
  },
  {
    src: "/scenes/am-thuc/to-mi-quang.svg",
    depth: 1,
    className: "bottom-0 left-0 w-full h-auto",
  },
];

export const amThuc: SceneKit = {
  id,
  sky: "linear-gradient(180deg, #FDF6E7 0%, #F7E1B5 48%, #E7BA78 82%, #D49552 100%)",
  layers,
  ambient: ["smoke", "sway"],
  transition: "smoke-cover",
  celebrate: "gold-burst",
  ink: "dark",
};

export default amThuc;

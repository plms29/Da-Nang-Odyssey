import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "lang-nghe";

const layers: SceneLayer[] = [
  {
    src: "/scenes/lang-nghe/nui-da-voi.svg",
    depth: 0.1,
    className: "bottom-[34%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/lang-nghe/mai-xuong.svg",
    depth: 0.4,
    className: "bottom-[16%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/lang-nghe/tuong-da.svg",
    depth: 0.75,
    className: "bottom-0 left-0 w-full h-auto",
  },
  {
    src: "/scenes/lang-nghe/bui-da.svg",
    depth: 0.95,
    className: "bottom-[4%] left-0 w-full h-auto",
  },
];

export const langNghe: SceneKit = {
  id,
  sky: "linear-gradient(180deg, #FBF2DD 0%, #F2D399 42%, #DDA45B 76%, #B8743B 100%)",
  layers,
  ambient: ["dust"],
  transition: "dust-sweep",
  celebrate: "gold-burst",
  ink: "dark",
};

export default langNghe;

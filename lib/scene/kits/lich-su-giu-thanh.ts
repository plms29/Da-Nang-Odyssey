import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "lich-su-giu-thanh";

const layers: SceneLayer[] = [
  {
    src: "/scenes/lich-su-giu-thanh/dat-co.svg",
    depth: 0,
    className: "inset-0 h-full w-full",
  },
  {
    src: "/scenes/lich-su-giu-thanh/song-han.svg",
    depth: 0.18,
    className: "top-[4%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/lich-su-giu-thanh/hao-nuoc.svg",
    depth: 0.36,
    className: "top-[24%] left-[7%] w-[86%] h-auto",
  },
  {
    src: "/scenes/lich-su-giu-thanh/thanh-dien-hai.svg",
    depth: 0.5,
    className: "top-[24%] left-[7%] w-[86%] h-auto",
  },
  {
    src: "/scenes/lich-su-giu-thanh/co-trang.svg",
    depth: 0.58,
    className: "top-[31%] left-[47%] w-[16%] h-auto",
    animate: "flag",
  },
  {
    src: "/scenes/lich-su-giu-thanh/tau-buom.svg",
    depth: 0.68,
    className: "top-[10%] right-[10%] w-[28%] h-auto",
    animate: "waves",
  },
  {
    src: "/scenes/lich-su-giu-thanh/dai-bao.svg",
    depth: 1,
    className: "bottom-[2%] left-[2%] w-[34%] h-auto",
  },
];

export const lichSuGiuThanh: SceneKit = {
  id,
  sky: "linear-gradient(180deg, #F6EFE4 0%, #DCE3C8 55%, #B8C69B 100%)",
  layers,
  ambient: ["drift", "waves", "smoke"],
  transition: "smoke-cover",
  celebrate: "flag-raise",
  ink: "dark",
};

export default lichSuGiuThanh;

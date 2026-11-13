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
    depth: 0.2,
    className: "top-0 right-0 h-full w-[45%]",
  },
  {
    src: "/scenes/lich-su-giu-thanh/thanh-dien-hai.svg",
    depth: 0.5,
    className: "top-[18%] left-[10%] w-[80%] h-auto",
  },
  {
    src: "/scenes/lich-su-giu-thanh/co-trang.svg",
    depth: 0.6,
    className: "top-[20%] left-[42%] w-[14%] h-auto",
    animate: "flag",
  },
  {
    src: "/scenes/lich-su-giu-thanh/tau-buom.svg",
    depth: 0.7,
    className: "top-[55%] right-[8%] w-[26%] h-auto",
    animate: "waves",
  },
  {
    src: "/scenes/lich-su-giu-thanh/dai-bao.svg",
    depth: 1,
    className: "bottom-[4%] left-[2%] w-[30%] h-auto",
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

import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "lich-su-giu-thanh";

const layers: SceneLayer[] = [
  {
    src: "/scenes/lich-su-giu-thanh/ai-map.webp",
    depth: 0,
    // 150% of the 100dvh box covers the 130% world plus the 15% depth-0 scroll offset, so no empty sky shows at the top
    className: "bottom-0 left-0 h-[150%] w-full object-cover",
  },
  {
    src: "/scenes/lich-su-giu-thanh/ai-co.webp",
    depth: 0.58,
    className: "top-[38%] left-[46%] w-[16%] h-auto",
    animate: "flag",
  },
  {
    src: "/scenes/lich-su-giu-thanh/ai-dai-bao.webp",
    depth: 1,
    className: "bottom-0 left-0 w-[46%] h-auto",
  },
];

export const lichSuGiuThanh: SceneKit = {
  id,
  sky: "url(/scenes/lich-su-giu-thanh/ai-map.webp) center / cover no-repeat, linear-gradient(180deg, #F6EFE4 0%, #DCE3C8 55%, #B8C69B 100%)",
  layers,
  ambient: ["drift", "waves", "smoke"],
  transition: "smoke-cover",
  celebrate: "flag-raise",
  ink: "dark",
  accent: "#8A3324",
};

export default lichSuGiuThanh;

import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "lang-nghe";

const layers: SceneLayer[] = [
  {
    src: "/scenes/lang-nghe/ai-nui-da.webp",
    depth: 0.12,
    className: "bottom-[34%] left-0 w-full h-auto",
  },
  {
    src: "/scenes/lang-nghe/ai-xuong-da.webp",
    depth: 0.45,
    className: "bottom-[10%] left-[4%] w-[92%] h-auto",
  },
  {
    src: "/scenes/lang-nghe/ai-chum-mam.webp",
    depth: 1,
    className: "bottom-0 left-0 w-full h-auto",
  },
];

export const langNghe: SceneKit = {
  id,
  sky: "url(/scenes/lang-nghe/ai-sky.webp) center / cover no-repeat, linear-gradient(180deg, #CFE3EE 0%, #F6EFE4 60%, #EBD29B 100%)",
  layers,
  ambient: ["dust", "drift"],
  transition: "dust-sweep",
  celebrate: "gold-burst",
  ink: "dark",
  accent: "#2F6F6A",
};

export default langNghe;

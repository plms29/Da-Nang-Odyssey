import type { SceneId, SceneKit, SceneLayer } from "../types";

const id: SceneId = "am-thuc";

// Hai lớp gánh hàng và tô mì sẽ được bổ sung sau khi có tranh.
const layers: SceneLayer[] = [
  {
    src: "/scenes/am-thuc/ai-pho-cho.webp",
    depth: 0.4,
    className: "bottom-0 left-0 w-full h-auto",
  },
];

export const amThuc: SceneKit = {
  id,
  sky: "url(/scenes/am-thuc/ai-sky.webp) center / cover no-repeat, linear-gradient(180deg, #BFDDF0 0%, #F6EFE4 55%, #F2C46B 100%)",
  layers,
  ambient: ["smoke", "drift"],
  transition: "smoke-cover",
  celebrate: "gold-burst",
  ink: "dark",
  accent: "#C2571A",
};

export default amThuc;

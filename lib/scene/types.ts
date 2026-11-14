import type { Theme } from "@/lib/types";

// Giao kèo scene kit (cập nhật hỗ trợ ảnh nền thực tế và minimalist UI).

export type SceneId = Theme | "home";

export type AmbientKind =
  | "dust" // bụi vàng bay trong nắng (canvas)
  | "smoke" // khói hương / khói pháo bốc lên (CSS)
  | "flow" // nước chảy dọc, thác (CSS gradient)
  | "waves" // sóng ngang, sông (SVG)
  | "sway" // lắc lư quanh điểm treo: đèn lồng, thuyền (CSS)
  | "flag" // cờ bay (CSS skew)
  | "drift" // mây / bóng mây trôi ngang (CSS)
  | "fireflies" // đốm sáng nhấp nháy ban đêm (canvas)
  | "fireworks"; // pháo hoa (canvas)

export type TransitionKind = "dust-sweep" | "smoke-cover" | "card-flip" | "river-wipe";
export type CelebrateKind = "gold-burst" | "flag-raise" | "drum-confetti" | "fireworks";

export interface SceneLayer {
  /** Đường dẫn ảnh trong /public. */
  src: string;
  /** 0 = xa nhất, 1 = gần nhất. */
  depth: number;
  /** Vị trí/kích thước Tailwind trong khung cảnh. */
  className: string;
  /** Lớp tự chuyển động (nếu có). */
  animate?: AmbientKind;
}

export interface SceneKit {
  id: SceneId;
  /** CSS background dự phòng của bầu trời / nền. */
  sky: string;
  /** Ảnh nền chính của chủ đề (từ /background/...). */
  photo?: string;
  /** Chú thích ngắn cho cảnh. */
  subtitle?: string;
  /** Xếp từ xa đến gần. */
  layers: SceneLayer[];
  /** Hiệu ứng phủ toàn cảnh (tối giản mặc định rỗng). */
  ambient: AmbientKind[];
  transition: TransitionKind;
  celebrate: CelebrateKind;
  /** Màu chữ đặt trực tiếp trên cảnh. */
  ink: "light" | "dark";
}

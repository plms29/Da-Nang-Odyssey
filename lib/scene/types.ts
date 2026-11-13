import type { Theme } from "@/lib/types";

// Giao kèo giai đoạn C (plan-ui-dong.md mục 2). Worker không được sửa file này.

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
  /** Đường dẫn trong /public, ví dụ "/scenes/di-san-cham/thap.svg". */
  src: string;
  /** 0 = xa nhất (trôi chậm), 1 = gần nhất (trôi nhanh). */
  depth: number;
  /** Vị trí/kích thước Tailwind trong khung cảnh, ví dụ "bottom-0 left-0 w-full". */
  className: string;
  /** Lớp tự chuyển động (đèn lồng "sway", cờ "flag"). */
  animate?: AmbientKind;
}

export interface SceneKit {
  id: SceneId;
  /** CSS background của bầu trời / nền. */
  sky: string;
  /** Xếp từ xa đến gần. */
  layers: SceneLayer[];
  /** Hiệu ứng phủ toàn cảnh. */
  ambient: AmbientKind[];
  transition: TransitionKind;
  celebrate: CelebrateKind;
  /** Màu chữ đặt trực tiếp trên cảnh. */
  ink: "light" | "dark";
}

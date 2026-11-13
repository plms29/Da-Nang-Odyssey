# Plan: Giai đoạn C — UI động theo chủ đề

Nguồn ý tưởng: 4 video trong `UI video/`, phân tích kỹ ở `NGHIEN-CUU-UI-DONG.md` (nên đọc trước).
Mục tiêu: mọi màn hình có hình ảnh động gắn với chủ đề văn hoá đang chơi (Chăm, Giữ thành, Bài chòi…),
theo kiểu tranh nhiều lớp + chuyển động nền nhẹ + chuyển cảnh có ý nghĩa. Mobile-first, khung 480px.

## 0. Đọc trước khi làm

- Stack hiện có: Next.js 15 App Router, React 19, TypeScript, Tailwind v4, Zustand, Vitest. Token màu ở `app/globals.css`
  (`sand`, `terracotta`, `river`, `gold`, `ink`, `muted`).
- **Không sửa** `lib/types.ts`, `lib/level/engine.ts`, `lib/activities/*`, `lib/passport/*`, `app/api/**`. UI động chỉ là lớp trình bày.
- **Chờ đợt B1 xong** (photobooth / check-in đang làm dở trong `plan.md`) rồi mới đụng `components/checkin/*` và `components/photobooth/*`.
- Mỗi task chỉ sửa file trong cột "File sở hữu". Cần sửa file của task khác thì báo lại, không tự sửa.
- Mỗi task xong phải chạy: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`. Thử trên Chrome DevTools khung 375×812.

## 1. Quyết định kỹ thuật (đã chốt, không đổi)

| Việc | Chọn | Không dùng |
|---|---|---|
| Chuyển động lặp (nước, sóng, lắc lư, bụi, nền trôi) | CSS `@keyframes` trong `app/fx.css` | — |
| Parallax, chuyển phase, animation theo cuộn | thư viện `motion` (tên mới của Framer Motion), import từ `motion/react` | GSAP (không thêm thư viện thứ hai) |
| Hạt (bụi vàng, đom đóm, pháo giấy) | 1 canvas 2D tự viết, tối đa 60 hạt | tsParticles, Three.js |
| Đốm sáng, đường cong phát sáng | SVG + `filter: blur` + `mix-blend-mode: screen` | Three.js / R3F / postprocessing |
| Nhân vật động | Để sau | Lottie, Rive |

Ngân sách hiệu năng (bắt buộc, U13 sẽ đo):
- JS thêm vào không quá **50KB gzip** cho toàn bộ giai đoạn C.
- Tranh mỗi bộ cảnh tổng **≤ 500KB** (WebP/AVIF). Ảnh hero dùng `next/image` với `priority`.
- Chỉ animate `transform`, `opacity`, `filter`, `background-position`. Không animate `width`, `height`, `top`, `left`.
- Dừng animation khi khối ra khỏi màn hình (IntersectionObserver đặt `data-paused`, CSS `animation-play-state: paused`) và khi tab ẩn.
- **`prefers-reduced-motion: reduce`**: tắt mọi chuyển động lặp, parallax, scramble, glitch. Chỉ còn fade ≤ 200ms. Nội dung vẫn đủ.
- Lớp trang trí luôn có `aria-hidden="true"` và `pointer-events: none`. Chữ thật không bao giờ chỉ nằm trong canvas hoặc ảnh.

## 2. Giao kèo dùng chung (U0 tạo, các task khác KHÔNG được sửa)

### `lib/scene/types.ts`
```ts
import type { Theme } from "@/lib/types";

export type SceneId = Theme | "home";

export type AmbientKind =
  | "dust"      // bụi vàng bay trong nắng (canvas)
  | "smoke"     // khói hương / khói pháo bốc lên (CSS)
  | "flow"      // nước chảy dọc, thác (CSS gradient)
  | "waves"     // sóng ngang, sông (SVG)
  | "sway"      // lắc lư quanh điểm treo: đèn lồng, thuyền (CSS)
  | "flag"      // cờ bay (CSS skew)
  | "drift"     // mây / bóng mây trôi ngang (CSS)
  | "fireflies" // đốm sáng nhấp nháy ban đêm (canvas)
  | "fireworks";// pháo hoa (canvas)

export type TransitionKind = "dust-sweep" | "smoke-cover" | "card-flip" | "river-wipe";
export type CelebrateKind = "gold-burst" | "flag-raise" | "drum-confetti" | "fireworks";

export interface SceneLayer {
  src: string;          // đường dẫn trong /public, ví dụ "/scenes/di-san-cham/thap.webp"
  depth: number;        // 0 = xa nhất (trôi chậm), 1 = gần nhất (trôi nhanh)
  className: string;    // vị trí/kích thước Tailwind, ví dụ "bottom-0 left-0 w-full"
  animate?: AmbientKind;// lớp tự chuyển động (đèn lồng "sway", cờ "flag")
}

export interface SceneKit {
  id: SceneId;
  sky: string;               // CSS gradient của bầu trời / nền
  layers: SceneLayer[];      // xếp từ xa đến gần
  ambient: AmbientKind[];    // hiệu ứng phủ toàn cảnh
  transition: TransitionKind;
  celebrate: CelebrateKind;
  ink: "light" | "dark";     // màu chữ đặt trên cảnh
}
```

### `lib/scene/index.ts`
```ts
export function getSceneKit(id: SceneId): SceneKit;          // id lạ thì trả kit "home"
export function sceneIdForLevel(level: Level): SceneId;       // theme của spot đầu tiên trong level.spot_ids
```

### Chữ ký component (`components/fx/*`). Task làm component phải giữ đúng props này
```ts
<Ambient kind={AmbientKind} intensity?: "full" | "calm" className?: string />
<SceneBackdrop kit={SceneKit} intensity?: "full" | "calm" />                // cảnh tĩnh + ambient, phủ kín cha
<ParallaxScene kit={SceneKit} panels={ReactNode[]} cta={ReactNode} />       // cảnh cuộn camera, intro màn
<PhaseTransition kind={TransitionKind} play={boolean} onCovered={() => void} onDone={() => void} />
<Celebrate kind={CelebrateKind} play={boolean} />                            // 1 lần, khoảng 2s
<TextReveal mode="fade-up" | "blur" | "scramble" | "glitch" delay?: number as?: "h1"|"h2"|"p"|"span">{string}</TextReveal>
<StampPress play={boolean}>{ReactNode}</StampPress>                          // hiệu ứng đóng dấu
```

### Thư mục
- `app/fx.css`: toàn bộ `@keyframes` và lớp tiện ích của hiệu ứng, kèm khối `@media (prefers-reduced-motion: reduce)`. U0 import vào `app/layout.tsx`.
- `public/scenes/<scene-id>/*`: tranh. Lúc đầu là SVG giữ chỗ (U5 vẽ), sau thay bằng WebP thật (A1). Chỉ cần đổi `src` trong kit.

## 3. Danh sách task

Cột Worker là gợi ý theo quy trình multi-agent. Nếu người làm tay thì bỏ qua cột này.

### Đợt 1: nền móng

| # | Task | Worker | File sở hữu | Phụ thuộc |
|---|---|---|---|---|
| U0 | Cài `motion`. Tạo `lib/scene/types.ts`, `lib/scene/index.ts` (kit rỗng cho 4 scene, dùng màu token), `app/fx.css` (biến thời lượng, easing, khối reduced-motion), import fx.css vào layout. Hook `useInView` dùng chung để dừng animation ngoài màn hình. Test cho `sceneIdForLevel` và `getSceneKit` | **Phiên chính** (giao kèo, sai là kéo sai cả đội) | `package.json`, `lib/scene/types.ts`, `lib/scene/index.ts`, `lib/scene/index.test.ts`, `app/fx.css`, `app/layout.tsx`, `components/fx/useInView.ts` | — |

### Đợt 2: bộ hiệu ứng (song song)

| # | Task | Worker | File sở hữu | Phụ thuộc |
|---|---|---|---|---|
| U1 | `Ambient` đủ 9 kiểu. CSS: smoke, flow, waves, sway, flag, drift. Canvas 2D: dust, fireflies, fireworks (một component `ParticleCanvas` dùng chung, `requestAnimationFrame`, tự dừng khi ngoài màn hình hoặc tab ẩn, theo devicePixelRatio, tối đa 60 hạt). `intensity="calm"` thì giảm tốc độ và số hạt khoảng 60%, độ mờ 50% | `ui-argon` | `components/fx/Ambient.tsx`, `components/fx/ParticleCanvas.tsx`, `components/fx/ambient/*` (keyframes ghi thêm vào cuối `app/fx.css` trong khối `/* U1 */`) | U0 |
| U2 | `TextReveal` 4 chế độ. fade-up và blur dùng `motion` `whileInView`, chạy một lần. scramble: đổi dần ký tự trong khoảng 0,8s, bộ ký tự gồm chữ tiếng Việt có dấu; thẻ thật mang `aria-label` đủ câu, các span chạy hiệu ứng `aria-hidden`. glitch: 2 pseudo-element lệch màu terracotta/river, `clip-path` nhảy bước trong 0,4s, chỉ dùng cho tiêu đề ≤ 30 ký tự. Reduced motion: hiện thẳng chữ | `ui-hydrogen` | `components/fx/TextReveal.tsx` (keyframes vào khối `/* U2 */` của `app/fx.css`) | U0 |
| U3 | `SceneBackdrop` và `ParallaxScene`. ParallaxScene: khối cao `(panels.length + 1) × 100dvh`, bên trong có khung `sticky` cao 100dvh chứa các lớp tranh; lớp dịch `translateY` theo tiến độ cuộn × `depth` (motion `useScroll` + `useTransform`), camera đi từ trời xuống mặt đất giống video Segesta. Mỗi panel chữ hiện ra ở 1/n quãng đường, nền chữ là kính mờ `bg-sand/80 backdrop-blur`. `cta` hiện ở cuối. Có nút "Bỏ qua" nhảy thẳng tới cta. Reduced motion: hiển thị như SceneBackdrop + các panel xếp dọc | `ui-argon-high` (phần dễ thấy nhất) | `components/fx/SceneBackdrop.tsx`, `components/fx/ParallaxScene.tsx` | U0 |
| U4 | `PhaseTransition` 4 kiểu (overlay `fixed` toàn màn 480px, khoảng 900ms: che dần → gọi `onCovered` → mở dần → `onDone`): dust-sweep (màn bụi vàng quét chéo), smoke-cover (khói xám dâng từ dưới lên), card-flip (một thẻ bài lật 3D `rotateY` che màn hình), river-wipe (sóng nước quét ngang). `Celebrate` 4 kiểu: gold-burst, flag-raise (cờ kéo lên cột), drum-confetti (trống nảy + pháo giấy), fireworks. `StampPress`: con dấu rơi xuống, scale 1.4→1, rung nhẹ, vệt mực loang | `ui-argon` | `components/fx/PhaseTransition.tsx`, `components/fx/Celebrate.tsx`, `components/fx/StampPress.tsx` (keyframes vào khối `/* U4 */`) | U0, dùng `ParticleCanvas` của U1 (nếu U1 chưa xong thì tạm dùng CSS) |
| U5 | Nội dung 4 kit trong `lib/scene/kits/*.ts` + **tranh SVG giữ chỗ** (hình khối đơn giản, đúng bảng màu, đúng bố cục để code chạy được trước khi có tranh thật). Danh sách lớp lấy theo mục 4. Đăng ký kit trong `lib/scene/kits/index.ts` (U0 tạo sẵn file này, export object rỗng theo `SceneId`; `lib/scene/index.ts` chỉ đọc từ đó) | `ui-argon` | `lib/scene/kits/*`, `public/scenes/**` (chỉ `.svg`) | U0 |
| A1 | **Tranh thật** cho 4 kit theo đặc tả ở mục 4. Không phải code. Đội nội dung duyệt độ chính xác văn hoá trước khi đưa vào | **Người làm tranh** (AI tạo ảnh + tách nền) | `public/scenes/**` (`.webp`) | Chạy song song từ đầu |

Ghi chú (đã chỉnh khi build): CSS của U1, U2, U4 nằm ở file riêng `app/fx/ambient.css`, `app/fx/text.css`, `app/fx/transition.css` (fx.css import cả ba), để các worker chạy song song không ghi đè nhau. `app/fx.css` được import từ `app/globals.css`.
Trong worktree `ui-dong`: U10 bỏ qua vì code B1 (check-in) chưa commit; A1 và U12 (tranh thật) chờ người làm tranh, tạm dùng SVG giữ chỗ.

### Đợt 3: đưa hiệu ứng vào từng màn hình (song song)

| # | Màn hình | Task | Worker | File sở hữu | Phụ thuộc |
|---|---|---|---|---|---|
| U6 | Chơi màn `/kham-pha/[levelId]` | `LevelPlayer` lấy kit qua `sceneIdForLevel`. **Intro**: `ParallaxScene`, panel là `level.intro.text` (cắt theo câu), tiêu đề `TextReveal glitch`, cta là nút "Bắt đầu" hiện có. **Station**: `SceneBackdrop intensity="calm"` mờ phía sau, nội dung trạm nằm trên thẻ nền sáng để dễ đọc; thanh tiến độ 3 trạm có vạch chạy. **Chuyển trạm và chuyển phase**: `PhaseTransition` theo kit, đổi state ở `onCovered`. **Reveal**: `Celebrate` theo kit, số sao hiện lần lượt, điểm đếm tăng dần, `StampPress` cho ô "Con dấu hộ chiếu". Không đổi logic reducer, chỉ đổi trình bày | `ui-hydrogen-high` (có state, thứ tự) | `components/level/LevelPlayer.tsx`, `components/level/LevelScene.tsx` (mới) | U1–U5 |
| U7 | Các trạm chơi | Phản hồi đúng/sai: đúng thì thẻ nảy + viền vàng sáng, sai thì rung ngang 300ms. Ghép hình: mảnh ghép trượt vào vị trí (`motion` `layout`), ghép xong thì ảnh lộ ra hết. Xếp thứ tự: các mục đổi chỗ có `layout` animation. Nối cặp: chọn thì sáng lên, nối đúng thì 2 thẻ dịch lại gần rồi khoá. Ghim bản đồ: ghim rơi xuống + sóng tròn lan ra. Thể hiện: lúc chờ `/api/judge` có chữ "Đang chấm…" nhấp nháy; kết quả các tiêu chí hiện lần lượt. Gợi ý: HintBox mở bằng accordion mượt | `ui-hydrogen` | `components/level/stations/*`, `components/level/HintBox.tsx` | U0, U2 |
| U8 | Trang chủ + danh sách màn | Trang chủ: hero cao khoảng 55dvh dùng `SceneBackdrop` kit `home` (cầu Rồng, sông Hàn có sóng, pháo hoa thưa), tên app `TextReveal blur`; các thẻ lối vào xuất hiện so le (stagger 80ms), ấn thì lún xuống nhẹ. `/kham-pha`: mỗi thẻ màn có dải ảnh nhỏ là `SceneBackdrop intensity="calm"` của kit tương ứng, hiện số sao đã đạt (đọc store sau khi hydrate như trang hộ chiếu đang làm), thẻ xuất hiện so le | `ui-argon` | `app/page.tsx`, `app/kham-pha/page.tsx`, `components/shell/EntryCard.tsx`, `components/shell/LevelCard.tsx` (mới) | U1, U3, U5 |
| U9 | Hộ chiếu `/ho-chieu` | Lưới dấu xuất hiện so le. Dấu mới (chưa xem lần nào, lưu cờ "đã xem" trong `sessionStorage`) chạy `StampPress`. Dấu "đã đến" màu vàng có ánh sáng lướt qua (shimmer) mỗi 4s. Tổng điểm đếm tăng dần khi vào trang | `ui-hydrogen` | `components/passport/*`, `app/ho-chieu/page.tsx` | U4 |
| U10 | Check-in `/photobooth` | Lúc lấy vị trí: vòng radar toả ra. Kết quả "còn cách X m": la bàn/mũi tên nảy nhẹ. Trong bán kính: dấu "ĐÃ ĐẾN" bằng `StampPress`. Chỉ thêm lớp trình bày, không đổi luồng hay logic vị trí. **Không sửa** `PhotoBooth.tsx` (chỉ được thêm hiệu ứng flash/đếm ngược nếu B1 đã merge và phiên chính đồng ý) | `ui-hydrogen` | `components/checkin/*` | B1 xong, U4 |
| U11 | Vỏ app | Chuyển trang: `app/template.tsx` fade + trượt lên 12px trong 200ms. BottomNav: chấm chỉ báo trượt sang tab đang chọn (`motion` `layoutId`). PageHeader: tiêu đề `TextReveal fade-up` | `ui-flash` | `app/template.tsx` (mới), `components/shell/BottomNav.tsx`, `components/shell/PageHeader.tsx` | U2 |

### Đợt 4: tranh thật, đo, chốt

| # | Task | Worker | File sở hữu | Phụ thuộc |
|---|---|---|---|---|
| U12 | Thay SVG giữ chỗ bằng WebP của A1, chỉnh `className`/`depth` trong kit cho khớp bố cục tranh thật | `ui-flash` | `lib/scene/kits/*` | A1, U5 |
| U13 | QA: đo trên 1 máy Android tầm trung thật + DevTools CPU chậm 4×, mạng Fast 4G. Kiểm tra ngân sách ở mục 1, bật reduced-motion chạy lại cả luồng, Lighthouse mobile (Performance ≥ 85, Accessibility ≥ 95), không lỗi console. Ghi kết quả vào `BAO-CAO-UI-DONG.md` | **Phiên chính** | `BAO-CAO-UI-DONG.md` | Tất cả |
| U14 | (Sau B2) Hình ảnh cho trình phát Tour 5 phút: bản đồ sông Hàn vẽ tay, con thuyền chạy dọc đường đi giữa các điểm (giống máy bay trong video V3), đến điểm nào thì điểm đó sáng lên. Lên chi tiết khi B2 có trình phát | `ui-argon` | quyết định sau | B2 |

## 4. Đặc tả bộ cảnh và tranh (cho U5 và A1)

Phong cách chung cho mọi tranh. Dùng **cùng một câu mô tả** khi tạo ảnh bằng AI để các cảnh trông như cùng một bộ:

> Flat vector illustration, soft gradients, gentle grain texture, limited palette of warm sand (#F6EFE4), terracotta (#A84825), river blue (#1F4E6B), gold (#C99A2E) and deep ink (#1F1A17), clean shapes, no text, no people faces in detail, Vietnamese cultural setting, mobile game background.

Quy cách file: rộng **960px**. Lớp trên cùng có nền trong suốt. WebP chất lượng khoảng 80. Mỗi lớp ≤ 150KB. Vật nào chuyển động thì tách thành file riêng.
Bầu trời và mặt nước làm bằng CSS, không cần vẽ.

| Kit | Lớp tranh (xa → gần) | Vật tách riêng để chuyển động | Ambient | Chuyển cảnh | Ăn mừng |
|---|---|---|---|---|---|
| `home` (Đà Nẵng, sông Hàn) | núi Sơn Trà mờ xa; dãy nhà ven sông; cầu Rồng; bờ sông tiền cảnh | thuyền nhỏ (`sway`) | waves, fireworks (thưa), drift | river-wipe | fireworks |
| `di-san-cham` (Màn 1 Dấu ấn Chăm) | đồi xa hoàng hôn; cụm tháp Chăm gạch đỏ; bệ thờ/phù điêu sa thạch; hoa sen và lá tiền cảnh | làn khói hương (`smoke`) | dust, smoke | dust-sweep | gold-burst |
| `lich-su-giu-thanh` (Màn 2 Giữ thành) | **nhìn từ trên xuống** như video V3: nền đất cỏ; thành Điện Hải hình ngôi sao; sông Hàn; súng thần công tiền cảnh | tàu buồm trên sông (`sway` + trôi chậm), lá cờ (`flag`) | drift (bóng mây trôi), waves, smoke (khói pháo, thưa) | smoke-cover | flag-raise |
| `nghe-thuat-dan-gian` (Màn 3 Hô bài chòi) | trời đêm (CSS); dãy chòi tre trên sân; mặt sân, chiếu; cây tre tiền cảnh | 2 đèn lồng (`sway`), mặt trước và mặt sau thẻ bài (cho `card-flip`), trống | fireflies, sway | card-flip | drum-confetti |

Ba theme còn lại (`am-thuc`, `lang-nghe`, `do-thi-song-le-hoi`) chưa có màn, **không làm**. Khi có màn mới thì thêm một kit theo đúng mẫu trên, không cần sửa component.

**Duyệt nội dung (bắt buộc trước U12):** hình tháp Chăm, hoa văn, hình dáng thành Điện Hải, kiểu chòi bài chòi phải được đội nội dung xác nhận giống thật. Không được thì vẽ đơn giản hơn chứ không vẽ sai.

## 5. Tiêu chí nghiệm thu chung (reviewer kiểm cho mọi task)

1. Đúng props trong giao kèo ở mục 2, chỉ sửa file mình sở hữu.
2. Bật reduced-motion (DevTools → Rendering → Emulate CSS prefers-reduced-motion) thì không còn chuyển động lặp, mọi nội dung vẫn đọc và bấm được.
3. Lớp trang trí có `aria-hidden` và không chặn bấm. Thứ tự Tab và focus của nút vẫn như cũ.
4. Ở khung 375px không có thanh cuộn ngang. Chữ trên cảnh đạt tương phản 4.5:1 (dùng nền kính mờ nếu cần).
5. DevTools Performance, CPU chậm 4×: khi cảnh đứng yên không có frame dài hơn 50ms. Rời khỏi màn hình thì canvas dừng vẽ.
6. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` đều qua.

Tiêu chí riêng:
- **U3**: cuộn hết intro màn 1 thấy camera đi từ trời xuống chân tháp, 3 panel chữ hiện lần lượt, nút "Bỏ qua" nhảy tới nút "Bắt đầu".
- **U6**: chơi trọn màn 1 không lỗi. Mỗi lần đổi trạm có chuyển cảnh đúng kit; nội dung trạm chỉ đổi khi màn chuyển cảnh đã che kín (không thấy nhấp nháy). Reveal có ăn mừng và dấu, hộ chiếu vẫn được ghi đúng như trước.
- **U7**: kết quả chấm điểm không đổi so với trước (test hiện có vẫn qua).
- **U8 / U9**: không lệch hydrate (không có cảnh báo hydration trong console).

## 6. Thứ tự chạy và review

- Đợt 1 (U0) → Đợt 2 (U1–U5 song song, A1 chạy song song từ đầu) → Đợt 3 (U6–U11 song song; U10 chờ B1) → Đợt 4 (U12, U13).
- `reviewer` kiểm mọi task theo mục 5. Lỗi BLOCKER/SHOULD-FIX trả về đúng worker, tối đa 2 vòng, sau đó báo phiên chính.
- Task fail review 2 lần thì nâng worker một bậc: hydrogen → hydrogen-high → argon → argon-high.

## 7. Ngoài phạm vi

Three.js / 3D thật, Lottie/Rive, âm thanh và nhạc nền, rung điện thoại, hiệu ứng bên trong `PhotoBooth.tsx`, trình phát tour (U14 chờ B2),
kit cho 3 theme chưa có màn, chế độ tối.

# Báo cáo và kế hoạch giai đoạn D: UI hiện đại, hiệu ứng thấy rõ

Ngày 2026-11-13. Nối tiếp giai đoạn C (`plan-ui-dong.md`), nhánh `ui-dong`.

## 1. Tóm tắt

Giai đoạn C đã dựng đủ "khung" chuyển động: cảnh nhiều lớp, intro cuộn, chuyển trạm, ăn mừng, con dấu. Nhưng khi xem thật có 3 vấn đề:

1. **Đang xem nhầm bản.** `localhost:3000` chạy code của thư mục chính (nhánh `main`), không có gì của giai đoạn C. Bản mới nằm trong worktree, nhánh `ui-dong`, chạy ở `localhost:3100`.
2. **Hiệu ứng quá nhẹ.** Bụi bay chậm, đèn lồng lắc ±3°, sóng mờ, nền tĩnh. Trên điện thoại gần như không nhận ra.
3. **Hình ảnh chưa hiện đại.** Tranh vẫn là SVG giữ chỗ phẳng, màu nhạt. Nội dung lại mờ khá lâu lúc mới tải vì hiệu ứng xuất hiện phụ thuộc JavaScript.

Hướng đi giai đoạn D: **"Di sản sống"**. Cảnh có chiều sâu thật và phản ứng theo tay và độ nghiêng điện thoại. Nền là shader ánh sáng chuyển động. UI dùng kính lỏng (liquid glass) như iOS mới. Chữ chuyển động động học. Thẻ nghiêng 3D có vệt sáng. Ăn mừng to và có rung phản hồi. Tranh vẽ lại giàu chi tiết, còn tranh AI thật cần anh/chị duyệt chi phí.

## 2. Nghiên cứu thị trường và hướng dẫn

| Nguồn | Điều rút ra cho app |
|---|---|
| Xu hướng 2026 ([Line25](https://line25.com/articles/web-design-trends-2026/), [Tubik](https://blog.tubikstudio.com/ui-design-trends-2026), [Figma](https://www.figma.com/resource-library/web-design-trends/), [Elementor](https://elementor.com/blog/web-design-trends-2026/)) | Chuyển động phải phục vụ thao tác (phản hồi, dẫn hướng), không phô trương. Đang thịnh hành: kính nhiều lớp (glassmorphism), khối 3D căng phồng với bóng mềm và gradient đậm, scrollytelling, 3D nhập vai. Bắt buộc có phương án giảm chuyển động |
| Apple Liquid Glass trên web ([LogRocket](https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/), [Tuts+](https://webdesign.tutsplus.com/liquid-glass-effect-svg-filters--cms-109200t), [kube.io](https://hn.jakechampion.name/reader/https://kube.io/blog/liquid-glass-css-svg)) | `backdrop-filter` + SVG `feDisplacementMap` tạo khúc xạ. Hiệu ứng khúc xạ chỉ chạy trên Chromium, nên cần `@supports` dự phòng sang blur + saturate. Tốn GPU, nên chỉ dùng cho vài phần tử chính (thanh điều hướng, thẻ chính) |
| Duolingo + Rive ([Duolingo blog](https://blog.duolingo.com/world-character-visemes), [Rive](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life)) | Nhân vật có state machine (idle, nói, vui, buồn) phản ứng theo kết quả. Rất "sống", nhưng runtime Rive nặng khoảng 220–650KB ([Rive runtime sizes](https://rive.app/docs/runtimes/runtime-sizes.md)) và cần họa sĩ rig. **Để giai đoạn sau**, khi có linh vật |
| Lottie vs Rive ([Callstack](https://callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation)) | Lottie nhẹ hơn khi chỉ có vài animation, nhưng cần file từ họa sĩ. Chưa dùng: ăn mừng làm bằng code đủ tốt |
| Shader nền ([Codrops R3F shader background](https://tympanus.net/codrops/2024/10/31/how-to-code-a-subtle-shader-background-effect-with-react-three-fiber/), [ShaderGradient](https://starlog.pages.dev/articles/developer-tools/ruucm-shadergradient), [R3F scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)) | Gradient lưới chuyển động bằng shader là "chữ ký" của các site hiện đại. R3F/three quá nặng cho một nền. Giới hạn DPR ~1.5, dừng khi ra khỏi màn hình, có dự phòng CSS. **Chọn WebGL thuần, không thêm thư viện** |
| 2.5D từ ảnh + depth map ([Practical 3D Photography – Kopf](https://johanneskopf.de/publications/photo3d_practical/Practical_3D_Photography.pdf), [react-depth-parallax](https://www.pkgstats.com/pkg:react-depth-parallax), [Framer Spatial Scene](https://www.framer.com/marketplace/components/spatial-scene/)) | Một ảnh + một bản đồ độ sâu xám, shader dịch UV theo độ sâu, tạo cảm giác 3D khi nghiêng máy. Dùng khi có tranh AI thật (mục 6) |
| Con quay hồi chuyển ([MDN requestPermission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static), [MDN orientation](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation)) | iOS 13+ bắt buộc xin quyền bằng một lần chạm của người dùng, trên HTTPS. Dùng `beta`/`gamma`, có giới hạn góc và làm mượt. Android không cần xin quyền |
| Tranh AI nhiều lớp ([Sorceress parallax AI](https://sorceress.games/blog/drift-a-parallax-ai-generator-25d-game-backgrounds-2026), [Illustrator's Depth](https://arxiv.org/html/2511.17454v1)) | Tạo từng lớp trời / giữa / gần riêng, không tạo một bức hoàn chỉnh rồi cắt. Mỗi lớp không được quá chi tiết ở nhiều độ sâu, nếu không sẽ vỡ ảo giác |
| Gamification du lịch ([PoGo case study](https://uxplanet.org/pogo-travel-app-case-study-c9784fb205fc), [StriveCloud](https://strivecloud.io/blog/app-gamification-ideas)) | Màn chúc mừng rõ ràng sau mỗi nhiệm vụ. Bộ sưu tập "cho đủ bộ" (con dấu) tăng gắn kết. Không lạm dụng điểm thưởng |
| Google Arts & Culture ([Talking Museum](https://blog.google/company-news/outreach-and-initiatives/arts-culture/the-talking-museum-museum-memory/)) | Hiện vật 3D xem cận cảnh, trò chơi khôi phục trưng bày. Ý tưởng cho giai đoạn sau: xem tượng Chăm 3D |
| View Transitions ([Next.js guide](https://nextjs.org/docs/app/guides/view-transitions)) | Bản ổn định cần React 19.3 / Next 16. App đang ở Next 15.5 / React 19.1, nên **không nâng cấp lúc này**. Chuyển trang "phóng to thẻ" làm bằng motion |

## 3. Định hướng thiết kế "Di sản sống"

1. **Chiều sâu phản ứng:** mọi cảnh nghiêng theo điện thoại (con quay) hoặc theo ngón tay/chuột. Lớp xa dịch ít, lớp gần dịch nhiều. Đây là hiệu ứng thấy ngay trong 1 giây đầu.
2. **Ánh sáng sống:** nền trời là shader gradient lưới chuyển động (hoàng hôn Chăm, sông Hàn, đêm bài chòi), có tia sáng (god rays) và hạt sáng rõ hơn.
3. **Kính lỏng:** thanh điều hướng, thẻ chính, nút chính là kính mờ có viền sáng và vệt phản chiếu chạy theo tay. Nút chính có viền gradient xoay.
4. **Chữ động học:** tiêu đề hiện từng chữ cái bằng lò xo, tách theo grapheme để không vỡ dấu tiếng Việt. Tiêu đề lớn có ánh kim.
5. **Xúc giác:** thẻ nghiêng 3D có vệt sáng theo tay. Đúng thì rung nhẹ, sai thì rung 2 nhịp (`navigator.vibrate`, Android). Ăn mừng to: tia sáng, đồng vàng, flash.
6. **Hiển thị ngay:** không có nội dung nào chờ JavaScript mới hiện. Hiệu ứng xuất hiện chạy bằng CSS ngay khi trang vẽ, tối đa 400ms.

## 4. Quyết định kỹ thuật

- Giữ `motion`. **Không thêm thư viện mới** (không three/R3F, không Rive, không Lottie ở giai đoạn này).
- Shader: WebGL1 thuần trong một component, DPR ≤ 1.5, dừng khi ngoài màn hình hoặc tab ẩn, không có WebGL hoặc bật giảm chuyển động thì dùng gradient CSS tĩnh.
- Nghiêng: một hook dùng chung cho pointer và deviceorientation. Trên iOS hiện một nút "Bật hiệu ứng nghiêng" để xin quyền. Có làm mượt, giới hạn ±12°.
- Kính: CSS `backdrop-filter` cho mọi trình duyệt. Khúc xạ SVG chỉ bật trên Chromium bằng `@supports`.
- Ngân sách: JS thêm ≤ 25KB gzip cho giai đoạn D. Tối đa 1 canvas WebGL mỗi màn hình. Không frame nào dài quá 50ms khi đứng yên (CPU chậm 4×).
- Giảm chuyển động: tắt shader động, nghiêng, chữ động, rung. Chỉ còn fade ≤ 150ms.

## 5. Phân công

Quy tắc chung (rút từ giai đoạn C): mỗi task chỉ sửa file mình sở hữu. Model Gemini bên trong worker **không được chạy lệnh shell**. Brief dài thì để trong file `.agy-tasks/*.md` và chỉ truyền đường dẫn. Worker tự chạy `tsc`, `eslint`, `vitest` sau khi viết. Tối đa 2 vòng sửa mỗi task.

### Đợt V0: sửa tồn đọng (song song với V1)

| # | Task | Worker | File sở hữu |
|---|---|---|---|
| V0a | Tạo `app/fx/glass.css` rỗng + import trong `fx.css`. Chạy `npm run build`. Ghi hướng dẫn xem bản mới | Phiên chính | `app/fx.css`, `app/fx/glass.css` |
| V0b | Hiển thị ngay: `TextReveal` chế độ fade-up/blur chuyển sang CSS keyframes chạy ngay khi trang vẽ (không SSR `opacity:0` chờ JS). Thời lượng ≤ 400ms. `RevealItem`, `LevelCard`, stagger hộ chiếu cũng phải hiện ngay | `ui-hydrogen-high` | `components/fx/TextReveal.tsx`, `app/fx/text.css` |
| V0c | `PhaseTransition`: reset `phase`/`done` đồng bộ khi `play=false` (lỗi nháy 1 frame còn lại của U4) | `ui-hydrogen` | `components/fx/PhaseTransition.tsx` |

### Đợt V1: bộ hiệu ứng mới (song song)

| # | Task | Worker | File sở hữu |
|---|---|---|---|
| V1 | `ShaderBackdrop({ preset: "aurora" \| "river" \| "sunset" \| "night", className })`: gradient lưới chuyển động bằng WebGL1, nhiễu mềm, có hạt sáng, phản ứng nhẹ theo con trỏ / độ nghiêng | `ui-argon-high` | `components/fx/ShaderBackdrop.tsx`, `components/fx/shaders/*` |
| V2 | `useTilt()` (pointer + deviceorientation, làm mượt, ±12°) + `TiltCard` (xoay 3D + vệt sáng glare) + `MotionPermissionButton` (iOS) | `ui-hydrogen-high` | `components/fx/useTilt.ts`, `components/fx/TiltCard.tsx`, `components/fx/MotionPermissionButton.tsx` |
| V3 | `GlassPanel` (kính lỏng, viền sáng, vệt phản chiếu theo tay, khúc xạ SVG trên Chromium) + `GlowButton` (viền gradient conic xoay, nhấn lún) | `ui-argon` | `components/fx/Glass.tsx`, `components/fx/GlowButton.tsx`, `app/fx/glass.css` |
| V4 | `KineticText` (tách grapheme, từng chữ bay lên bằng lò xo, có chế độ ánh kim) | `ui-hydrogen` | `components/fx/KineticText.tsx` |
| V5 | Ăn mừng 2.0: tia sáng xoay, đồng vàng văng theo vật lý, flash. Thêm `haptic("success" \| "error" \| "tap")` | `ui-argon` | `components/fx/Celebrate.tsx`, `lib/haptics.ts` |
| V6a | Vẽ lại tranh SVG kit `home` + `di-san-cham`: gradient nhiều tầng, ánh sáng viền, sương độ sâu, chi tiết kiến trúc, nhiều lớp hơn (5–7) | `ui-argon` | `public/scenes/home/*`, `public/scenes/di-san-cham/*`, `lib/scene/kits/home.ts`, `lib/scene/kits/di-san-cham.ts` |
| V6b | Như V6a cho `lich-su-giu-thanh` + `nghe-thuat-dan-gian` | `ui-argon` | thư mục và kit tương ứng |

### Đợt V2: ráp vào cảnh và màn hình (sau V1)

| # | Task | Worker | File sở hữu |
|---|---|---|---|
| V7 | Cảnh 2.0: `SceneBackdrop` và `ParallaxScene` dùng `ShaderBackdrop` làm trời, các lớp nghiêng theo `useTilt` theo độ sâu, thêm tia sáng. Tăng cường độ hiệu ứng nền mặc định (tốc độ, độ đậm, số hạt) | `ui-argon-high` | `components/fx/SceneBackdrop.tsx`, `components/fx/ParallaxScene.tsx`, `components/fx/Ambient.tsx`, `app/fx/ambient.css` |
| V8 | Trang chủ 2.0: hero cao hơn với cảnh nghiêng + shader, tiêu đề `KineticText` ánh kim, thẻ lối vào là `TiltCard` + kính, nút `GlowButton`, nút xin quyền nghiêng (iOS) | `ui-argon` | `app/page.tsx`, `components/shell/EntryCard.tsx` |
| V9 | Danh sách màn 2.0: `LevelCard` là thẻ nghiêng có cảnh sống. Chạm vào thì thẻ phóng to phủ màn hình rồi mới chuyển trang (giả shared-element) | `ui-hydrogen-high` | `app/kham-pha/page.tsx`, `components/shell/LevelCard.tsx`, `components/fx/ZoomNavigate.tsx` |
| V10a | Màn chơi 2.0: thẻ trạm là `GlassPanel`, tiêu đề `KineticText`, reveal dùng ăn mừng 2.0 + haptic, sao bay vào | `ui-hydrogen-high` | `components/level/LevelPlayer.tsx` |
| V10b | Các trạm: `haptic` khi đúng/sai, nút "Kiểm tra" là `GlowButton`, thẻ trạm hiệu ứng nhấn | `ui-hydrogen` | `components/level/stations/*`, `components/level/HintBox.tsx` |
| V11 | Hộ chiếu 2.0: con dấu là `TiltCard` với lớp ánh kim holographic (conic gradient đổi theo độ nghiêng), thống kê trên kính | `ui-argon` | `components/passport/*` |
| V12 | Vỏ app 2.0: thanh điều hướng dưới là kính lỏng nổi (bo tròn, cách mép), header kính khi cuộn | `ui-hydrogen` | `components/shell/BottomNav.tsx`, `components/shell/PageHeader.tsx` |

### Đợt V3: kiểm tra và chốt

| # | Task | Worker |
|---|---|---|
| V13 | Build, test, chạy thử toàn luồng trên trình duyệt 375px, bật giảm chuyển động, CPU chậm 4×. Commit, viết kết quả vào cuối báo cáo này | Phiên chính |
| V14 | Thử trên điện thoại thật (con quay iOS/Android, rung) | Anh/chị (cần mở bằng HTTPS hoặc IP mạng nội bộ) |

## 6. Tranh thật bằng AI (cần anh/chị duyệt)

Tranh vẽ bằng code (V6) sẽ đẹp hơn nhiều so với bây giờ, nhưng vẫn là vector. Muốn đạt mức "như video mẫu" cần tranh vẽ tay hoặc AI.

Quy trình đề xuất: tạo từng lớp trời / giữa / gần cho mỗi kit theo câu mô tả phong cách chung (mục 4 của `plan-ui-dong.md`). Xóa nền lớp giữa và gần. Thêm một bản đồ độ sâu cho hero để làm hiệu ứng 2.5D. Đội nội dung duyệt độ chính xác văn hoá.

Công cụ có sẵn trong phiên: Higgsfield (tạo ảnh, xóa nền), Canva. Cả hai **tốn credit tài khoản của anh/chị**, nên tôi chưa chạy. Ước tính khoảng 4 kit × 4 lớp = 16 ảnh, cộng xóa nền.

## 7. Rủi ro

- Shader và kính tốn GPU trên máy yếu. Có dự phòng tĩnh và chỉ 1 canvas mỗi màn hình. Cần đo trên máy thật (V14).
- Con quay trên iOS cần HTTPS. Thử qua `localhost` trên máy tính không kiểm được phần này.
- Khúc xạ kính chỉ có trên Chromium. Safari thấy kính mờ thường.
- Worker Gemini dễ bị chặn quyền khi tự chạy lệnh. Đã có cách tránh (mục 5).

## 8. Kết quả thực hiện (cập nhật cuối phiên)

Đã xong và qua `tsc`, `eslint`, 61 test, `next build` (JS dùng chung 103KB, trang màn chơi 191KB First Load):
V0b, V0c, V1 (shader WebGL), V2 (nghiêng), V3 (kính + nút phát sáng), V4 (chữ động học), V5 (ăn mừng 2.0 + rung), V7 (cảnh 2.0: trời shader, parallax nghiêng, tia sáng, hiệu ứng nền đậm hơn), V8 (trang chủ), V9 (thẻ phóng to khi vào màn), V10a, V10b, V11 (hộ chiếu ánh kim), V12 (thanh điều hướng kính), K1 (ghép kit bằng tranh AI).

Tranh AI đã có (Gemini, gói của chủ máy): `di-san-cham` đủ 5 lớp, `nghe-thuat-dan-gian` đủ 5 lớp, `home` 3/5 lớp (trời, núi Sơn Trà, thành phố). Còn thiếu: `home` cầu Rồng + bờ sông, `lich-su-giu-thanh` bản đồ + đại bác + cờ. Hạn mức tạo ảnh hết lúc 10:55 UTC (17:55 giờ Việt Nam). Tạo lại: xem mục dưới.

Bỏ: V6a (vẽ lại SVG home + Chăm): tranh AI thay thế.

### Chưa kiểm chứng (cần xem trên trình duyệt thật hoặc điện thoại)
- Khung Browser trong app bị ẩn nên animation bị trình duyệt làm chậm, không đo được tốc độ thật và hiệu ứng phóng to thẻ.
- Khi tab bị ẩn giữa lúc phóng to, lớp phủ có thể kẹt (không chặn bấm, chỉ hiện sai chỗ): dọn bằng requestAnimationFrame nên tạm dừng khi tab ẩn. Nên sửa bằng setTimeout.
- Con quay iOS cần HTTPS; rung chỉ có trên Android.
- Hiệu năng trên máy yếu (WebGL + backdrop-filter): chưa đo.

### Cách tạo nốt ảnh còn thiếu
Khi hạn mức hồi: gọi lại worker tạo ảnh cho `home` (cau-rong, bo-song) và `lich-su-giu-thanh` (map, dai-bao, co), lưu JPG vào `.art-raw/<kit>/<layer>.jpg`, rồi `node scripts/gen-scene-art.mjs --kit <kit>` để tách nền magenta và đổi sang WebP. Sau đó cập nhật `lib/scene/kits/*.ts` dùng các file `ai-*.webp` mới.

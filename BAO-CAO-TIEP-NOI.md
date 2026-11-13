# Báo cáo tiếp nối: việc đã làm, chưa làm, cần làm (phiên mới)

Cập nhật 2026-11-13. Nhánh `ui-dong` đã được gộp vào `main` (commit `6341d4a`, đã push). Đọc kèm: `BAO-CAO-UI-HIEN-DAI.md` (nghiên cứu + kế hoạch giai đoạn D), `NGHIEN-CUU-UI-DONG.md`, `plan-ui-dong.md`.

## 1. Cách chạy lại
- Thư mục chính `D:\Da Nang Odyssey` đang ở commit cũ, có thay đổi chưa commit (không phải của giai đoạn này). Chạy `git pull` ở đó trước khi làm tiếp, xử lý thay đổi chưa commit trước.
- Worktree cũ: `.claude/worktrees/ui-dong` (nhánh `ui-dong`, bằng `main`). Có thể xoá sau khi pull.
- Server dev: `npx next dev -p 3100`. **Không chạy `next build` khi server dev đang chạy cùng thư mục** (build ghi đè `.next`, gây lỗi `Cannot find module './897.js'`). Dừng dev hoặc xoá `.next` trước khi build.
- Khung Browser trong app Claude cần để **hiện** khi kiểm hiệu ứng, nếu ẩn thì trình duyệt làm chậm animation và mọi phép đo tốc độ sai.
- Kiểm tra: `npx tsc --noEmit`, `npx eslint app components lib scripts`, `npx vitest run` (120 test), `npx next build`. Lần cuối đều qua.

## 2. Đã xong (trên `main`)
- **Hiệu ứng**: trời shader WebGL (`ShaderBackdrop`), parallax nghiêng theo chuột / con quay (`useTilt`, `TiltCard`), kính lỏng (`Glass`, `GlowButton`), chữ động học (`KineticText`), ăn mừng 2.0 + rung (`Celebrate`, `lib/haptics.ts`), chuyển cảnh giữa trạm (`PhaseTransition`), con dấu (`StampPress`), hộ chiếu ánh kim (`HoloFoil`), thẻ phóng to khi vào màn (`ZoomNavigate` + `ZoomOverlayHost` ở `app/layout.tsx`).
- **Trang**: trang chủ, danh sách màn, màn chơi (intro cuộn camera, station, reveal), hộ chiếu, vỏ app (thanh điều hướng kính).
- **Bản máy tính** (từ 1024px, class `lg:`): thanh điều hướng nổi trên đầu, trang chủ hero lớn + 3 cột, danh sách 3 cột, màn chơi 2 cột, hộ chiếu lưới 3 cột. Điện thoại giữ nguyên.
- **Tranh AI (Gemini, gói của chủ máy)**: `di-san-cham` và `nghe-thuat-dan-gian` đủ 5 lớp, `home` 4 lớp, `lich-su-giu-thanh` 3 lớp (bản đồ, đại bác, cờ). Script `scripts/gen-scene-art.mjs` tách nền magenta và đổi WebP.
- Kiểm trong trình duyệt: trang chủ, danh sách, hộ chiếu, intro 3 màn (điện thoại), intro Giữ thành + trang chủ + danh sách + hộ chiếu (máy tính). Không có lỗi console.

## 3. Chưa làm / còn dở (xếp theo ưu tiên)

### Ưu tiên cao
1. **Thêm lại hiệu ứng cho 4 trạm chơi** (`ExpressStation`, `JigsawStation`, `MapPinStation`, `OrderStation`). Khi gộp với `main`, 4 file này lấy nguyên bản của `main` (kéo thả dnd-kit, bản đồ thật, ghi âm) nên mất: rung khi sai / nảy khi đúng, `haptic()`, nút kiểm tra là `GlowButton`, vòng sáng vàng khi chọn. Trạm `MatchStation` và `HintBox` còn giữ đủ. Quy tắc cũ phải giữ: **đúng/sai chỉ hiện sau khi bấm "Kiểm tra"** (không lộ đáp án), rung dùng `useAnimate` của motion chứ không đổi `key` (đổi key làm mất focus), không đổi cách tính điểm / đếm gợi ý / payload `onDone`. File: `components/level/stations/*.tsx` (4 file trên).
2. **Kiểm tra bằng mắt trên trình duyệt thật** (phiên này khung Browser bị ẩn):
   - Màn chơi ở máy tính khi làm các trạm (bố cục 2 cột, cảnh bên trái sticky).
   - Thanh điều hướng ở đúng 1024px và 1280px (đã đổi `lg:w-max`).
   - Hiệu ứng phóng to thẻ (`ZoomNavigate`): không chớp trắng, dọn lớp phủ sau khi vào trang (đã sửa dọn bằng `setTimeout`, chưa thử khi tab ẩn thật).
   - Tốc độ animation, độ mượt shader trên máy yếu (CPU chậm 4×, mạng Fast 4G), Lighthouse mobile (mục tiêu Performance ≥ 85, Accessibility ≥ 95).
   - Bản `main` có thêm `/tour` và `/photobooth` (check-in) chưa xem sau khi gộp.
3. **`/tour` và `/photobooth` chưa được làm đẹp** theo phong cách mới và cũng chưa có bản máy tính: trình phát tour (có phụ đề, đọc giọng nói) và luồng check-in / camera đều từ `main`. Ý tưởng cho tour: bản đồ sông Hàn vẽ tay, thuyền chạy giữa các điểm, điểm nào đang nghe thì sáng lên (U14 trong `plan-ui-dong.md`).

### Ưu tiên vừa
4. **Tranh**:
   - `public/scenes/home/ai-cau-rong.webp` đã tạo nhưng **chưa dùng** (ảnh thành phố đã có cầu). Quyết định dùng hay bỏ.
   - Ảnh `ai-bo-song.webp` (bờ sông) có thể còn **viền hồng nhẹ** quanh đèn do tách nền magenta. Nếu thấy, tạo lại hoặc chỉnh `keyPixel` trong `scripts/gen-scene-art.mjs`.
   - Màn Giữ thành bỏ `tau-buom.svg` (tàu buồm) vì sông trên bản đồ chạy dọc. Xem lại nếu muốn có tàu chạy.
   - Màn bài chòi: chưa có hai mặt thẻ bài cho hiệu ứng `card-flip` (hiện thẻ vẽ bằng code trong `PhaseTransition`).
   - Dọn các SVG cũ không còn được kit nào dùng trong `public/scenes/*`.
   - **Duyệt nội dung**: đội nội dung phải xác nhận tháp Chăm, hoa văn, thành Điện Hải, chòi bài chòi trong tranh AI đúng thực tế. Nội dung đang `[CHỜ KIỂM CHỨNG]` (`status: draft`).
5. **Điện thoại thật**: con quay iOS cần HTTPS (và nút "Bật hiệu ứng nghiêng"), rung chỉ có trên Android, `backdrop-filter` + thẻ xoay 3D có thể vẽ kém trên Safari.
6. **Ngân sách JS**: mục tiêu giai đoạn D ≤ 25KB gzip thêm. Hiện First Load JS dùng chung 103KB, trang màn chơi 212KB (có cả phần của `main`). Chưa đo phần tăng của riêng giai đoạn D.

### Việc nhỏ (nit từ review, chưa sửa)
- `ShaderBackdrop`: listener `pointermove` vẫn gắn khi ngoài màn hình (thêm `active` vào điều kiện).
- `text.css`: `var(--fx-ease-out)` nên có giá trị dự phòng.
- `KineticText`: `maxWidth: 100%` không có tác dụng trên từ `nowrap`.
- `glass.css`: `.fx-glass > *` ép `position: relative` có thể đè phần tử con `absolute`.
- `MotionPermissionButton`: `setHidden(true)` thừa.
- Mỗi thẻ cảnh `calm` gọi `useTilt` riêng (ổn với 6 thẻ, không mở rộng nhiều hơn).
- `LevelPlayer` desktop: thanh tiến độ trạm render hai lần (một cho máy tính, một cho điện thoại), loại trừ nhau.
- `ParallaxScene` hiển thị bản cuộn trong một khung hình đầu ở người dùng giảm chuyển động rồi mới chuyển sang bản tĩnh (đánh đổi để tránh lỗi hydrate).
- Chưa kiểm: có component trong `components/fx/*` nào không còn được dùng (ví dụ `TextReveal` chế độ scramble/glitch). Grep trước khi xoá.

## 4. Bài học khi giao việc cho worker (để khỏi lặp lại)
- Model Gemini bên trong worker **không được chạy lệnh shell** (chế độ headless từ chối và run chết im lặng). Brief dài để trong file `.agy-tasks/*.md`, truyền cho worker một câu ngắn trỏ tới file đó (nhồi cả file vào dòng lệnh quá giới hạn 32K của Windows). Worker tự chạy `tsc`, `eslint`, `vitest` sau khi model viết xong.
- Hạn mức Gemini: **argon và argon-high hết (hồi sau khoảng 123 giờ kể từ chiều 2026-11-13)**, nên dùng `ui-hydrogen`, `ui-hydrogen-high`, `ui-flash`. Hạn mức tạo ảnh (`gemini-3.1-flash-image`) hồi lúc 10:55 UTC mỗi lần hết. API key trong máy không có hạn mức ảnh, ảnh phải đi qua `invoke_subagent` → `image-generator` của agy (lưu JPG vào `C:\Users\ACER\.gemini\antigravity-cli\brain\...`, copy về `.art-raw/<kit>/<lớp>.jpg`, chạy `node scripts/gen-scene-art.mjs --kit <kit>`).
- Mỗi worker chỉ sửa file mình sở hữu. Sau mỗi task có reviewer (sonnet), tối đa 2 vòng sửa. Review bắt được nhiều lỗi thật (lộ đáp án, mất focus khi rung, khóa trạm bị bỏ qua, id SVG trùng, focus ring bị cắt…), nên giữ bước này.
- Quy tắc của chủ máy: không tự viết code giao diện trong phiên chính trừ khi worker hỏng hai lần; commit không thêm dòng Co-Authored-By.

## 5. Đề xuất thứ tự cho phiên mới
1. `git pull` ở thư mục chính, chạy dev, mở khung Browser (hiện) và xem lại toàn bộ luồng ở 375px và 1440px.
2. Giao worker thêm lại hiệu ứng cho 4 trạm (mục 3.1), review, chạy test.
3. Làm đẹp `/tour` + `/photobooth` (mục 3.3), có cả bản máy tính.
4. Đo hiệu năng, dọn nit, dọn SVG cũ.
5. Duyệt nội dung tranh với đội nội dung.

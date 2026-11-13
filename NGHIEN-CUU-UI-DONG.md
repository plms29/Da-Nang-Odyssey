# Nghiên cứu UI động theo 4 video mẫu (UI video/)

Chỉ là nghiên cứu, chưa build. Ngày 2026-11-13.

## 1. Bốn video thực chất là gì

Cả 4 là clip TikTok quay màn hình: nửa đầu là code Three.js / React Three Fiber do Gemini viết trong Antigravity, nửa sau là website đã chạy. Có một điều quan trọng cần tách ra:

- **Hiệu ứng của website** (cái cần làm lại): cảnh minh hoạ nhiều lớp, chuyển động nền lặp vô hạn, cuộn để camera đi xuyên cảnh, chữ hiện ra theo kiểu riêng.
- **Hiệu ứng dựng video** (không phải của website, KHÔNG cần làm): màn hình bị nghiêng 3D, zoom-blur giữa các đoạn, outro TikTok tách màu RGB, logo CapCut. Một phần các lần chuyển "nhoè/sọc" có thể cũng là CapCut.
- Code Three.js chiếu trong video (hạt bụi vũ trụ, vòng warp, `instancedMesh`, `AdditiveBlending`, mặt sóng sin tô màu theo độ cao) chủ yếu để khoe. **Phần đẹp nhất trên site lại là tranh minh hoạ raster + parallax + CSS**, còn Three.js chỉ lo lớp hạt/ánh sáng.

## 2. Phân tích từng video

### V1 — "Segesta" (núi, thác, nhà máy ngầm) — 24s
- Mở màn: thành phố hai bên, núi tím, chữ tiêu đề giãn khoảng cách.
- Khi cuộn: **camera đi xuống theo dòng thác**, từ đỉnh núi xuống tận các tầng hầm. Thác chảy xuyên suốt mọi section, làm sợi chỉ nối các phần.
- Mỗi section là một "phòng" trong cùng một bức tranh dọc rất dài: Our Mission (người đứng trên ban công kính), Our Advantages (bánh xe nước quay), A Model For Success (ống dung nham phát sáng, bong bóng vàng), cuối cùng là hang mở ra cảnh hoàng hôn.
- Chuyển động nền: nước thác chảy (sọc dọc trôi xuống), bánh xe quay, ống phát sáng nhấp nháy, bong bóng nổi lên.
- Chữ: hiện mờ dần và trượt nhẹ lên khi section vào khung nhìn.

### V2 — "Origin" (biển, thuyền, lặn sâu) — 22s
- Hero: thuyền buồm lắc lư trên sóng, núi và hải đăng phía sau, có vệt glitch ngang lướt qua.
- Khi cuộn: **camera lặn xuống dưới mặt nước**, sóng che màn hình rồi nền chuyển sang gradient xanh đậm (đúng hiệu ứng "chìm xuống").
- Đoạn chữ lớn "The exploration of the ocean…" có một cụm từ tô màu nhấn.
- **Carousel ba thẻ** (Laboratory / Exploration / Organisms): mỗi thẻ có một vật thể minh hoạ 3D (tàu ngầm, ống nghiệm, vi sinh vật) nổi lơ lửng phía trên, có bong bóng, có nút Previous/Next, thẻ giữa được nâng lên.
- "Oceanic Pharmacy": tiêu đề hiện ra kiểu **glitch tách màu** rồi mới ổn định; cảnh đáy biển có thợ lặn và mái vòm, cá bơi.
- Cuộn ngược lên thì cảnh chạy ngược lại (gắn với vị trí cuộn, không phải phát một lần rồi thôi).

### V3 — "Ready to take off?" (đặt vé máy bay) — 26s
- Hero nhìn từ trên xuống: **máy bay đứng giữa màn hình, đường băng, xe và vệt khói trôi bên dưới** nên trông như máy bay đang lăn bánh. Lúc mới vào cảnh còn xám rồi lên màu.
- Ô tìm chuyến bay đè lên phần dưới hero.
- Chuyển trang kết quả: máy bay cất cánh, chuyển sang cảnh đài kiểm soát và đồi xanh, máy bay nhỏ bay ngang qua. Danh sách vé có dạng thẻ lên máy bay (có QR).
- Chuyển trang chi tiết: **máy bay bay qua tầng mây** làm màn chuyển cảnh, sau đó là "Flight Details" trên nền mây.
- Ý chính: hình ảnh động gắn với nghĩa của từng bước (lăn bánh, cất cánh, bay). Đây là kiểu phù hợp nhất với app này.

### V4 — "Nexa AI" (tối, phát sáng) — 21s
- Nền đen xanh có sao. Một **đốm sáng giống sao chổi/sứa** ở giữa, xung quanh là các **đường cong neon** (xanh, tím) uốn lượn chậm.
- Chữ: hiện ra từ nhoè sang nét (blur-in), có đoạn chữ **xáo ký tự rồi giải mã** kèm sọc magenta (text scramble + glitch).
- Chuyển section: sọc ngang quét qua (có thể là CapCut).
- Footer: logo lớn, đường neon vẫn chạy phía sau.

## 3. Danh mục hiệu ứng và cách làm

Cột "Chi phí": 0 là CSS thuần, không thêm thư viện.

| Hiệu ứng | Thấy ở | Cách làm | Chi phí |
|---|---|---|---|
| Parallax nhiều lớp (trời, núi, nhà, tiền cảnh) | V1, V2 | 3–5 ảnh WebP nền trong suốt chồng lên nhau, mỗi lớp `translateY` theo tỉ lệ cuộn khác nhau | CSS scroll-driven, hoặc `motion` `useScroll` + `useTransform` |
| Camera đi xuyên một tranh dài | V1 | Một khung `sticky` cao bằng màn hình, bên trong là tranh rất cao, `translateY` theo tiến độ cuộn của một khối cao 400–600vh | `motion` hoặc GSAP ScrollTrigger (scrub + pin) |
| Nước chảy, thác | V1 | Div có `repeating-linear-gradient` sọc dọc, chạy `background-position` vô hạn; thêm `mask-image` để mép mờ dần | 0 |
| Sóng biển, sông | V2 | 2–3 path SVG hình sin, `translateX` lặp với tốc độ lệch nhau; hoặc ảnh sóng lặp ngang | 0 |
| Vật lắc lư (thuyền, đèn lồng, cờ) | V2 | `@keyframes` xoay ±3° quanh `transform-origin` đặt đúng điểm treo hoặc đáy | 0 |
| Nền trôi để vật chính trông như đang chạy | V3 | Vật chính đứng yên, ảnh nền lặp dọc chạy `background-position-y` vô hạn | 0 |
| Bong bóng, bụi sáng, đom đóm | V1, V2 | Ít hạt (dưới 20): span + keyframes ngẫu nhiên. Nhiều hạt: một canvas 2D khoảng 60 dòng | 0 |
| Đốm sáng, đường neon | V4 | SVG path + `filter: blur` + `mix-blend-mode: screen`, vẽ dần bằng `stroke-dashoffset`. Three.js + bloom chỉ khi cần 3D thật | 0, hoặc Three ~150KB+ |
| Lặn xuống nước, chuyển cảnh | V2 | Lớp mặt nước `clip-path` / `mask` quét từ dưới lên, nền đổi gradient theo tiến độ cuộn | 0 hoặc `motion` |
| Màn chuyển trang có ý nghĩa (máy bay bay qua mây) | V3 | Overlay toàn màn hình: mây và vật thể bay ngang trong khoảng 0,8s, đổi nội dung đúng lúc bị che. `AnimatePresence` hoặc View Transitions API | `motion` |
| Xám chuyển sang màu khi vào cảnh | V3 | `filter: grayscale(1)` chuyển về 0 | 0 |
| Chữ hiện mờ và trượt lên | V1, V2 | IntersectionObserver gắn class, hoặc `motion` `whileInView` | 0 |
| Chữ nhoè sang nét | V4 | `filter: blur(12px)` về 0 cùng `opacity` | 0 |
| Glitch tách màu RGB | V2, V4 | 2 pseudo-element có `text-shadow` đỏ/xanh lệch nhau, `clip-path: inset()` nhảy theo bước trong khoảng 0,4s | 0 |
| Xáo ký tự rồi giải mã | V4 | Hàm JS khoảng 20 dòng, thay dần từng ký tự ngẫu nhiên bằng ký tự đúng | 0 |
| Carousel thẻ có vật thể nổi | V2 | Scroll-snap ngang, thẻ giữa `scale(1.05)`, ảnh vật thể tràn ra khỏi thẻ và chạy keyframe lơ lửng | 0 |
| Thẻ dạng vé, QR | V3 | Bo góc + hai lỗ khuyết bằng `radial-gradient` mask | 0 |

## 4. Đề xuất kỹ thuật cho app này (Next 15, React 19, Tailwind 4, mobile 480px)

Thứ tự ưu tiên là cái nhẹ nhất mà vẫn đủ đẹp:

1. **CSS thuần lo khoảng 70% hiệu ứng** (lặp nền, lắc lư, nước, sóng, glitch, chữ hiện ra). Không thêm thư viện.
2. **Thêm đúng một thư viện chuyển động: `motion`** (tên mới của Framer Motion), dùng cho:
   - `AnimatePresence`: chuyển giữa các phase `intro → station → reveal` của `LevelPlayer` (chuyển cảnh kiểu V3).
   - `useScroll` / `useTransform`: parallax và camera đi xuyên cảnh ở intro.
   - Khi đã có `motion` thì không thêm GSAP nữa. GSAP + ScrollTrigger (nay miễn phí, có cả SplitText) chỉ đáng dùng khi muốn một trang landing cuộn dài với nhiều timeline ghim. App này là game theo màn, không phải landing page.
3. **Bỏ qua Three.js / R3F ở giai đoạn đầu.** Trên điện thoại tầm trung, three + R3F + postprocessing nặng hơn 200KB gzip và tốn pin. Đốm sáng, hạt và đường neon làm bằng canvas 2D hoặc SVG blur trông gần như nhau. Chỉ xét lại nếu cần một vật thể 3D xoay được, ví dụ tháp Chăm.
4. **CSS scroll-driven animations** (`animation-timeline: view()`) rất hợp cho parallax mà không cần JS. Chrome/Edge chạy được. Tôi chưa kiểm chứng mức hỗ trợ hiện tại của Safari iOS và Firefox, nên phải có fallback (vẫn đọc được khi đứng yên) hoặc dùng `motion` cho phần này.
5. Lottie / Rive cho nhân vật động (người hô bài chòi, vũ nữ Apsara) là tuỳ chọn và cần người vẽ animation. Để sau.

Quy tắc bắt buộc:
- `prefers-reduced-motion: reduce` thì tắt mọi chuyển động lặp và parallax, chỉ giữ fade.
- Chỉ animate `transform`, `opacity` và `filter`. Dừng animation khi ra khỏi khung nhìn (IntersectionObserver hoặc `animation-play-state`).
- **Ở màn chơi (station), cảnh nền phải tối đi và chậm lại** để không làm người chơi mất tập trung (ghép hình, nối cặp). Hiệu ứng mạnh chỉ dành cho intro và reveal.
- Ảnh WebP/AVIF rộng khoảng 960px (2x của 480px), mỗi lớp dưới 150KB, `next/image` ưu tiên tải lớp hero.

## 5. Gắn với chủ đề câu hỏi: mỗi theme một "bộ cảnh"

Mỗi `Theme` trong `lib/types.ts` có một bộ gồm: các lớp tranh, 2–3 chuyển động nền, một màn chuyển cảnh và một hiệu ứng ăn mừng ở reveal. Màn chơi đọc `level.spot_ids → spot.theme` để chọn bộ.

| Theme | Lớp tranh | Chuyển động nền | Chuyển cảnh / reveal |
|---|---|---|---|
| `di-san-cham` (màn 1 Dấu ấn Chăm) | Tháp Chăm gạch đỏ, phù điêu sa thạch, hoa sen, trời hoàng hôn | Bụi vàng bay trong tia nắng, khói hương, ánh sáng quét qua phù điêu | Intro: camera đi từ trời xuống chân tháp (kiểu V1). Reveal: phù điêu "khắc" dần hiện ra (mask wipe) và hạt vàng |
| `lich-su-giu-thanh` (màn 2 Giữ thành) | Thành Điện Hải hình ngôi sao nhìn từ trên xuống, súng thần công, sông Hàn, tàu chiến | Cờ bay, sóng sông, khói pháo, mây trôi bóng xuống (kiểu V3 nhìn từ trên) | Intro: nhìn từ trên cao rồi zoom vào cổng thành. Chuyển cảnh: khói pháo che màn hình. Reveal: cờ kéo lên |
| `nghe-thuat-dan-gian` (màn 3 Hô bài chòi) | Dãy chòi tre, thẻ bài, trống, đèn lồng, sân đình ban đêm | Đèn lồng lắc lư, thẻ bài lật, ánh đèn nhấp nháy | Chuyển cảnh: một thẻ bài lật 3D đổi cảnh. Reveal: trống rung và pháo giấy |
| `am-thuc` | Mì Quảng, bánh tráng, chợ Hàn | Hơi nóng bốc lên, đũa gắp | Tô mì hiện ra từ hơi nước |
| `lang-nghe` | Đá Non Nước, đục đá, xưởng | Bụi đá bay, tia lửa | Khối đá được "đục" lộ ra tượng |
| `do-thi-song-le-hoi` | Cầu Rồng, sông Hàn đêm, pháo hoa | Rồng phun lửa, pháo hoa, phản chiếu mặt nước | Pháo hoa ở reveal |

Dữ liệu hiện chỉ có 3 spot thuộc 3 theme đầu, nên **chỉ cần làm 3 bộ cảnh trước**.

## 6. Phần khó nhất là tranh, không phải code

- Video mẫu đẹp nhờ có **một bức tranh thống nhất phong cách** cho mọi cảnh. Code chuyển động chỉ chiếm khoảng 20% công sức.
- Cách làm khả thi: tạo ảnh bằng AI (Gemini/Imagen hoặc công cụ ảnh khác), dùng **cùng một câu mô tả phong cách** cho mọi cảnh (flat vector illustration, gradient mềm, bảng màu bám theo token sand / terracotta / river / gold). Sau đó tách lớp: tạo riêng từng lớp nền trong suốt, hoặc tạo cả cảnh rồi tách bằng công cụ xoá nền / tách lớp.
- Vật chuyển động (cờ, đèn lồng, thuyền, khói) phải là **ảnh riêng** thì mới animate được.
- Rủi ro nội dung: hoa văn Chăm, hình dáng thành Điện Hải và chòi bài chòi do AI vẽ dễ sai. Đội nội dung cần duyệt như duyệt `story` (`status: verified`).

## 7. Bước tiếp theo đề xuất (chưa làm)

1. Làm thử 1 bộ cảnh (`di-san-cham`, màn 1): 4 lớp tranh, parallax intro, bụi vàng, chuyển phase bằng `motion`, reveal có hạt. Đo trên điện thoại thật (FPS, dung lượng tải) trước khi nhân ra 3 theme.
2. Nếu đạt thì viết `plan.md` theo quy trình multi-agent: phần khung cảnh và chuyển cảnh giao `ui-argon`, phần CSS lặp giao `ui-hydrogen`, phần tranh tạo riêng.

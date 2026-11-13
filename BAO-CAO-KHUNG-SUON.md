# Báo cáo tiến độ

## Đợt B3: Tour 5 phút và chú thích ảnh

Tour chạy trọn vòng không cần Gemini hay khóa Maps. Kiểm tra chung: 101 test qua, tsc, lint, build sạch. Tự thử trên trình duyệt: chọn tour, phụ đề chạy, nghe hết điểm 1 (60 giây) → trạm ghép mảnh → "Để sau" → sang điểm 2; bỏ qua hai điểm còn lại → màn kết ghi đúng một dấu `tour` cho điểm đã nghe (`bao-tang-cham: {tour: true}`); bỏ qua hết thì không ghi dấu; tiêu điểm bàn phím chuyển theo từng điểm. Màn check-in với `?demo=bao-tang-cham` hiện thẻ chú thích (câu dự phòng, tối đa 100 ký tự, nút "Bỏ chú thích", "Dùng lại gợi ý").

| Task | Worker | Review | Vòng sửa | Ghi chú |
| --- | --- | --- | --- | --- |
| T15 giao kèo (`narration_audio`, `levelForSpot`, kiểu tour/chú thích) | Claude (main) | — | — | |
| T16 lời kể Gemini cho tour (B3) | `ui-hydrogen-high` | Sửa: transition điểm cuối phải rỗng; transition chưa kiểm số; luật kiểm số chưa xử lý "1.945" | 1 | Mọi chữ số trong lời kể phải có trong kho tri thức của điểm, nếu không điểm đó dùng lời kể dựng sẵn |
| T17 `/api/caption` (B5) | `ui-hydrogen` | — | 1 (test thoát dấu `<` `>` đỏ) | Mình lỡ commit khi test còn đỏ, đã sửa test và commit lại ngay |
| T18 chú thích trên ảnh (F7, F8) | `ui-hydrogen-high` | Duyệt | 0 | Ảnh không gửi đi, chỉ mã điểm |
| T19 logic tour (máy trạng thái, phụ đề, giọng đọc) | `ui-hydrogen-high` | Duyệt kèm 1 lỗi Chrome | 1 | Chrome kẹt im lặng nếu hủy lúc đang tạm dừng: đã thêm `resume()` sau `cancel()` |
| T20 giao diện tour | `ui-hydrogen-high` | Sửa: lệch điểm dừng trên bản đồ khi API trả mã lạ, mất tiêu điểm, tự phát audio bị chặn | 1 | Quá 9 giây hoặc lỗi thì tự dựng tour dựng sẵn trên máy |

Mình tự sửa hai test (T16, T17) vì lỗi nằm trong test, không phải code.

**Chưa thử thật được:** giọng đọc tiếng Việt (máy này chưa có giọng, nên mới thấy phụ đề chạy theo hẹn giờ), camera bay trên bản đồ (cần khóa Maps), Gemini soạn lời kể và chú thích (cần khóa), có giọng `vi-VN` trên iPhone và Android hay không, và Gemini có giữ đúng độ dài theo số giây hay không.

**Không làm trong B3 (theo thứ tự cắt):** hỏi bằng giọng nói và bằng chữ trong tour (B4), dải 3 khung, tách nền MediaPipe, audio Gemini TTS dựng sẵn.

**Việc của bạn:** tour 10 phút hiện chỉ có 3 điểm vì dữ liệu mới có 3 điểm; đội nội dung cần thêm điểm. Kịch bản demo dùng tour 3 phút có hai điểm.

---

## Đợt B2: Bản đồ, kéo thả, trạm hô bằng giọng nói

Ba màn P0 giờ có đủ cách tương tác KH mục 4 yêu cầu. Kiểm tra chung: 58 test qua, tsc, lint, build sạch. Trang chơi màn tăng từ 7,6 kB lên 26,7 kB JS (dnd-kit).

| Task | Worker | Review | Vòng sửa | Đã kiểm tra |
| --- | --- | --- | --- | --- |
| T10 giao kèo: `audio` trong yêu cầu chấm, `transcript` trong kết quả; cài dnd-kit | Claude (main) | — | — | tsc, test |
| T11 Google Maps cho trạm Tìm (F2) | `ui-argon` → `ui-hydrogen-high` | 1 lỗi chặn: nạp Maps kiểu `loading=async` mà không gọi `importLibrary` thì bản đồ có thể không dựng | 1 (argon hết quota, chuyển worker theo quy tắc dự phòng) | Không có khóa: hiện đúng ô nhập tọa độ + nút demo. **Chưa thử với khóa thật** |
| T12 kéo thả ghép mảnh và xếp thứ tự (F4) | `ui-argon` → `ui-hydrogen-high` | Sửa nhỏ: lớp đè khi kéo, nhãn trình đọc màn hình tiếng Anh, vuốt trang bị chặn trên điện thoại | 1 (argon hết quota giữa chừng) | Màn 1 ghép 9 mảnh qua trạm; màn 2 xếp bằng ▲/▼ qua trạm; nhãn "mục có thể sắp xếp". **Chưa thử kéo bằng tay trên điện thoại** |
| T13 ghi âm trạm Thể hiện (F5) | `ui-hydrogen-high` | Sửa: nhãn định dạng âm thanh đoán bừa, bản ghi 0 byte vẫn gửi, hẹn giờ tự dừng bị trình duyệt làm chậm | 1 | Màn 1 và 3 hiện lựa chọn Nói / Gõ chữ. **Chưa ghi âm thật** (khung trình duyệt chặn micro) |
| T14 chấm giọng nói ở `/api/judge` (B2) | `ui-hydrogen-high` | Sửa: chưa kiểm tra ký tự base64, đọc body không giới hạn khi thiếu header, thiếu test cho route | 1 | Claude đọc lại phần đọc body; 5 test route mới (413, 400, 422 không lộ dữ liệu âm thanh) |

**Quota:** `ui-argon` hết quota tuần (còn khoảng 123 giờ). Các task giao diện phức tạp sau đây sẽ chạy trên `ui-hydrogen-high` cho đến khi quota reset, trừ khi bạn nâng gói.

**Đã sửa thêm:** eslint từng quét cả worktree `.claude/worktrees/ui-dong` của phiên khác (336 lỗi giả); đã loại thư mục này.

**Việc của bạn sau đợt B2:**
1. Tạo khóa Google Maps (giới hạn theo domain Cloud Run), đặt `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` lúc build.
2. Đặt `GEMINI_API_KEY`, `GEMINI_MODEL` và thử một câu hô bài chòi thật: chưa xác minh Gemini nhận `audio/webm` (Chrome) và `audio/mp4` (iPhone).
3. Nhánh `ui-dong` cần rebase lên `main` trước khi làm U6, U7 vì các file trạm chơi đã thay đổi nhiều.

---

## Đợt B1: Photobooth check-in, hộ chiếu, hạ tầng

**Kết quả phải có của giai đoạn 2 (KH mục 11):** "Ảnh check-in có khung và dấu, tải về được". Code đã đủ: chạy được trên trình duyệt đến bước mở camera. Chưa chụp thử thật vì khung trình duyệt trong app chặn camera; **cần thử trên điện thoại qua HTTPS** (URL Cloud Run).

| Task | Worker | Review | Vòng sửa | Đã kiểm tra |
| --- | --- | --- | --- | --- |
| T6 trang hộ chiếu (F9) | `ui-hydrogen` | Duyệt kèm 3 mục nên sửa | 1 | Đọc đúng dữ liệu trên máy (dấu màn 1, 2 sao, 200 điểm), không lệch hydration |
| T7 photobooth (F7) | `ui-argon-high` | Yêu cầu sửa 6 mục (iOS `videoWidth`, nạp phông đậm cho canvas, đọc đếm ngược, dấu "Ghé thăm trực tuyến" quá nhỏ, rò rỉ URL) | 1 (worker lỗi mạng lúc kết thúc; Claude kiểm từng mục trong code, đủ cả 7) | tsc, lint; mở được bước xin quyền camera |
| T8 luồng check-in (F8) | `ui-hydrogen-high` | Duyệt kèm 3 mục nên sửa | 1 | `?demo=bao-tang-cham` → "Bạn đang ở Bảo tàng Điêu khắc Chăm" → PhotoBooth; từ chối camera hiện đúng lời nhắc |
| T9 Dockerfile, CI, hướng dẫn Cloud Run (I1) | Claude (main) | — | — | `npm run build` với `output: "standalone"`; **chưa build được Docker image** vì Docker Desktop trên máy chưa chạy |

Kiểm tra chung: 44 test qua, tsc, lint, build sạch.

**Đã sửa thêm:** Vitest từng chạy cả test trong `.claude/worktrees/` của một phiên khác (86 test thay vì 44); đã loại thư mục này.

**Việc của bạn sau đợt B1:**
1. Deploy theo [DEPLOY.md](DEPLOY.md) (cần `PROJECT_ID` và quyền Google Cloud của bạn), rồi mở `https://<URL>/photobooth?demo=bao-tang-cham` trên iPhone và Android để chụp thử.
2. Khung ảnh hiện vẽ bằng code theo chủ đề (CK-04 dạng tạm); đội nội dung vẽ khung PNG thật sau.

---

# Giai đoạn A: Khung sườn sản phẩm

Ngày 13/11/2026 · Repo: https://github.com/plms29/Da-Nang-Odyssey (nhánh `main`)

## Kết luận

Khung sườn chạy được trọn một vòng trên điện thoại. Màn 1 chơi được từ mở màn đến lúc nhận sao; bài ở trạm Thể hiện được `/api/judge` chấm bằng đường dự phòng; hộ chiếu trên máy ghi dấu "hoàn thành màn". Chưa cần khóa Gemini hay Google Maps. Toàn bộ nội dung vẫn là **dữ liệu giữ chỗ (`draft`)**, chưa có sự kiện lịch sử nào được kiểm chứng.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` (Vitest) | 42 test qua, 6 file |
| `npx tsc --noEmit` | Không lỗi |
| `npx eslint .` | Không lỗi |
| `npm run build` | Qua; 3 màn được dựng tĩnh |
| `npm run validate` | Hợp lệ, 6 cảnh báo "chưa verified" (đúng như mong đợi) |
| Chơi màn 1 trên khung 375px | Mở màn → ghim (nút demo) → ghép 9 mảnh → nộp bài → kết màn, 2 sao, 200 điểm code |
| Hộ chiếu (`localStorage`) | `bao-tang-cham: {level: true}`, màn 1 lưu sao và điểm |
| `GET /healthz` | 200 |
| `POST /api/judge` | `graded_by: "fallback"` khi chưa có khóa; JSON hỏng trả 400 |
| `POST /api/tour/plan` (180 giây, di sản Chăm) | 2 điểm dừng, xếp theo tuyến, `generated_by: "fallback"` |

Chưa thử: iPhone/Android thật, gọi Gemini thật (chưa có khóa), triển khai Cloud Run.

## Module đã có (đối chiếu KH mục 8)

| Mã KH | Module | Trạng thái | File chính |
| --- | --- | --- | --- |
| C1, C2 | Kho tri thức, kịch bản màn | Khung + 3 điểm, 3 màn P0 giữ chỗ | `content/spots.json`, `content/levels.json` |
| C4 | Kiểm tra nội dung | Xong; chạy trước mỗi lần build; `npm run validate:demo` chặn nội dung chưa `verified` | `scripts/validate-content.mjs` |
| F1 | Vỏ ứng dụng | Xong: trang chủ 3 lối vào + hộ chiếu, thanh điều hướng dưới, trang giữ chỗ | `app/layout.tsx`, `app/page.tsx`, `components/shell/*` |
| F3 | Bộ máy màn | Xong (máy trạng thái thuần, có test) | `lib/level/engine.ts` |
| F4 | Thư viện hoạt động | Hàm chấm xong cho ghim, ghép mảnh, xếp thứ tự, ghép cặp; giao diện tạm (chưa kéo thả, chưa bản đồ) | `lib/activities/scoring.ts`, `components/level/stations/*` |
| F5 | Trạm Thể hiện | Dạng chữ xong; chưa ghi âm, chưa vẽ | `components/level/stations/ExpressStation.tsx` |
| F8 | Xác thực vị trí | Logic xong (chọn điểm gần nhất, từ chối khi sai số lớn hơn bán kính, cờ `?demo=`); chưa có giao diện | `lib/geo/locate.ts` |
| F9 | Hộ chiếu | Lưu trên máy xong; chưa có trang hiển thị, chưa đồng bộ Firestore | `lib/passport/*` |
| B1 | Lập tuyến tour | Chọn điểm theo luật + lời kể dựng sẵn | `lib/tour/*`, `app/api/tour/plan/route.ts` |
| B2 | Giám khảo | Xong: Gemini (khi có khóa) + dự phòng theo từ khóa, server tự cộng điểm | `lib/judge/*`, `app/api/judge/route.ts` |
| I1 (một phần) | `/healthz` | Xong; chưa có Dockerfile/Cloud Run/CI | `app/healthz/route.ts` |

Các giao kèo trong KH mục 9 đã có trong code: `spot_id` là khóa chung; F4 chỉ trả `{correct, score, hints_used}`; chỉ F9 ghi tiến độ; trình duyệt không gọi Gemini; mọi đường Gemini đều có dự phòng.

## Bảo mật ở `/api/judge` (theo KH mục 7 và 12)

- Bài làm nằm trong khối `<bai_lam>`, mọi dấu `<` `>` trong bài bị vô hiệu hóa để người chơi không đóng khối sớm; prompt nhắc bỏ qua chỉ dẫn cả trước và sau khối.
- Gemini chỉ trả điểm từng tiêu chí; server kiểm tra đủ id, số nguyên 0 đến 3, rồi tự tính tổng và sao.
- Nhiệt độ 0, hết 8 giây thì chuyển sang chấm dự phòng; nhận xét bị cắt ở 300 ký tự.
- Không ghi bài làm vào log; body lớn hơn 64 KB trả 413; bài dài hơn `max_chars` trả 400.

## Ai làm gì

| Task | Worker | Review (sonnet) | Vòng sửa |
| --- | --- | --- | --- |
| T0 nền móng: scaffold, kiểu dữ liệu, nội dung, kiểm tra nội dung | Claude (main) | — | — |
| T1 vỏ ứng dụng | `ui-argon` | Duyệt | 0 |
| T2 bộ máy màn + hàm chấm | `ui-hydrogen-high` | Duyệt | 0 |
| T3 hộ chiếu + vị trí | `ui-hydrogen-high` | Duyệt | 0 |
| T4 API chấm và tour | `ui-hydrogen-high` | Yêu cầu sửa: 1 lỗi chặn (lách khối `<bai_lam>`), 3 lỗi nên sửa | 1, Claude kiểm tra lại |
| T5 trang chơi màn | `ui-hydrogen` | Yêu cầu sửa: 4 lỗi nên sửa (xử lý lỗi API, a11y sao, ghép cặp trùng, nút gợi ý) | 1 |

**Sự cố:** lần chạy đầu, cả 4 worker Gemini dừng vì chế độ chạy nền không cho dùng lệnh shell. Mình không đổi cấu hình quyền; thay vào đó dặn worker chỉ đọc/ghi file, còn test, tsc, lint, build do phiên chính chạy. Cách này chạy ổn cho mọi task sau.

## Việc còn mở trước giai đoạn B

1. **Nội dung:** đội nội dung thay toàn bộ chữ `[CHỜ KIỂM CHỨNG]`, tọa độ `0.0`, nguồn và `must_include` của rubric; đổi `status` sang `verified` khi đã đối chiếu hai nguồn.
2. **Tên mô hình Gemini:** đặt `GEMINI_API_KEY` và `GEMINI_MODEL` trong `.env.local` sau khi tra trang Models (KH mục 7).
3. **Khóa Google Maps** cho F2.
4. Danh sách "Việc cần xác minh trước khi code" ở KH mục 11 vẫn chưa tích mục nào.

## Đề xuất giai đoạn B (theo lộ trình KH mục 11)

| Đợt | Việc | Module | Worker dự kiến |
| --- | --- | --- | --- |
| B1 | Trang hộ chiếu đọc store (xử lý hydration), trang check-in: xin quyền vị trí, cờ demo, khoảng cách, nút chỉ đường | F9, F8 | `ui-hydrogen-high` |
| B1 | Photobooth: camera trước/sau, khung 9:16, đếm ngược, ghép khung + chữ tiếng Việt trên canvas, tải về, Web Share | F7 | `ui-argon-high` |
| B1 | Dockerfile + Cloud Run asia-southeast1 + Secret Manager; CI chạy validate, test, build | I1 | Claude (main) |
| B2 | Bản đồ Google Maps cho trạm Tìm và tour | F2 | `ui-argon` |
| B2 | Ghép mảnh và xếp thứ tự bằng kéo thả (dnd-kit) | F4 | `ui-argon` |
| B2 | Ghi âm 20 giây cho trạm hô bài chòi + chấm âm thanh | F5, B2 | `ui-hydrogen-high` |
| B3 | Trình phát tour: chọn thời lượng/chủ đề, phụ đề, giọng đọc trình duyệt, lời kể Gemini có dự phòng 8 giây | F6, B3 | `ui-argon` + `ui-hydrogen-high` |
| B3 | Chú thích ảnh check-in `/api/caption` | B5 | `ui-hydrogen` |
| Sau | Tách nền MediaPipe cho kiểu từ xa, Firestore, bảng xếp hạng, Live API | F7, I2, B4, B6 | theo thứ tự cắt ở KH mục 11 |

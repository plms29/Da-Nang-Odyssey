# Video giới thiệu "Hành trình văn hóa Đà Nẵng": 2:00, ngang 16:9 (1920×1080)

Lời đọc ~2,5 từ/giây, đọc thử rồi chỉnh theo giọng. `[QUAY]` = ô trống team quay. Clip nằm trong `clips/`.

| Thời gian | Cảnh | Hình | Lời đọc |
|---|---|---|---|
| 0:00–0:10 | **[QUAY A]** Mở đầu | Phố cổ / Thành Điện Hải, người trẻ cầm điện thoại | "Đà Nẵng có những viên gạch từng chứng kiến năm 1858. Nhưng ai sẽ kể lại câu chuyện đó cho chúng ta?" |
| 0:10–0:16 | Tiêu đề | `title.mp4` (5,6s, ảnh Gemini) | "Hành trình văn hóa Đà Nẵng." |
| 0:16–0:23 | Giới thiệu | `home.mp4` (7s) | "Biến di sản thành một cuộc phiêu lưu chơi được trên điện thoại. Mỗi màn là một địa điểm thật, mỗi trạm là một việc để làm." |
| 0:23–0:52 | Game: Thành Điện Hải | `dien_hai.mp4` (29s): cuộn chuyển cảnh ~13s → trạm 1: ghim thật trên bản đồ → "Xác nhận ghim" → ✓. Cắt đuôi khi chặng 2 vừa hiện | "Vào màn đầu tiên, Giữ thành. Bạn cuộn xuống như bay ngược dòng thời gian, tới tòa thành Điện Hải bên cửa biển. Trạm một: tìm thành. Đọc manh mối, chạm đúng vị trí trên bản đồ, xác nhận ghim, và thành hiện ra. Đúng rồi! Trạm tiếp theo mở ra." |
| 0:52–1:02 | **[QUAY B]** Chơi thật | Bạn trẻ đứng trước thành, mở app, chỉ bản đồ | "Đi thật, chơi thật, nhớ thật." |
| 1:02–1:17 | **[QUAY: PHOTOBOOTH]** 15s | Team quay màn hình điện thoại: Check-in → Chụp ảnh → tách nền, phông, caption Gemini | "Đến nơi, chụp ảnh với khung của chính địa điểm. AI tách người khỏi nền ngay trên máy bạn, ghép vào phông của thành, và Gemini viết cho mỗi tấm ảnh một lời đề tặng riêng." |
| 1:17–1:30 | Cộng đồng | `community.mp4` (8s, **dữ liệu mẫu**) + 5s giữ khung hoặc ảnh team | "Muốn chia sẻ thì tick một lần. Ảnh của bạn lên bảng Cộng đồng, nơi mọi người cùng nhìn thấy Đà Nẵng qua mắt người chơi." |
| 1:30–1:47 | **Công nghệ** | `tech.mp4` (16,6s) | "Đằng sau là Gemini API. Gemini nghe giọng và xem ảnh để chấm từng tiêu chí, trả về JSON chặt chẽ, có dự phòng khi mất mạng. Gemini viết caption cho photobooth và dựng tour năm phút, đối chiếu với dữ liệu di sản đã kiểm chứng. Cùng với Next.js, MediaPipe, Supabase và Cloud Run." |
| 1:47–1:54 | Kết | `outro.mp4` (7,3s, ảnh Gemini) | "Đi để nhớ, chơi để hiểu, và kể lại bằng giọng của bạn." |
| 1:54–2:00 | **[QUAY D]** | Cả nhóm + điện thoại, logo, link/QR | (nhạc kết) |

## Trung thực về clip
- Trạm 1 là thao tác thật: bản quay tự bấm đúng vị trí trên bản đồ, không dùng nút demo.
- **Cộng đồng dùng 6 ảnh mẫu** (cắt từ ảnh Gemini) qua dữ liệu giả, vì không thể đăng nhập Google tự động. Hãy thay bằng ảnh thật nếu muốn.
- Chưa quay được lệnh gọi Gemini thật (cần khóa + đăng nhập). Phần Gemini hiện qua thẻ công nghệ. Nên quay trạm "Thể hiện" trên bản có khóa nếu ban giám khảo muốn thấy chấm điểm chạy thật.

## Ảnh Gemini (skill `animation-scenes`, `agy` image-generator)
Có `art/open.jpg` và `art/close.jpg`. Ảnh nền thẻ công nghệ thứ ba bị **hết quota (429), reset ~06:33 UTC 14/11**. Thẻ công nghệ đang dùng `close.jpg` làm mờ. Khi có quota, tạo thêm ảnh ngang 16:9, thay vào `cards.html`.

# Kế hoạch sản phẩm: Hành trình văn hóa Đà Nẵng (DevFest 2026)

Nov 13, 2026 · @plms

## 1. Tóm tắt

Sản phẩm là một web app chạy trên điện thoại, biến văn hóa Đà Nẵng thành một hành trình có ba lối vào dùng chung một kho nội dung đã kiểm chứng:

- **Khám phá:** chiến dịch gồm các màn cố định, mỗi màn là một nét văn hóa và ba hoạt động tương tác (tìm, làm, thể hiện).
- **5 phút:** tour kể chuyện trên bản đồ cho người bận, Gemini soạn lời kể từ kho nội dung.
- **Photobooth check-in:** chụp ảnh bằng camera thiết bị ngay tại điểm tham quan, có khung văn hóa và con dấu "đã đến".

Ba lối vào đổ về một **hộ chiếu văn hóa**: con dấu của màn chơi, của tour và của check-in nằm chung một chỗ.

Kế hoạch này dựa trên bản "Đặc tả sản phẩm và yêu cầu công nghệ" v1.0 của team và thay đổi ba điểm: Khám phá chuyển từ hồ sơ câu đố sang màn hoạt động; Gemini được dùng để chấm các hoạt động mở; photobooth thêm check-in tại chỗ.

**Còn thiếu để chốt:** thời lượng hackathon, số thành viên và tiêu chí chấm trong sổ tay thí sinh. Lộ trình ở mục 11 vì vậy chia theo giai đoạn, chưa chia theo ngày.

## 2. Thay đổi so với bản đặc tả v1.0 của team

Phần lớn bản đặc tả được giữ nguyên; năm điểm dưới đây thay đổi và cần cả team đồng ý vì chúng đảo ngược một số nguyên tắc cũ.

| Hạng mục | Bản đặc tả v1.0 | Kế hoạch này | Lý do |
| --- | --- | --- | --- |
| Chế độ Khám phá | Bản đồ các điểm, mỗi điểm một hồ sơ câu đố | Chiến dịch tuyến tính gồm các màn cố định, mỗi màn ba trạm hoạt động | Người chơi làm một việc mang tính văn hóa, không chỉ trả lời |
| Vai trò Gemini trong phần chơi | Không sinh, không chấm (PZ-01) | Vẫn không sinh đề; chấm các hoạt động mở theo rubric cố định | Hoạt động mở (kể, hô, vẽ) không chấm được bằng code |
| "Gemini chấm tự luận" | Ngoài phạm vi (mục 1.5) | Trong phạm vi, giới hạn ở trạm thứ ba của mỗi màn | Như trên |
| Photobooth | Nền ảo, mở khóa khi giải đố | Thêm check-in tại chỗ: xác thực vị trí, chụp cảnh thật, khung văn hóa, dấu "đã đến". Nền ảo giữ lại cho người ở xa | Kéo người dùng đến điểm văn hóa thật |
| Hộ chiếu | Một loại dấu | Ba loại dấu: hoàn thành màn, nghe tour, đã đến | Nối ba lối vào thành một sản phẩm |

**Giữ nguyên từ v1.0:** kho tri thức JSON có nguồn và trạng thái kiểm chứng; luồng tour 5 phút (TR-01 đến TR-09); tách nền bằng MediaPipe trên thiết bị; kiến trúc Next.js + Cloud Run + Firestore; kịch bản dự phòng khi Gemini lỗi; danh sách việc cần xác minh ở mục 12 của bản đặc tả.

## 3. Trục văn hóa và giá trị cho Đà Nẵng

Mọi tính năng phải trả lời được câu hỏi "người dùng hiểu hoặc làm được gì về văn hóa Đà Nẵng sau bước này"; tính năng không trả lời được thì cắt.

### Giá trị mang lại

| Cho ai | Giá trị | Tính năng tạo ra giá trị đó |
| --- | --- | --- |
| Du khách | Biết Đà Nẵng ngoài biển và Bà Nà: bảo tàng, thành cổ, làng nghề, nghệ thuật dân gian | Tour 5 phút, các màn Khám phá |
| Điểm di tích và làng nghề | Có thêm khách đến tận nơi, có ảnh check-in lan tỏa trên mạng | Photobooth check-in, dấu "đã đến" |
| Học sinh và người địa phương | Học lịch sử, văn hóa quê mình bằng cách làm, dùng được trong giờ giáo dục địa phương | Màn hoạt động, phần mở khóa tri thức có nguồn |
| Ngành du lịch thành phố | Số liệu ẩn danh: điểm nào được quan tâm, màn nào được chơi hết, bao nhiêu lượt check-in mỗi điểm | Firestore, bảng thống kê |
| Văn hóa phi vật thể | Được thực hành chứ không chỉ được nhắc tên: người chơi thử hô một câu bài chòi, thử thuyết minh một hiện vật | Trạm "Thể hiện" do Gemini chấm |

### Kho nội dung

- **Sáu chủ đề:** di sản Chăm; lịch sử giữ thành; làng nghề; nghệ thuật dân gian; ẩm thực; đô thị bên sông và lễ hội.
- **Quy mô:** 8 đến 10 điểm cho MVP, mỗi điểm có truyện kể, ảnh, khung photobooth, tọa độ và bán kính check-in.
- **Kiểm chứng:** mỗi mốc thời gian, tên riêng đối chiếu hai nguồn và có người thứ hai duyệt; chỉ nội dung `verified` được lên demo.
- **Nguồn ưu tiên:** bảo tàng, Sở Văn hóa và Thể thao, Cổng thông tin thành phố, Báo Đà Nẵng. Nếu kịp, xin một ý kiến xác nhận từ Bảo tàng Điêu khắc Chăm hoặc Bảo tàng Đà Nẵng để nêu trong phần trình bày.
- **Hình ảnh:** ảnh và họa tiết khung do đội tự chụp, tự vẽ hoặc có giấy phép rõ; không lấy ảnh Street View làm nền.

Các sự kiện và hoạt động nêu ở mục 4 là đề xuất thiết kế; chi tiết lịch sử trong từng màn phải qua bước kiểm chứng trên trước khi viết vào dữ liệu.

## 4. Chế độ Khám phá: chiến dịch theo màn cố định

Khám phá là một chiến dịch sáu màn đi theo thứ tự, mỗi màn là một nét văn hóa và có kịch bản viết sẵn trong file dữ liệu. Không có nội dung nào trong màn do AI sinh ra.

### Cấu trúc chung của một màn

1. **Mở màn:** truyện dẫn cố định khoảng 30 giây, có giọng đọc dựng sẵn và ảnh minh họa.
2. **Trạm Tìm:** xác định địa điểm trên bản đồ hoặc Street View từ manh mối. Code chấm theo khoảng cách.
3. **Trạm Làm:** một thao tác tay gắn với nét văn hóa đó (ghép, xếp, gõ nhịp, nấu). Code chấm.
4. **Trạm Thể hiện:** một bài làm mở (nói, viết, vẽ). Gemini chấm theo rubric cố định của trạm.
5. **Kết màn:** phần mở khóa tri thức kèm nguồn, số sao, con dấu hộ chiếu, khung photobooth của điểm và lời mời "đến tận nơi để lấy dấu đã đến".

### Sáu màn đề xuất

| Màn | Điểm văn hóa | Trạm Tìm | Trạm Làm | Trạm Thể hiện (Gemini chấm) | Ưu tiên |
| --- | --- | --- | --- | --- | --- |
| 1. Dấu ấn Chăm | Bảo tàng Điêu khắc Chăm | Ghim bảo tàng trên bản đồ | Ghép mảnh một phù điêu, rồi kéo hiện vật về đúng phòng trưng bày | Thuyết minh viên 30 giây: nói hoặc gõ lời giới thiệu hiện vật vừa ghép | P0 |
| 2. Giữ thành | Thành Điện Hải | Ghim vị trí thành bên sông Hàn | Xếp các sự kiện vào đúng dòng thời gian | Lá thư từ thành: viết 3 đến 4 câu trong vai một người giữ thành | P0 |
| 3. Hô bài chòi | Một điểm diễn bài chòi (đội xác minh địa điểm) | Ghim nơi diễn | Ghép con bài với câu hô của nó, rồi gõ theo nhịp | Hô một câu: ghi âm tối đa 20 giây hô theo câu mẫu | P0 |
| 4. Bàn tay làng nghề | Làng đá Non Nước, làng nước mắm Nam Ô | Ghim hai làng | Xếp các bước làm nghề theo đúng quy trình | Phác hoa văn: vẽ lại một hoa văn mẫu trên màn hình | P1 |
| 5. Vị Quảng | Mì Quảng và một điểm ẩm thực đội chọn | Ghim điểm ẩm thực | "Nấu" tô mì: chọn đúng nguyên liệu, đúng thứ tự | Mời khách: giới thiệu món cho khách lạ trong 2 đến 3 câu | P1 |
| 6. Thành phố bên sông | Cầu sông Hàn, Cầu Rồng, Ngũ Hành Sơn | Ghim các điểm dọc sông | Ảnh xưa và nay: chạm vào chỗ đã thay đổi | Bưu thiếp Đà Nẵng: chụp photobooth và viết lời nhắn tổng kết hành trình | P2 |

### Luật chơi và chấm điểm

- **Trạm Tìm và Làm:** 100 điểm mỗi trạm; mỗi gợi ý trừ 20, mỗi lần sai trừ 10, tối thiểu 20 khi làm đúng. Ba bậc gợi ý viết sẵn.
- **Trạm Thể hiện:** rubric ba tiêu chí, mỗi tiêu chí 0 đến 3, quy ra 100. Ví dụ với "Thuyết minh viên": đúng với kho tri thức; đủ ba ý bắt buộc; diễn đạt dễ hiểu.
- **Qua màn:** xong hai trạm đầu và nộp bài trạm thứ ba. Điểm Gemini chỉ quyết định số sao (1 đến 3), không chặn người chơi.
- **Nhận xét:** Gemini trả một câu khen điểm đúng và một câu bổ sung điều còn thiếu, chỉ lấy từ kho tri thức của màn.
- **Công bằng:** không chấm giọng vùng miền hay chất giọng; trạm hô chỉ chấm đúng lời, rõ tiếng và có ngắt nhịp.
- **Người không dùng micro:** mọi trạm nói đều có lựa chọn gõ chữ.

### Vì sao cách này ổn định

Màn, manh mối, đáp án, gợi ý và rubric đều nằm trong `levels.json`, nên hai người chơi luôn gặp cùng một nội dung. Phần duy nhất thay đổi theo từng lần là điểm và lời nhận xét của trạm Thể hiện, và phần đó được kẹp trong rubric.

## 5. Chế độ 5 phút

Chế độ 5 phút giữ luồng của bản đặc tả v1.0 và chỉ đổi phần tương tác: mỗi điểm dừng dùng lại **trạm Làm** của màn tương ứng thay cho mini-hồ sơ riêng, nên không phải soạn thêm nội dung.

1. Người dùng chọn thời lượng (3, 5 hoặc 10 phút) và chủ đề quan tâm.
2. Backend chọn điểm dừng bằng luật: khớp chủ đề, vừa ngân sách thời gian, đúng tuyến đi.
3. Gemini soạn lời kể và câu chuyển tiếp cho từng điểm, chỉ từ kho tri thức của điểm đó, theo độ dài tính bằng giây.
4. Tour phát: camera bay trên bản đồ, giọng đọc, phụ đề; người dùng giữ nút để hỏi bằng giọng nói (Gemini Live, bám kho tri thức).
5. Cuối mỗi điểm: một trạm Làm ngắn, có nút "Để sau".
6. Kết tour: dấu "đã nghe" cho từng điểm, lời mời chơi trọn màn ở Khám phá, và nút "Chỉ đường đến đây" mở Google Maps để đến check-in.

| Thời lượng | Điểm dừng | Hoạt động | Kết thúc |
| --- | --- | --- | --- |
| 3 phút | 2 | 1 trạm Làm | Photobooth nền ảo, 1 ảnh |
| 5 phút | 3 | 2 trạm Làm | Photobooth nền ảo, dải 3 khung |
| 10 phút | 5 | Mỗi điểm 1 trạm Làm | Dải 3 khung, tự chọn nền |

Các con số là cấu hình mặc định trong file cấu hình, chỉnh sau khi chạy thử. Luôn có một kịch bản tour và audio dựng sẵn; hệ thống tự chuyển sang kịch bản này khi Gemini không trả lời trong 8 giây.

## 6. Photobooth check-in tại điểm tham quan

Photobooth chạy ngay trong trình duyệt bằng camera của thiết bị và có hai kiểu: **check-in tại chỗ** khi người dùng đang đứng ở điểm tham quan, và **ghé thăm từ xa** với nền ảo cho người chưa đến.

|  | Check-in tại chỗ | Ghé thăm từ xa |
| --- | --- | --- |
| Điều kiện | Vị trí thiết bị nằm trong bán kính của điểm | Đã hoàn thành màn hoặc nghe tour của điểm |
| Hình ảnh | Cảnh thật qua camera, không tách nền | Người được tách nền bằng MediaPipe, ghép vào ảnh nền của điểm |
| Trang trí | Khung họa tiết của điểm, tên điểm, ngày, dấu "đã đến" | Cùng khung, dấu "ghé thăm trực tuyến" |
| Vào hộ chiếu | Dấu vàng "đã đến", điểm thưởng cao | Không thêm dấu mới |
| Ưu tiên | P0 | P0 ảnh đơn, P1 dải 3 khung |

### Luồng check-in tại chỗ

1. Người dùng mở "Check-in" từ bản đồ, từ màn kết của một màn chơi, hoặc từ cuối tour.
2. Ứng dụng xin quyền vị trí, kèm một câu giải thích lý do.
3. Trình duyệt lấy tọa độ; ứng dụng tính khoảng cách đến các điểm ngay trên thiết bị và chọn điểm gần nhất trong bán kính.
4. Trong bán kính: mở camera với khung của điểm đó. Ngoài bán kính: hiện "còn cách khoảng X m" và nút chỉ đường, hoặc mời dùng kiểu từ xa.
5. Đếm ngược, chụp, xem lại, chụp lại nếu muốn.
6. Gemini viết một dòng chú thích văn hóa cho ảnh từ kho tri thức của điểm; người dùng giữ, sửa hoặc bỏ. Chỉ mã điểm được gửi lên, ảnh không rời máy.
7. Lưu ảnh hoặc chia sẻ qua Web Share API; hộ chiếu nhận dấu "đã đến".

### Yêu cầu chi tiết

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| CK-01 | Mỗi điểm có tọa độ và bán kính check-in riêng trong dữ liệu (đề xuất 150 đến 300 m, chỉnh theo độ rộng của điểm) | P0 |
| CK-02 | Từ chối xác thực khi sai số định vị lớn hơn bán kính; cho thử lại | P0 |
| CK-03 | Cờ demo: giả lập vị trí tại một điểm để trình diễn trong hội trường | P0 |
| CK-04 | Khung họa tiết riêng cho từng điểm, lấy cảm hứng từ chính nét văn hóa đó (hoa văn Chăm, con bài chòi, vân đá) | P0 |
| CK-05 | Camera trước và sau, khung dọc 9:16, nạp xong phông tiếng Việt trước khi vẽ chữ lên ảnh | P0 |
| CK-06 | Ảnh xử lý hoàn toàn trên thiết bị; tọa độ không lưu, server chỉ nhận mã điểm và thời điểm | P0 |
| CK-07 | Kiểu từ xa tự chuyển sang khung viền không tách nền khi tốc độ dưới 12 khung hình mỗi giây | P0 |
| CK-08 | Dòng chú thích văn hóa do Gemini viết, có câu viết sẵn để thay khi Gemini lỗi | P1 |
| CK-09 | Mã QR đặt tại điểm làm cách xác thực thay thế khi định vị trong nhà kém (bảo tàng) | P2 |
| CK-10 | Tường check-in cộng đồng: người dùng chủ động đăng ảnh lên Cloud Storage, có duyệt | P2 |

**Giới hạn cần nói rõ với giám khảo:** xác thực vị trí trên trình duyệt có thể bị giả lập, nên dấu "đã đến" là kỷ niệm chứ không phải bằng chứng. Mã QR tại điểm (CK-09) là bước siết chặt khi hợp tác với đơn vị quản lý di tích.

## 7. Gemini dùng ở đâu

Gemini làm năm việc: chấm bài mở, soạn lời kể, trả lời bằng giọng nói, đọc lời kể và viết chú thích ảnh. Nó không sinh câu hỏi, đáp án hay dữ kiện lịch sử.

| Việc | Đầu vào | Đầu ra | Ràng buộc | Dự phòng | Ưu tiên |
| --- | --- | --- | --- | --- | --- |
| Chấm trạm Thể hiện (văn bản) | Bài làm, rubric của trạm, kho tri thức của màn | JSON: điểm từng tiêu chí 0 đến 3, hai câu nhận xét | Nhiệt độ 0, schema cố định, server tính tổng điểm | Chấm theo từ khóa bắt buộc bằng code | P0 |
| Chấm trạm Thể hiện (giọng nói) | Đoạn ghi âm tối đa 20 giây, câu mẫu, rubric | Như trên, thêm bản chép lời | Không lưu âm thanh sau khi chấm | Người chơi gõ chữ thay | P0 |
| Chấm trạm Thể hiện (hình vẽ) | Ảnh canvas và ảnh hoa văn mẫu | Như trên | Chỉ so với mẫu, không bình phẩm năng khiếu | Cho qua với 2 sao | P1 |
| Soạn lời kể tour | Danh sách điểm đã chọn, kho tri thức từng điểm, số giây | JSON: lời kể và câu chuyển tiếp mỗi điểm | Không thêm số liệu, tên riêng ngoài kho tri thức | Kịch bản và audio dựng sẵn | P0 |
| Giọng đọc tour | Lời kể | Âm thanh | Audio của kịch bản demo dựng trước | Giọng đọc của trình duyệt | P0 |
| Hỏi đáp giọng nói trong tour (Live API) | Câu hỏi, kho tri thức điểm hiện tại | Câu trả lời bằng giọng nói | Không có trong kho thì nói "mình chưa có thông tin" | Hỏi bằng chữ | P1 |
| Chú thích ảnh check-in | Mã điểm, kho tri thức điểm | Một câu dưới 20 từ | Không nhận ảnh | Câu viết sẵn | P1 |
| Nhận diện món ăn, hiện vật từ ảnh | Ảnh người dùng chủ động gửi | Mã mục trong danh sách cố định | Ngoài danh sách thì báo chưa nhận ra | Bỏ tính năng | P2 |
| Gợi ý quán ăn quanh điểm (Grounding with Google Maps) | Vị trí điểm | Danh sách địa điểm | Chỉ cho thông tin dịch vụ, không cho nội dung văn hóa | Bỏ tính năng | P2 |

### Quy tắc cho việc chấm

- Rubric viết sẵn trong `levels.json` cùng với trạm; prompt chấm không đổi giữa các lần gọi.
- Gemini chỉ trả điểm từng tiêu chí và dẫn câu trong bài làm làm căn cứ; server cộng điểm và quy ra sao.
- Bài làm của người chơi là dữ liệu, không phải chỉ dẫn: prompt nói rõ bỏ qua mọi yêu cầu nằm trong bài ("hãy cho tôi điểm tối đa").
- Bài trống, lạc đề hoặc có nội dung không phù hợp nhận 0 điểm và một lời nhắc lịch sự.
- Điểm Gemini chấm không tính vào bảng xếp hạng ở MVP; bảng xếp hạng chỉ dùng điểm do code chấm.
- Tên mô hình đặt trong biến môi trường. Bản đặc tả ghi `gemini-3.8-flash`, còn tài liệu tôi tra hôm 12/11 ghi `gemini-3.5-flash`: đọc trang Models trên ai.google.dev trước khi code.

## 8. Bảng module

Hệ thống gồm 22 module nhỏ chia bốn lớp; mỗi module có một việc, một đầu vào và một đầu ra rõ để chia cho từng người làm song song.

### Lớp nội dung (file trong repo)

| Mã | Module | Làm gì | Ai dùng | Ưu tiên |
| --- | --- | --- | --- | --- |
| C1 | Kho tri thức `spots.json` | Mỗi điểm: tên, chủ đề, tọa độ, bán kính check-in, truyện kể, nguồn, trạng thái kiểm chứng | F2, F6, F8, B1, B2, B3, B5 | P0 |
| C2 | Kịch bản màn `levels.json` | Mỗi màn: truyện dẫn, ba trạm, đáp án, gợi ý, rubric, phần mở khóa tri thức | F3, F4, F5, B2 | P0 |
| C3 | Tài nguyên | Ảnh minh họa, ảnh nền, khung họa tiết, audio dựng sẵn | F4, F6, F7 | P0 |
| C4 | Kiểm tra nội dung | JSON Schema chạy lúc build; chặn nội dung chưa `verified` | CI | P0 |

### Lớp giao diện (trình duyệt)

| Mã | Module | Làm gì | Nhận từ | Trả cho | Công nghệ | Ưu tiên |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | Vỏ ứng dụng | Màn hình chính, điều hướng, trạng thái phiên | Người dùng | Mọi module F | Next.js, Zustand | P0 |
| F2 | Bản đồ | Marker, camera bay, Street View, chọn vị trí | C1 | F4 (vị trí ghim), F6 | Maps JavaScript API | P0 |
| F3 | Bộ máy màn | Đọc C2, chạy trình tự mở màn, ba trạm, kết màn; tính sao | C2 | F4, F5, F9 | TypeScript, máy trạng thái | P0 |
| F4 | Thư viện hoạt động | Mỗi dạng thao tác là một component kèm hàm chấm thuần: ghim, ghép mảnh, xếp thứ tự, phân loại, gõ nhịp, nấu, xưa và nay | F3, F2 | F3 (điểm) | dnd-kit, Vitest | P0 ba dạng, P1 còn lại |
| F5 | Trạm Thể hiện | Thu âm, ô gõ chữ, canvas vẽ; gửi bài đi chấm, hiện nhận xét | F3 | B2 | MediaRecorder, Canvas | P0 |
| F6 | Trình phát tour | Phát lời kể, phụ đề, điều khiển camera bản đồ, nút giữ để hỏi | B1, B3, B4 | F2, F4, F9 | Web Audio | P0 |
| F7 | Photobooth | Camera, tách nền, ghép khung và chữ, xuất ảnh, chia sẻ | C3, F8, F9 | F9, B5 | getUserMedia, MediaPipe, Canvas, Web Share | P0 |
| F8 | Xác thực vị trí | Lấy tọa độ, tính khoảng cách đến các điểm, trả điểm đang đứng | C1 | F7 | Geolocation API | P0 |
| F9 | Hộ chiếu và tiến độ | Ba loại dấu, sao, điểm; lưu máy và đồng bộ | F3, F6, F7 | B6, F7 (nền đã mở) | localStorage, Firestore | P0 lưu máy, P1 đồng bộ |

### Lớp dịch vụ (Cloud Run)

| Mã | Module | Đường dẫn | Làm gì | Gọi tới | Ưu tiên |
| --- | --- | --- | --- | --- | --- |
| B1 | Lập tuyến tour | `POST /api/tour/plan` | Chọn và xếp điểm dừng bằng luật | C1, B3 | P0 |
| B2 | Giám khảo | `POST /api/judge` | Ghép rubric và kho tri thức, gọi Gemini, kiểm tra JSON, tính điểm | C1, C2, Gemini | P0 |
| B3 | Người kể chuyện | Nội bộ của B1 | Soạn lời kể, tạo giọng đọc, lưu đệm theo tuyến | Gemini, Cloud Storage | P0 |
| B4 | Cấp phiên giọng nói | `POST /api/live/token` | Cấp token tạm cho Live API, gắn kho tri thức điểm hiện tại | Gemini Live | P1 |
| B5 | Chú thích ảnh | `POST /api/caption` | Viết một câu chú thích từ kho tri thức | C1, Gemini | P1 |
| B6 | Tiến độ và xếp hạng | `POST /api/progress`, `GET /api/leaderboard` | Ghi dấu, điểm; chấm lại điểm code ở server; thống kê theo điểm | Firestore | P1 |

### Lớp hạ tầng

| Mã | Module | Làm gì | Ưu tiên |
| --- | --- | --- | --- |
| I1 | Cloud Run, Secret Manager, CI | Một service chạy cả giao diện và API ở vùng asia-southeast1; khóa API trong Secret Manager; mỗi lần đẩy code chạy C4, unit test, build, triển khai | P0 |
| I2 | Firestore và đăng nhập ẩn danh | Tiến độ theo người dùng, bảng xếp hạng, số liệu check-in ẩn danh | P1 |
| I3 | Cloud Storage | Ảnh, khung, audio dựng sẵn và audio lưu đệm | P0 |

## 9. Các module kết hợp với nhau thế nào

Ba lối vào đọc chung hai file nội dung, gọi chung một service Cloud Run và ghi kết quả vào chung một hộ chiếu; hộ chiếu là thứ nối chúng lại.

&#91;embedded content: Kiến trúc module · 4 lớp, 3 lối vào\]

Đọc từ trên xuống: nội dung cố định được đóng gói vào ứng dụng; mỗi lối vào gửi một loại yêu cầu xuống Cloud Run; chỉ Cloud Run nói chuyện với Gemini.

### Ba luồng dữ liệu chính

**Một màn Khám phá**

1. F3 đọc màn từ C2 và phát truyện dẫn.
2. F4 chạy trạm Tìm (mượn bản đồ F2) và trạm Làm; hàm chấm trong F4 trả điểm ngay trên máy.
3. F5 thu bài trạm Thể hiện và gửi `level_id`, `station_id`, bài làm tới B2.
4. B2 lấy rubric từ C2 và kho tri thức từ C1, gọi Gemini, kiểm tra JSON, trả điểm và nhận xét.
5. F3 tính sao, F9 ghi dấu màn và mở khóa nền cho F7.

**Một tour 5 phút**

1. F1 gửi thời lượng và chủ đề tới B1.
2. B1 chọn điểm từ C1; B3 xin Gemini lời kể và giọng đọc, lưu đệm vào Cloud Storage.
3. F6 phát từng điểm dừng và điều khiển camera của F2; khi người dùng giữ nút hỏi, F6 xin token từ B4.
4. Cuối mỗi điểm, F6 gọi một trạm Làm của F4; F9 ghi dấu đã nghe.

**Một lần check-in**

1. F8 lấy tọa độ, so với bán kính trong C1 và trả mã điểm cho F7.
2. F7 mở camera với khung từ C3, chụp và ghép ảnh trên máy.
3. F7 gửi mã điểm tới B5 để lấy câu chú thích; ảnh không được gửi.
4. F9 ghi dấu đã đến; B6 tăng số đếm check-in ẩn danh của điểm.

### Giao kèo giữa các module

- **Mã điểm (`spot_id`)** là khóa chung của mọi module; không module nào tự đặt tên điểm riêng.
- **F4 không biết mình đang ở chế độ nào:** nó nhận cấu hình một trạm và trả kết quả `{correct, score, hints_used}`, nên Khám phá và 5 phút dùng chung.
- **F9 là nơi duy nhất ghi tiến độ:** F3, F6, F7 chỉ phát sự kiện `stamp(spot_id, loại)`.
- **Trình duyệt không gọi Gemini trực tiếp,** trừ phiên Live dùng token tạm do B4 cấp.
- **Mọi lời gọi Gemini có đường dự phòng** nêu ở mục 7, nên mất Gemini thì ba luồng trên vẫn chạy hết.

## 10. Mô hình dữ liệu và API

So với bản đặc tả v1.0, dữ liệu thêm bán kính check-in cho điểm, đổi `puzzles.json` thành `levels.json` có rubric, và thêm hai API: `/api/judge` và `/api/caption`.

### Điểm văn hóa (thêm vào `spots.json`)

```json
{
  "id": "bao-tang-cham",
  "checkin": { "lat": 0.0, "lng": 0.0, "radius_m": 200 },
  "frame": "frames/bao-tang-cham.png",
  "caption_fallback": "Câu chú thích viết sẵn, đã kiểm chứng"
}
```

Tọa độ 0.0 là giá trị giữ chỗ; đội điền tọa độ thật sau khi kiểm chứng.

### Một màn trong `levels.json`

```json
{
  "id": "man-1-dau-an-cham",
  "order": 1,
  "spot_ids": ["bao-tang-cham"],
  "intro": { "text": "Truyện dẫn cố định", "audio": "audio/man-1-intro.mp3" },
  "stations": [
    { "id": "tim", "type": "map_pin", "clue": "...",
      "target": { "lat": 0.0, "lng": 0.0, "radius_m": 150 }, "hints": ["", "", ""] },
    { "id": "lam", "type": "jigsaw", "image": "...", "grid": [3, 3], "hints": ["", "", ""] },
    { "id": "the-hien", "type": "open_text_or_voice", "prompt": "Giới thiệu hiện vật trong 30 giây",
      "rubric": [
        { "id": "dung", "desc": "Không trái với kho tri thức" },
        { "id": "du-y", "desc": "Nêu đủ ba ý bắt buộc", "must_include": ["", "", ""] },
        { "id": "de-hieu", "desc": "Diễn đạt dễ hiểu với người chưa biết" }
      ] }
  ],
  "reveal": { "text": "Mở khóa tri thức", "sources": [{ "title": "", "url": "" }] },
  "status": "verified"
}
```

### Kết quả chấm từ `/api/judge`

```json
{
  "criteria": [
    { "id": "dung", "score": 3, "evidence": "câu trích từ bài làm" },
    { "id": "du-y", "score": 2, "evidence": "..." },
    { "id": "de-hieu", "score": 3, "evidence": "..." }
  ],
  "score": 89,
  "stars": 3,
  "praise": "Một câu khen",
  "addition": "Một câu bổ sung từ kho tri thức",
  "graded_by": "gemini"
}
```

`graded_by` nhận `gemini` hoặc `fallback`, để giao diện nói rõ khi bài được chấm bằng đường dự phòng.

### Tiến độ người dùng (Firestore, `users/{uid}`)

```json
{
  "stamps": { "bao-tang-cham": { "level": true, "tour": true, "visited": "2026-11-20" } },
  "levels": { "man-1-dau-an-cham": { "stars": 3, "code_score": 180 } },
  "total_code_score": 180
}
```

### API

| Đường dẫn | Vào | Ra | Module | Ưu tiên |
| --- | --- | --- | --- | --- |
| `POST /api/tour/plan` | Thời lượng, chủ đề | Các điểm dừng: lời kể, câu chuyển tiếp, audio | B1, B3 | P0 |
| `POST /api/judge` | `level_id`, `station_id`, bài làm (chữ, âm thanh hoặc ảnh) | Kết quả chấm như trên | B2 | P0 |
| `POST /api/caption` | `spot_id` | Một câu chú thích | B5 | P1 |
| `POST /api/live/token` | `spot_id` | Token tạm cho Live API | B4 | P1 |
| `POST /api/progress` | Sự kiện dấu, điểm code | Tiến độ đã lưu | B6 | P1 |
| `GET /api/leaderboard` | Số dòng | Top theo điểm code | B6 | P1 |
| `GET /healthz` |  | Trạng thái | I1 | P0 |

Đáp án của trạm Tìm và Làm nằm trong gói giao diện ở MVP; khi bật bảng xếp hạng, B6 chấm lại ở server và đáp án được tách khỏi dữ liệu gửi xuống.

## 11. Lộ trình, ưu tiên và phân công

Lộ trình chia năm giai đoạn; mỗi giai đoạn kết thúc bằng một thứ chạy được trên điện thoại. Tỷ lệ thời gian là đề xuất, quy ra ngày khi biết thời lượng hackathon.

| Giai đoạn | Phần thời gian | Việc chính | Module | Kết quả phải có |
| --- | --- | --- | --- | --- |
| 0. Chuẩn bị | 10% | Đọc thể lệ và tiêu chí; chốt 3 màn P0; thu nguồn, ảnh; dựng dự án Google Cloud và khóa API; đưa trang trống lên Cloud Run | C1, C4, I1 | Đường dẫn Cloud Run mở được trên điện thoại |
| 1. Một màn trọn vẹn | 30% | Bộ máy màn, ba dạng hoạt động đầu, trạm Thể hiện dạng chữ, Giám khảo | C2, F1, F2, F3, F4, F5, B2 | Màn 1 chơi được từ mở màn đến nhận sao |
| 2. Photobooth check-in | 20% | Camera, khung, xác thực vị trí, cờ demo, tách nền cho kiểu từ xa, hộ chiếu lưu máy | F7, F8, F9, C3 | Ảnh check-in có khung và dấu, tải về được |
| 3. Tour 5 phút và hai màn còn lại | 25% | Lập tuyến, lời kể, giọng đọc, trình phát; màn 2 và 3; trạm hô bài chòi bằng giọng nói | B1, B3, F6, C2 | Tour 3 phút chạy hết; ba màn P0 xong |
| 4. Hoàn thiện và tập demo | 15% | Thử trên iPhone và Android thật; kịch bản dự phòng; video quay sẵn; slide; tập nói | Tất cả | Chạy demo ba lần liên tiếp không lỗi |

### Thứ tự cắt khi thiếu thời gian

1. Nhận diện ảnh, Grounding with Google Maps, tường check-in, mã QR, 3D.
2. Màn 4, 5, 6 và trạm vẽ.
3. Bảng xếp hạng và đồng bộ Firestore (giữ hộ chiếu lưu máy).
4. Hỏi bằng giọng nói trong tour (thay bằng hỏi bằng chữ).
5. Dải 3 khung và kiểu từ xa có tách nền (giữ check-in tại chỗ).

**Không cắt:** ba màn P0 với nội dung đã kiểm chứng, Gemini chấm ít nhất một trạm Thể hiện, check-in tại chỗ có cờ demo, tour 3 phút có giọng đọc, triển khai trên Cloud Run.

### Phân công theo vai

| Vai | Module | Việc đầu tiên |
| --- | --- | --- |
| Nội dung và văn hóa | C1, C2, C3 | Viết và kiểm chứng màn 1; vẽ ba khung họa tiết |
| Giao diện: màn chơi và bản đồ | F1, F2, F3, F4, F5 | Bộ máy màn và hoạt động ghim bản đồ |
| Giao diện: photobooth và hộ chiếu | F7, F8, F9 | Camera và ghép khung trên canvas, thử ngay trên iPhone |
| Backend và AI | B1 đến B6, I1 đến I3, C4 | Triển khai Cloud Run và `/api/judge` với một rubric |

Đội ít hơn bốn người thì gộp hai vai giao diện và lùi tour 5 phút xuống sau photobooth.

### Việc cần xác minh trước khi code

- [ ] Thể lệ, tiêu chí chấm, thời lượng và hạn nộp trong sổ tay thí sinh DevFest 2026
- [ ] Tên mô hình Gemini hiện hành, hạn mức cho đầu vào âm thanh và Live API
- [ ] Độ chính xác định vị thực tế tại hai điểm (một ngoài trời, một trong bảo tàng) để chốt bán kính
- [ ] Camera và micro trên iOS Safari qua HTTPS
- [ ] Địa điểm và lịch diễn bài chòi tại Đà Nẵng; quy định chụp ảnh trong bảo tàng
- [ ] Phạm vi hành chính hiện hành nếu đưa Hội An, Mỹ Sơn vào nội dung
- [ ] Giấy phép của mọi ảnh và họa tiết

## 12. Rủi ro và phương án dự phòng

Các rủi ro mới so với bản đặc tả v1.0 chủ yếu đến từ hai thay đổi lớn: Gemini chấm bài và check-in theo vị trí. Các rủi ro cũ (Gemini chậm, tách nền yếu, mạng kém, sai sót lịch sử) giữ nguyên phương án trong mục 9 của bản đó.

| Rủi ro | Mức | Phương án |
| --- | --- | --- |
| Gemini chấm không nhất quán giữa hai lần nộp giống nhau | Cao | Nhiệt độ 0, thang 0 đến 3 thô, server cộng điểm; điểm này chỉ ra sao, không vào bảng xếp hạng; thử 20 bài mẫu cho mỗi rubric trước demo |
| Người chơi chèn chỉ dẫn vào bài làm để xin điểm | Trung bình | Bài làm đặt trong khối dữ liệu riêng, prompt yêu cầu bỏ qua chỉ dẫn trong đó; server kiểm tra điểm nằm trong 0 đến 3 |
| Gemini khen một chi tiết lịch sử sai trong bài làm | Cao | Tiêu chí "không trái với kho tri thức" có mặt trong mọi rubric; câu bổ sung chỉ lấy từ kho tri thức; phần mở khóa tri thức cố định luôn hiện sau trạm |
| Định vị sai trong nhà hoặc giữa phố đông | Cao | Bán kính riêng từng điểm, đo thử tại chỗ; cho thử lại; mã QR ở giai đoạn sau |
| Không trình diễn được check-in vì hội trường không phải điểm tham quan | Cao | Cờ demo giả lập vị trí; quay sẵn một video check-in thật tại Bảo tàng Chăm hoặc Thành Điện Hải để chiếu kèm |
| Người dùng ngại cấp quyền vị trí, micro, camera | Trung bình | Chỉ xin đúng lúc cần kèm lý do; mọi trạm nói có lựa chọn gõ; từ chối vị trí thì vẫn dùng được kiểu từ xa |
| Âm thanh và bài làm của người dùng đi qua server | Trung bình | Nói rõ trước khi gửi; không lưu sau khi chấm; không ghi nội dung bài vào log |
| Phạm vi quá lớn: sáu màn, tour, photobooth | Cao | Chỉ ba màn P0; bộ máy màn và thư viện hoạt động dùng chung nên màn thêm chủ yếu là việc nội dung |
| Chi phí và hạn mức Gemini khi nhiều người nộp bài | Trung bình | Giới hạn số lần nộp mỗi trạm, giới hạn độ dài bài và 20 giây ghi âm, cảnh báo ngân sách |

## 13. Kịch bản demo

Demo ba phút đi theo đúng vòng sản phẩm: nghe, làm, thể hiện, đến nơi; chỉnh thời lượng theo quy định trong sổ tay.

| Thời điểm | Thao tác | Điểm nhấn |
| --- | --- | --- |
| 0:00 đến 0:20 | Nêu vấn đề: sản phẩm số về Đà Nẵng hiện có là xem một chiều; văn hóa cần được làm thử | Khoảng trống |
| 0:20 đến 0:50 | Giám khảo chọn "3 phút, lịch sử"; tour phát, camera bay đến Bảo tàng Chăm | Gemini soạn lời kể từ kho tri thức; Google Maps |
| 0:50 đến 1:30 | Vào màn "Dấu ấn Chăm": ghép mảnh phù điêu | Hoạt động cố định, code chấm |
| 1:30 đến 2:10 | Mời một giám khảo nói 20 giây giới thiệu hiện vật, hoặc hô một câu bài chòi; hiện điểm từng tiêu chí và nhận xét | Gemini chấm theo rubric, có dẫn căn cứ |
| 2:10 đến 2:40 | Bật cờ demo, check-in tại Bảo tàng Chăm, chụp ảnh với khung hoa văn; chiếu 5 giây video check-in thật | Ảnh xử lý trên máy; kéo người đến điểm thật |
| 2:40 đến 3:00 | Mở hộ chiếu có ba loại dấu; một slide kiến trúc và giá trị cho thành phố | Cloud Run, Gemini, Maps; dữ liệu cho ngành du lịch |

### Câu hỏi giám khảo có thể hỏi

| Câu hỏi | Trả lời |
| --- | --- |
| Gemini có bịa lịch sử không? | Gemini không viết nội dung màn. Nó kể và chấm dựa trên kho tri thức đã kiểm chứng, có nguồn |
| Vì sao không để AI tạo câu hỏi? | Lịch sử địa phương cần đúng và giống nhau với mọi người chơi. AI được dùng ở việc code không làm được: nghe, đọc và nhận xét bài làm mở |
| Chấm bằng AI có công bằng không? | Rubric cố định, thang điểm thô, có dẫn căn cứ; điểm này chỉ ra sao, bảng xếp hạng dùng điểm code |
| Check-in có gian lận được không? | Có thể giả lập vị trí; dấu là kỷ niệm. Bước sau là mã QR tại điểm khi hợp tác với đơn vị quản lý |
| Ảnh và giọng nói của người dùng đi đâu? | Ảnh không rời máy. Bài nói chỉ gửi đi để chấm và không lưu |
| Thành phố được gì? | Khách biết và đến các điểm văn hóa ít người ghé; số liệu ẩn danh theo điểm; nội dung dùng được cho giáo dục địa phương |
| Mở rộng thế nào? | Thêm màn là thêm dữ liệu vào hai file JSON; bộ máy màn, giám khảo và photobooth dùng lại |

## Nguồn

- "Đặc tả sản phẩm và yêu cầu công nghệ" v1.0 của team, ngày 13/11/2026 (file .docx bạn gửi).
- Sổ tay thí sinh DevFest 2026: chưa đọc được nội dung, nên kế hoạch chưa đối chiếu với thể lệ và tiêu chí chấm.

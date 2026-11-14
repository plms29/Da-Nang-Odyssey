# Kế hoạch: hoàn thành Khám phá, đủ 6 màn và cốt truyện (2026-11-14)

Chủ máy đã chốt: làm **đủ 6 màn**; cốt truyện xuyên suốt có **người dẫn đường**; nội dung lịch sử do phiên chính viết từ kiến thức phổ biến, kèm nguồn công khai, **giữ `status: draft`** để đội nội dung kiểm chứng.

## Cốt truyện
Người dẫn đường là **Hàn**, cháu của một người lái đò già trên sông Hàn. Ông Hàn có cuốn **"Sổ tay sông Hàn"** gồm 6 trang, mỗi trang ghi về một nét văn hóa. Một đêm gió mùa, sáu trang bị gió cuốn đi, mỗi trang rơi xuống một nơi. Người chơi đi cùng Hàn tìm lại từng trang:
1. Dấu ấn Chăm → 2. Giữ thành → 3. Hô bài chòi → 4. Bàn tay làng nghề → 5. Vị Quảng → 6. Thành phố bên sông.
Truyện dẫn của mỗi màn mở bằng lời Hàn. Phần tri thức cuối màn là "trang sổ tay tìm lại được" và nhá trước màn sau. Có đoạn mở đầu trên trang `/kham-pha` và đoạn kết hiện ra khi xong cả 6 màn (sổ tay lành lại).

## Phiên chính làm (nội dung + giao kèo, không phải code giao diện)
- **C1 Nội dung**: `content/spots.json` thêm 3 điểm (làng đá Non Nước, chợ Hàn/mì Quảng, cầu Rồng). `content/levels.json` viết thật cả 6 màn: truyện dẫn, manh mối, tọa độ, 3 gợi ý, đáp án, rubric, phần tri thức, nguồn. Thêm `content/story.json` (người dẫn đường, mở đầu, kết).
- **C2 Giao kèo**: trong `lib/types.ts` thêm `RecipeStation` (chọn đúng nguyên liệu và xếp đúng thứ tự, có nguyên liệu nhiễu) và `SpotDiffStation` (hai ảnh xưa/nay, các điểm khác nhau tính bằng tọa độ %). `JudgeRequest.image?` để chấm bài vẽ. Trong `lib/activities/scoring.ts` thêm `checkRecipe`, `checkSpotDiff`. `lib/story.ts` thêm `isLevelUnlocked`, `pagesFound`. Gemini chấm ảnh có đường dự phòng; cập nhật `scripts/validate-content.mjs`. Viết test cho mọi phần trên.
- **C3 Nối dây**: thêm hai `case` vào `LevelPlayer` và hai file trạm rỗng (chỉ có props) để worker điền vào.

## Worker (argon hết hạn mức đến khoảng 18/11, nên dùng hydrogen)
| Task | File (chỉ sửa) | Worker |
|---|---|---|
| W1 Trạm "Nấu" (RecipeStation): chọn nguyên liệu vào tô, xếp thứ tự, nút Kiểm tra, rung/nảy, gợi ý | `components/level/stations/RecipeStation.tsx` | ui-hydrogen-high |
| W2 Trạm "Xưa và nay" (SpotDiffStation): hai tranh SVG vẽ tay bờ sông Hàn xưa/nay, chạm vào chỗ đã đổi, đếm số chỗ tìm được | `components/level/stations/SpotDiffStation.tsx`, `public/scenes/do-thi-song-le-hoi/xua.svg`, `nay.svg` | ui-hydrogen-high |
| W3 Bảng vẽ cho `open_drawing`: canvas vẽ bằng ngón tay/chuột, có hoa văn mẫu, nút xóa, gửi ảnh PNG đi chấm | `components/level/stations/ExpressStation.tsx`, `components/level/DrawingPad.tsx` (mới), `public/patterns/hoa-van-song.svg` | ui-hydrogen-high |
| W4 Cốt truyện trên `/kham-pha`: thẻ Hàn + mở đầu, thanh "đã tìm x/6 trang", thẻ màn bị khóa đến khi xong màn trước, đoạn kết khi đủ 6 | `app/kham-pha/page.tsx`, `components/shell/LevelCard.tsx`, `components/story/*` (mới) | ui-hydrogen |
| W5 Scene kit cho 3 chủ đề mới (lang-nghe, am-thuc, do-thi-song-le-hoi) bằng lớp SVG | `lib/scene/kits/*`, `public/scenes/lang-nghe/*`, `public/scenes/am-thuc/*` | ui-hydrogen |

Mọi agent `ui-*` gọi với `model: "haiku"` (chỉ điều phối, Gemini viết code); `reviewer` giữ `sonnet`.
Các task W1–W5 không sửa chung file nên chạy song song, sau khi C1–C3 xong. Mỗi task có `reviewer` chấm, tối đa 2 vòng sửa.
Điều kiện chấp nhận: `npx tsc --noEmit`, `npx eslint app components lib scripts`, `npx vitest run`, `node scripts/validate-content.mjs` đều qua; chơi hết 6 màn trên trình duyệt ở 375px và 1440px.

**Kết quả (2026-11-14):** W1–W5 xong, reviewer duyệt cả 5 (W1, W2, W4 qua 1–2 vòng sửa; W5 phiên chính bỏ lớp cầu Rồng trùng và thêm preset trời). Kiểm trên trình duyệt: màn 4 chơi trọn (sắp xếp, vẽ, chấm dự phòng, sao, dấu), màn 5 trạm Nấu, màn 6 trạm Xưa và nay ở 1024px và 375px, đoạn kết khi đủ 6 trang. tsc, eslint, 130 test, validate-content, next build qua.
Còn mở: tiêu đề thẻ màn chạy lại hiệu ứng một lần sau khi tải trang với người chơi cũ (LevelCard đổi cây bọc khi mở khóa, chỉ thẩm mỹ); nút Hoàn tác khi vẽ nhiều ngón (nit); chưa kiểm màn 1–3 sau khi thay nội dung, chưa thử Gemini chấm ảnh thật (máy không có khóa).

**Không làm trong đợt này** (ghi lại để làm sau): trò phụ "kéo hiện vật về đúng phòng" (màn 1) và "gõ theo nhịp" (màn 3); trạm Tìm có hai ghim (màn 4 chỉ ghim làng đá, làng Nam Ô nhắc trong truyện); ảnh thật cho trò ghép hình; tranh AI cho 3 kit mới (đợi hạn mức ảnh); chặn mở màn khóa bằng đường dẫn trực tiếp (chỉ khóa trên danh sách).

---

# Kế hoạch: làm đẹp /tour + bản máy tính (mục 3.3 báo cáo)

Mẫu phong cách: trang chủ/màn chơi hiện có (`components/fx/*`: Glass, GlowButton, TiltCard, KineticText, PhaseTransition, StampPress, Celebrate, ShaderBackdrop; `components/level/LevelPlayer.tsx` cho bố cục máy tính `lg:` 2 cột, cảnh trái sticky).
Quy tắc chung: không đổi logic (`tourReducer`, `useSpeech`, fetch kế hoạch, đóng dấu hộ chiếu, link); tôn trọng reduced-motion; điện thoại giữ bố cục 1 cột, máy tính từ `lg:`.
Chấp nhận: tsc, eslint, vitest qua; reviewer duyệt.

| Task | File (chỉ sửa) | Worker |
|---|---|---|
| T5 Bản đồ sông Hàn vẽ tay (SVG): thuyền chạy dọc sông giữa các điểm, điểm đang nghe sáng lên; dùng khi không có khóa Maps (thay thanh tiến độ) | `components/tour/TourRiverMap.tsx` (mới), `components/tour/TourMap.tsx` | ui-hydrogen-high |
| T6 Màn chọn tour: kính, chip chủ đề phát sáng, nút GlowButton; trang + TourApp rộng ra ở máy tính | `components/tour/TourSetup.tsx`, `components/tour/TourApp.tsx`, `app/tour/page.tsx` | ui-hydrogen |
| T7 Trình phát: panel kính, phụ đề câu đang đọc nổi bật (KineticText), chuyển cảnh giữa điểm (PhaseTransition); máy tính 2 cột (bản đồ trái sticky, phụ đề phải) | `components/tour/TourPlayer.tsx`, `components/tour/TourStopStation.tsx` | ui-hydrogen-high |
| T8 Kết tour: con dấu StampPress cho mỗi điểm đã nghe + Celebrate | `components/tour/TourEnd.tsx` | ui-hydrogen |

T5–T8 không chung file → chạy song song. /photobooth làm đợt sau.

---

# Kế hoạch tiếp nối (từ BAO-CAO-TIEP-NOI.md)

Mẫu tham chiếu chung: `components/level/stations/MatchStation.tsx` và `HintBox` (đã có đủ hiệu ứng).
Quy tắc chung cho T1–T4: đúng/sai chỉ hiện sau khi bấm "Kiểm tra"; rung bằng `useAnimate` (không đổi `key`);
không đổi cách tính điểm, đếm gợi ý, payload `onDone`; nút kiểm tra là `GlowButton`; gọi `haptic()`; vòng sáng vàng khi chọn.
Chấp nhận: `npx tsc --noEmit`, `npx eslint components`, `npx vitest run` đều qua.

| Task | File (chỉ sửa file này) | Worker |
|---|---|---|
| T1 Hiệu ứng ExpressStation | `components/level/stations/ExpressStation.tsx` | ui-hydrogen |
| T2 Hiệu ứng JigsawStation (dnd-kit) | `components/level/stations/JigsawStation.tsx` | ui-hydrogen-high |
| T3 Hiệu ứng MapPinStation (bản đồ thật) | `components/level/stations/MapPinStation.tsx` | ui-hydrogen-high |
| T4 Hiệu ứng OrderStation | `components/level/stations/OrderStation.tsx` | ui-hydrogen |

T1–T4 chạy song song (không chung file). Sau mỗi task: `reviewer`, tối đa 2 vòng sửa.

Giai đoạn sau (xin duyệt riêng khi tới): T5 làm đẹp `/tour` + bản máy tính, T6 `/photobooth`, T7 dọn nit nhỏ, kiểm trình duyệt 375px/1440px.
(argon hết hạn mức → dùng hydrogen/flash.)

---

# plan.md

## Giai đoạn B, đợt B3: Tour 5 phút + chú thích ảnh (KH mục 5, mục 6 CK-08, mục 11 giai đoạn 3)

Mục tiêu: "tour 3 phút chạy hết, có giọng đọc" (mục "Không cắt" của KH). Người dùng chọn thời lượng và chủ đề →
nghe từng điểm dừng có phụ đề, camera bản đồ bay tới điểm → cuối mỗi điểm một trạm Làm ngắn có nút "Để sau" →
kết tour: dấu "đã nghe", mời chơi trọn màn, nút "Chỉ đường đến đây". Thêm chú thích ảnh check-in (CK-08).

**Cắt khỏi B3 (theo thứ tự cắt của KH):** hỏi bằng giọng nói Live API (B4) và cả hỏi bằng chữ (cần endpoint riêng, để B4);
dải 3 khung; tách nền MediaPipe; audio Gemini TTS dựng sẵn (cần tên model và ngân sách, để lúc có khóa).
Giọng đọc B3 dùng `speechSynthesis` của trình duyệt (dự phòng P0 trong KH mục 7); Spot có thể kèm file audio dựng sẵn thì ưu tiên phát file.

**Worker:** `ui-argon` còn hết quota đến khoảng 18/11, nên mọi task UI chạy trên `ui-hydrogen-high` / `ui-hydrogen`.
Không đụng file của nhánh `ui-dong` ngoài `app/tour/page.tsx` (U-task không sửa file này).

Giao kèo mới (T15 tạo, worker không đổi):
- `Spot.narration_audio?: string` (đường dẫn trong `/public`, tùy chọn); `scripts/validate-content.mjs` chấp nhận trường này.
- `lib/content.ts` thêm `levelForSpot(spotId): Level | undefined` (màn đầu tiên có `spot_ids` chứa điểm đó).
- `lib/types.ts` thêm `TourRequest { seconds: number; themes: Theme[] }`, `CaptionResult { caption: string; generated_by: "gemini" | "fallback" }`.
- Ngân sách lời kể: `NARRATION_WORDS_PER_SECOND = 2.2` trong `lib/tour/config.ts` (tiếng Việt đọc khoảng 130 từ/phút).
- Chữ ký chung cho T19/T20 (T19 viết, T20 chỉ import):
  - `lib/tour/player.ts`: `type TourPhase = "setup" | "loading" | "stop" | "activity" | "end"`; `interface TourState { phase; plan: TourPlan | null; stopIndex: number; activityDone: Record<string, "done" | "skipped"> }`;
    `type TourAction = { type: "load" } | { type: "loaded"; plan: TourPlan } | { type: "narrationEnded" } | { type: "activityDone"; spotId: string } | { type: "activitySkipped"; spotId: string } | { type: "next" } | { type: "skipStop" } | { type: "restart" }`;
    `initialTour(): TourState`, `tourReducer(state, action): TourState`, `listenedSpotIds(state): string[]` (điểm đã nghe hết lời kể).
  - `lib/tour/subtitles.ts`: `splitSentences(text: string): string[]`, `sentenceTimings(sentences: string[], totalSeconds: number): number[]` (thời điểm bắt đầu mỗi câu theo tỉ lệ độ dài).
  - `components/tour/useSpeech.ts`: `useSpeech(): { supported: boolean; speak(sentences: string[], opts: { onSentence(i: number): void; onEnd(): void }): void; pause(): void; resume(): void; cancel(): void; speaking: boolean }`.

| # | Task | Worker | File sở hữu | Phụ thuộc |
|---|------|--------|-------------|-----------|
| T15 | Giao kèo trên: sửa `lib/types.ts`, `lib/content.ts`, `lib/tour/config.ts`, `scripts/validate-content.mjs`; test cho `levelForSpot` | **Claude (main)** | các file đó, `lib/content.test.ts` | — |
| T16 | B3 người kể chuyện: `lib/tour/narrate.ts` gọi Gemini (khi có `GEMINI_API_KEY` + `GEMINI_MODEL`): vào = các điểm đã chọn + `story` của từng điểm + số giây → ra JSON `{stops:[{spot_id, narration, transition}]}`; số từ mỗi điểm ≤ `seconds × NARRATION_WORDS_PER_SECOND × 1.15`; kiểm tra: đủ mọi `spot_id` đúng một lần, cắt độ dài, mọi chữ số trong lời kể phải có trong `story` của điểm đó (chống bịa số liệu), nếu lệch thì dùng `narration_fallback` của điểm đó; timeout 8 giây rồi trả `fallbackPlan`; chống chèn lệnh (story là dữ liệu của server nhưng vẫn đặt trong khối dữ liệu); `app/api/tour/plan/route.ts` gọi `narrate`, trả `generated_by`; test không gọi mạng | `ui-hydrogen-high` | `lib/tour/narrate.ts`, `lib/tour/narrate.test.ts`, `app/api/tour/plan/route.ts` | T15 |
| T17 | B5 chú thích ảnh: `POST /api/caption` `{spot_id}` → `CaptionResult`; Gemini viết một câu dưới 20 từ từ `story` của điểm (không nhận ảnh), timeout 8 giây rồi `caption_fallback`; kiểm tra ≤ 20 từ và không có chữ số lạ; spot_id lạ → 400; test không gọi mạng | `ui-hydrogen` | `lib/caption/*`, `app/api/caption/route.ts` | T15 |
| T18 | F7/F8 chú thích: `PhotoBooth` nhận `caption?: string` và vẽ dưới tên điểm (xuống dòng, thu nhỏ khi dài); `OnsiteBooth` sau khi vào chế độ chụp gọi `/api/caption` (dự phòng: `spot.caption_fallback` dịch ngay phía client, không chờ quá 8 giây), cho người dùng giữ, sửa (ô gõ ≤ 100 ký tự) hoặc bỏ; chỉ mã điểm gửi lên, ảnh không rời máy (CK-06) | `ui-hydrogen-high` | `components/photobooth/*`, `components/checkin/OnsiteBooth.tsx` | T17 (chỉ cần hình dạng API ở trên) |
| T19 | F6 phần logic: `lib/tour/player.ts` + test (đường đi đủ setup → loading → stop → activity → … → end; bỏ qua điểm; khởi động lại), `lib/tour/subtitles.ts` + test, `components/tour/useSpeech.ts` (chọn giọng `vi-VN`; cắt lời kể theo câu để tránh lỗi Chrome tự dừng sau ~15 giây; nếu không có giọng thì tự chạy phụ đề theo `sentenceTimings`; hủy khi rời trang/unmount; `onEnd` gọi đúng một lần) | `ui-hydrogen-high` | `lib/tour/player.ts`, `lib/tour/player.test.ts`, `lib/tour/subtitles.ts`, `lib/tour/subtitles.test.ts`, `components/tour/useSpeech.ts` | T15 |
| T20 | F6 giao diện: `app/tour/page.tsx` + `components/tour/*`: **TourSetup** (3/5/10 phút, chip chủ đề, nút "Bắt đầu tour"); **TourPlayer** dùng `tourReducer` + `useSpeech`: lấy kế hoạch bằng `fetch('/api/tour/plan')` có hủy sau 9 giây, quá hạn hoặc lỗi thì tự dựng `fallbackPlan(pickStops(...))` ngay trên máy; điểm dừng hiện tên điểm, ảnh, phụ đề câu đang đọc, nút Tạm dừng/Tiếp/Nghe lại/Bỏ qua điểm; phát `spot.narration_audio` nếu có, nếu không dùng giọng trình duyệt; **TourMap**: có khóa Maps thì camera bay (`moveCamera`/`panTo` + zoom) tới `spot.checkin` của điểm đang nghe và đánh dấu các điểm của tuyến, không có khóa thì thanh tiến độ các điểm dừng; **TourStopStation**: cuối điểm dừng hiện trạm Làm của `levelForSpot(spot.id)` (tái dùng component trong `components/level/stations/*`, chỉ cho `jigsaw`/`order`/`match`; không có thì bỏ qua) với nút "Để sau"; **kết tour**: `usePassport.getState().stamp(id, "tour")` đúng một lần cho mỗi điểm trong `listenedSpotIds`, danh sách điểm đã nghe, link "Chơi trọn màn" tới `/kham-pha/{levelId}`, "Chỉ đường đến đây" (Google Maps dir) và "Check-in" tới `/photobooth?spot={id}`; không đọc store trong lúc render trước hydrate | `ui-hydrogen-high` | `app/tour/page.tsx`, `components/tour/*` (trừ `useSpeech.ts`) | T15, chữ ký của T19 |

T15 làm trước. Sau đó T16, T17, T19, T20 chạy song song (file không chồng nhau); T18 chạy khi T17 xong.
Worker không chạy shell; phiên chính chạy tsc, lint, test, build và thử `/tour` trên trình duyệt (giọng đọc `speechSynthesis` thử được ngay; bản đồ cần khóa).
Review: `reviewer` (sonnet), tối đa 2 vòng sửa. Review T16 và T17 kiểm kỹ bảo mật prompt (như T4, T14).

**Cần xác minh:** có giọng `vi-VN` trên iPhone và Android thật không (iOS thường có "Linh"); Gemini có giữ đúng số giây theo số từ không (thử 20 lần);
điểm nào ngoài 3 điểm P0 sẽ vào tour 5 và 10 phút (hiện chỉ có 3 điểm, nên tour 10 phút = 3 điểm cho đến khi đội nội dung thêm điểm).

---

## Giai đoạn B, đợt B2 (đã xong): Bản đồ, kéo thả, trạm hô bằng giọng nói (KH mục 11, giai đoạn 3 phần màn chơi)

Mục tiêu: ba màn P0 chơi được đúng như KH mục 4. Trạm Tìm ghim trên Google Maps thật; trạm Làm kéo thả;
trạm hô bài chòi ghi âm tối đa 20 giây và được Gemini chấm (KH mục 7, dòng "Chấm trạm Thể hiện (giọng nói)").
Tour 5 phút (F6, B3) để đợt B3.

**Xung đột với nhánh `ui-dong`** (`plan-ui-dong.md`, task U6, U7): U7 sửa `components/level/stations/*` và `HintBox.tsx`,
U6 sửa `LevelPlayer.tsx`. B2 sửa các trạm trước; U7 phải làm sau khi B2 vào `main` (rebase nhánh `ui-dong`),
và chỉ thêm lớp hiệu ứng lên các component kéo thả/bản đồ mới, không thay cách tương tác.

Giao kèo mới (T10 tạo, worker không đổi):
- `JudgeRequest` thêm `audio?: { mime: string; data_base64: string }` (có `audio` thì `text` có thể rỗng);
  `JudgeResult` thêm `transcript?: string`.
- Biến môi trường `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Không có khóa thì trạm Tìm giữ ô nhập tọa độ + nút demo hiện tại.
- Âm thanh không được lưu, không ghi log; server chỉ chuyển cho Gemini rồi bỏ.

| # | Task | Worker | File sở hữu | Phụ thuộc |
|---|------|--------|-------------|-----------|
| T10 | Sửa giao kèo trên trong `lib/types.ts`; cài `@dnd-kit/core`, `@dnd-kit/sortable`, `@types/google.maps` (dev); thêm khóa Maps vào `.env.example` | **Claude (main)**: giao kèo | `lib/types.ts`, `package.json`, `.env.example` | — |
| T11 | F2 bản đồ: nạp Maps JS API bằng thẻ script (không thêm thư viện), `MapView` có marker, chạm để ghim, nút "Xác nhận ghim"; `MapPinStation` dùng bản đồ khi có khóa, giữ cách cũ khi không; chấm vẫn bằng `checkMapPin` | `ui-argon` | `components/map/*`, `components/level/stations/MapPinStation.tsx` | T10 |
| T12 | F4 kéo thả: ghép mảnh và xếp thứ tự bằng dnd-kit (sortable, cảm biến chạm + bàn phím có thông báo tiếng Việt cho trình đọc màn hình); giữ nút ▲/▼ ở trạm xếp thứ tự; chấm vẫn bằng `checkJigsaw`/`checkOrder` | `ui-argon` | `components/level/stations/JigsawStation.tsx`, `OrderStation.tsx` | T10 |
| T13 | F5 ghi âm: `VoiceRecorder` (MediaRecorder, xin micro khi bấm, tự dừng ở `max_seconds`, nghe lại, ghi lại), gửi `audio` base64 tới `/api/judge`; luôn có lựa chọn gõ chữ; hiện `transcript` khi có; câu báo trước "Đoạn ghi âm chỉ gửi đi để chấm và không lưu lại" | `ui-hydrogen-high` | `components/level/VoiceRecorder.tsx`, `components/level/stations/ExpressStation.tsx` | T10 |
| T14 | B2 chấm giọng nói: route nhận `audio` (danh sách mime cho phép, giới hạn kích thước theo `max_seconds`, nâng trần content-length cho riêng âm thanh); `gradeWithGemini` gửi âm thanh dạng `inline_data`, schema thêm `transcript`; chỉ có âm thanh mà Gemini lỗi/không có khóa → 422 "Chưa chấm được giọng nói, bạn gõ chữ nhé"; test không gọi mạng | `ui-hydrogen-high` | `lib/judge/*`, `app/api/judge/route.ts` | T10 |

T11–T14 chạy song song sau T10 (file không chồng nhau). Worker không chạy shell; phiên chính chạy tsc, lint, test, build, thử trên trình duyệt.
Review: `reviewer` (sonnet), tối đa 2 vòng sửa.

**Cần xác minh (KH mục 11):** định dạng âm thanh Gemini nhận (Chrome ghi `audio/webm;codecs=opus`, iOS Safari ghi `audio/mp4`);
hạn mức đầu vào âm thanh; khóa Maps (bạn tạo, giới hạn theo domain Cloud Run). Micro và Maps chỉ thử được thật trên điện thoại qua HTTPS.

---

## Giai đoạn B, đợt B1 (đã xong): Photobooth check-in + hộ chiếu + hạ tầng (KH mục 11, giai đoạn 2)

Giai đoạn A đã xong (xem `BAO-CAO-KHUNG-SUON.md`). Đợt B1 làm "Kết quả phải có" của giai đoạn 2:
ảnh check-in có khung và dấu, tải về được.

Giao kèo mới (worker không được đổi):
- `components/photobooth/PhotoBooth.tsx` export `PhotoBooth({ spot, mode, onCaptured })`,
  `mode: "onsite" | "remote"`, `onCaptured(blob: Blob)` gọi khi người dùng bấm "Dùng ảnh này".
- Chỉ trang check-in gọi `usePassport.getState().stamp(spot.id, "visited")`, và chỉ ở mode `onsite`.
- Đọc store hộ chiếu trong giao diện phải chờ hydrate xong (`usePassport.persist.hasHydrated()` / `onFinishHydration`).

| # | Task | Worker | File sở hữu | Phụ thuộc |
|---|------|--------|-------------|-----------|
| T6 | F9 trang hộ chiếu: đọc store sau khi hydrate, lưới điểm với 3 loại dấu (màn, đã nghe, đã đến vàng), sao từng màn, tổng điểm code, trạng thái rỗng | `ui-hydrogen` | `app/ho-chieu/page.tsx`, `components/passport/*` | — |
| T7 | F7 photobooth: camera trước/sau (getUserMedia), khung 9:16, đếm ngược 3 giây, chụp, xem lại/chụp lại; ghép trên canvas: khung họa tiết theo chủ đề (vẽ bằng code khi chưa có PNG, CK-04), tên điểm, ngày, dấu "ĐÃ ĐẾN" (onsite) hoặc "GHÉ THĂM TRỰC TUYẾN" (remote); chờ `document.fonts.ready` trước khi vẽ chữ (CK-05); tải về + Web Share; ảnh không rời máy (CK-06). Kiểu remote ở đợt này: khung viền không tách nền (CK-07 dạng tối thiểu) | `ui-argon-high` | `components/photobooth/*` | — |
| T8 | F8 luồng check-in ở `/photobooth`: câu giải thích trước khi xin quyền vị trí, `getCurrentPosition`, `locateSpot`, cờ `?demo=spot_id` (CK-03); trong bán kính → `PhotoBooth` onsite + ghi dấu visited; ngoài bán kính → "còn cách khoảng X m", nút chỉ đường Google Maps, mời kiểu từ xa (chỉ khi đã có dấu màn/tour của điểm); sai số lớn → thử lại (CK-02); từ chối quyền → vẫn dùng kiểu từ xa | `ui-hydrogen-high` | `app/photobooth/page.tsx`, `components/checkin/*` | T7 (giao kèo trên, làm song song được) |
| T9 | I1: `output: "standalone"`, Dockerfile, `.dockerignore`, GitHub Actions chạy validate + test + build; hướng dẫn deploy Cloud Run asia-southeast1 + Secret Manager | **Claude (main)**: hạ tầng, không phải UI | `Dockerfile`, `.github/workflows/ci.yml`, `next.config.ts`, `DEPLOY.md` | — |

T6, T7, T8, T9 chạy song song (file không chồng nhau). Worker không chạy shell; phiên chính chạy tsc, lint, test, build và thử trên trình duyệt.
Review: `reviewer` (sonnet) cho mỗi task, tối đa 2 vòng sửa.
Ngoài đợt B1: bản đồ Maps, kéo thả, ghi âm, tour (đợt B2, B3), MediaPipe, Firestore.

---

# Giai đoạn A: Khung sườn sản phẩm (đã xong)

Nguồn: `Kế hoạch sản phẩm Hành trình văn hóa Đà Nẵng (DevFest 2026).md` (gọi tắt KH).
Mục tiêu giai đoạn A: mọi route và mọi "giao kèo" giữa module (KH mục 9) tồn tại và chạy được
end-to-end bằng dữ liệu giữ chỗ và đường dự phòng (chưa cần Gemini key, chưa cần Maps key).
Xong giai đoạn A → viết `BAO-CAO-KHUNG-SUON.md` → sang giai đoạn B (build tính năng thật).

## Stack (chốt)
Next.js 15 App Router + TypeScript + Tailwind v4, Zustand (persist localStorage), Vitest.
Một app chạy cả giao diện và API (khớp KH I1: một service Cloud Run). Thư mục gốc: `app/` (repo root).
Chữ hiển thị tiếng Việt. Mobile-first, khung tối đa 480px giữa màn hình.

## Giao kèo dùng chung (T0 tạo, worker KHÔNG được sửa)
- `lib/types.ts`: `Spot`, `Level`, `Station` (union theo `type`), `StationResult {correct, score, hints_used}`,
  `JudgeResult` (KH mục 10), `StampKind = 'level' | 'tour' | 'visited'`.
- `content/spots.json`, `content/levels.json`: 3 điểm + 3 màn P0, nội dung giữ chỗ, `status: "draft"`.
- `lib/content.ts`: `getSpots()`, `getSpot(id)`, `getLevels()`, `getLevel(id)`.
- `spot_id` là khóa chung; F9 là nơi duy nhất ghi tiến độ (`stamp(spotId, kind)`).

## Task

| # | Task | Worker | File sở hữu | Phụ thuộc |
|---|------|--------|-------------|-----------|
| T0 | Scaffold Next.js, cài deps, git init, types, content JSON, content loader, script kiểm tra nội dung (C4) | **Claude (main)** — nền móng, sai là kéo sai cả đội | `package.json`, `lib/types.ts`, `lib/content.ts`, `content/*`, `scripts/validate-content.mjs` | — |
| T1 | F1 vỏ ứng dụng: layout, design tokens, trang chủ 3 lối vào + hộ chiếu, thanh điều hướng dưới, trang giữ chỗ cho mọi route | `ui-argon` | `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `components/shell/*`, `app/kham-pha/page.tsx`, `app/tour/page.tsx`, `app/photobooth/page.tsx`, `app/ho-chieu/page.tsx` | T0 |
| T2 | F3 bộ máy màn (máy trạng thái thuần) + F4 hàm chấm thuần cho `map_pin`, `jigsaw`, `order` (luật điểm KH mục 4) + test | `ui-hydrogen-high` | `lib/level/*`, `lib/activities/*` | T0 |
| T3 | F9 hộ chiếu (Zustand persist, `stamp`, sao, điểm code) + F8 vị trí (haversine, chọn điểm gần nhất trong bán kính, từ chối khi accuracy > radius, cờ demo `?demo=spot_id`) + test | `ui-hydrogen-high` | `lib/passport/*`, `lib/geo/*` | T0 |
| T4 | B2 `POST /api/judge` (fallback chấm theo `must_include` bằng code; gọi Gemini chỉ khi có `GEMINI_API_KEY`, timeout 8s → fallback; server tự cộng điểm, kẹp 0–3), `GET /healthz`, `POST /api/tour/plan` chọn điểm theo luật + kịch bản dựng sẵn | `ui-hydrogen-high` | `app/api/**`, `app/healthz/route.ts`, `lib/judge/*`, `lib/tour/*` | T0 |
| T5 | Trang chơi màn `/kham-pha/[levelId]`: nối F3 + F4, component trạm giữ chỗ (ghim = nhập tọa độ/nút, ghép/xếp = danh sách bấm), trạm Thể hiện dạng chữ gọi `/api/judge`, kết màn ghi `stamp` | `ui-hydrogen` | `app/kham-pha/[levelId]/*`, `components/level/*` | T1–T4 |

T1–T4 chạy song song (file không chồng nhau). T5 chạy sau.

## Review
- `reviewer` chạy cho mỗi task xong (override model `sonnet` để đỡ tốn token; lỗi khó mới dùng opus).
- BLOCKER/SHOULD-FIX gửi lại đúng worker, tối đa 2 vòng; sau đó báo lại.
- Claude (main) chỉ: T0, đọc kết quả review, chạy `npm run build && npm test` cuối giai đoạn, viết báo cáo.

## Tiêu chí xong giai đoạn A
- `npm run build`, `npm test`, `npm run validate` đều qua.
- Mở `/` trên khung 375px: thấy 3 lối vào + hộ chiếu; mọi link tới route có thật.
- Chơi màn 1 từ đầu đến cuối bằng dữ liệu giữ chỗ, trạm Thể hiện trả kết quả `graded_by: "fallback"`, hộ chiếu có dấu `level`.
- `/healthz` trả 200.

## Ngoài phạm vi giai đoạn A (để giai đoạn B)
Bản đồ Google Maps thật, kéo-thả dnd-kit, ghi âm, camera/photobooth, MediaPipe, trình phát tour, Gemini Live,
Firestore, Cloud Run deploy, nội dung đã kiểm chứng.

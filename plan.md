# Kế hoạch giai đoạn F: gộp về main + tài khoản (tiến độ, giao diện, hồ sơ)

Chủ máy chốt (2026-11-14):
- **Lấy `main` làm gốc.** `main` đã có: 6 màn nội dung thật, trạm recipe/spot_diff/vẽ, cốt truyện "Sổ tay sông Hàn", khóa màn tuần tự (`lib/story.ts` `isLevelUnlocked`: xong màn trước thì mở màn sau), kit 3 thế giới mới bằng SVG, đăng nhập Google qua Supabase (`LoginGate`, `AccountPanel`) và đồng bộ hộ chiếu (`lib/supabase/sync.ts`, bảng `danang_progress`). Nhánh `claude/next-build-plan-af2ff9` chỉ mang sang phần `main` chưa có; **bỏ** nháp Màn 4–6, `Level.unlock` và khóa kiểu dữ liệu của nhánh này.
- **Theme theo tài khoản** gồm cả ba: (1) tiến độ đi theo tài khoản (màn, thế giới đã mở, dấu, hiệu ứng mở khóa đã xem), (2) chọn giao diện app trong các thế giới đã mở, (3) trang hồ sơ người chơi.

## F0. Nhánh mới từ main, mang phần còn thiếu sang (Claude, phiên chính)
- Tạo nhánh mới từ `main` (worktree riêng). Cherry-pick `e03aa62` (làm đẹp photobooth); sửa xung đột nếu có.
- Mang sang nguyên trạng (code đã review): `components/fx/ThemeScope.tsx`, `SceneKit.accent` + màu nhấn cho **mọi** kit (cả 3 kit SVG của main), `sceneIdForSpot`, prompt tranh trong `scripts/gen-scene-art.mjs`, tranh AI `public/scenes/lang-nghe/ai-*`, `am-thuc/ai-*` (chưa gắn vào kit của main; xem F4).
- Viết lại `lib/level/unlock.ts` thành lớp mỏng trên luật của main: `isSpotUnlocked`, `unlockedSpotIds`, `newlyUnlocked(levels, before, after)`, `requiredLevel` (= màn liền trước), `demoUnlockAll` (`?mo-khoa=tat-ca`), tất cả gọi `isLevelUnlocked` của `lib/story.ts`. Test lại.
- `pickStops(..., allowedIds?)` + `/api/tour/plan` nhận `spot_ids` (như E1).
- Chấp nhận: tsc, eslint, vitest, `validate-content` qua trên nhánh mới.

## F1. Dữ liệu tài khoản (Claude, phiên chính, song song F0b)
- `lib/prefs/store.ts` (zustand persist `dn-prefs`): `{ theme: SceneId; seen_unlocks: string[] }`, mặc định `home`. Logic thuần trong `lib/prefs/logic.ts` + test: `sanitizePrefs(raw)` (chỉ nhận theme là id kit có thật và **đã mở** với tiến độ hiện tại, ngược lại về `home`; `seen_unlocks` lọc id màn có thật), `mergePrefs(local, cloud)`.
- `lib/theme/index.ts` + test: `availableThemes(levels, passport)` = `home` + thế giới của mọi màn đã mở; `playerTitle(levels, passport)` danh hiệu theo số trang sổ tay đã tìm (chữ danh hiệu là giữ chỗ, đội nội dung chốt).
- `lib/supabase/sync.ts`: dữ liệu trong cột `data` thành `{ ...passport, prefs }` (giữ tương thích bản cũ: thiếu `prefs` thì dùng local). Lúc tải từ mây: `mergePassports` như cũ + `mergePrefs` + `sanitizePrefs` (dữ liệu từ mây là ranh giới tin cậy, phải kiểm hình dạng). Đẩy lên khi passport **hoặc** prefs đổi. Không cần đổi `supabase/schema.sql` (cột jsonb, RLS theo `user_id` đã có).
- Không lưu thêm thông tin cá nhân: tên và ảnh lấy từ phiên Google (`user.user_metadata`) lúc hiển thị, không ghi vào bảng.

## F0b. Gắn lại giao diện giai đoạn E lên component của main (worker)
| Task | Nội dung | File | Worker |
|---|---|---|---|
| G1 Thế giới theo tour | Áp lại U4a lên tour của main: ThemeScope cho điểm đang nghe, `var(--world-accent, …)` không làm màu chữ, TourSetup gửi `spot_ids` đã mở | `components/tour/TourPlayer.tsx`, `TourStopStation.tsx`, `TourSetup.tsx` | ui-hydrogen |
| G2 Mở khóa sau màn + chặn màn khóa | Áp lại U3 (`UnlockReveal`) vào `LevelPlayer` của main (đã có thêm trạm mới) và U2 (`LevelGate`/`LockedLevel`) vào trang màn; dùng `seen_unlocks` từ prefs thay localStorage | `components/level/LevelPlayer.tsx`, `components/level/UnlockReveal.tsx`, `components/level/LockedLevel.tsx`, `app/kham-pha/[levelId]/page.tsx` | ui-hydrogen-high |
| G3 Thế giới ở check-in + hộ chiếu | Áp lại U4b lên photobooth (đã cherry-pick) và `StampCard` của main | `components/checkin/OnsiteBooth.tsx`, `RemoteModeView.tsx`, `components/passport/StampCard.tsx` | ui-hydrogen |
`LevelCard` của main đã có khóa: không đổi, chỉ thêm hiệu ứng mở khóa một lần nếu còn thiếu (đọc `seen_unlocks`).

## F2. Giao diện app theo tài khoản (worker, sau F1)
| Task | Nội dung | File | Worker |
|---|---|---|---|
| T1 Áp giao diện đã chọn | `components/fx/AppTheme.tsx` (mới): đọc `usePrefs().theme` sau hydrate, đặt biến CSS `--app-accent` + nền trời mờ của kit lên `body`/khung app; thanh điều hướng, hero trang chủ, bìa hộ chiếu dùng kit đã chọn (trang chủ: kit chọn thay `home`). Trước hydrate giữ `home`, không chớp. Màu nhấn không làm màu chữ | `components/fx/AppTheme.tsx`, `app/layout.tsx` (chỉ gắn component), `components/shell/BottomNav.tsx`, `app/page.tsx` | ui-hydrogen-high (ui-argon nếu đã hồi, khoảng 18/11) |
| T2 Hồ sơ người chơi | Trang `/ho-so`: ảnh + tên Google (khi đăng nhập), danh hiệu, số sao, số dấu, số trang sổ tay; lưới chọn giao diện: thế giới đã mở bấm được (xem trước cảnh nhỏ), thế giới khóa hiện ổ khóa + "Hoàn thành Màn X"; nút đăng xuất (tái dùng AccountPanel). Liên kết từ hộ chiếu và từ thanh điều hướng (ảnh đại diện nhỏ) | `app/ho-so/page.tsx`, `components/profile/*` (mới), `components/passport/AccountPanel.tsx` (chỉ thêm link) | ui-hydrogen |

## F3. Sau đó
- C1 làm lại màn hình check-in (kế hoạch ngay dưới) chạy trên nhánh mới.
- F4: quyết định dùng tranh AI hay SVG của main cho làng nghề/ẩm thực; tạo 6 ảnh còn thiếu khi hạn mức hồi (06:33 UTC).

Thứ tự: F0 → (F1 ∥ G1 ∥ G2 ∥ G3) → (T1 ∥ T2) → C1. Review: `reviewer` model sonnet, tối đa 2 vòng sửa; review F1/T1/T2 kiểm kỹ: dữ liệu từ mây được kiểm hình dạng, không lưu thêm dữ liệu cá nhân, không chớp giao diện trước hydrate, đăng xuất không làm mất tiến độ local.
Kiểm cuối: tsc, eslint, vitest, `next build` (dừng dev trước); trình duyệt 375px/1440px; thử đăng nhập Google thật (chủ máy tự đăng nhập, Claude không nhập mật khẩu), đổi giao diện trên máy này rồi tải lại → giữ nguyên; đăng nhập máy khác/cửa sổ ẩn danh → giao diện và tiến độ về theo tài khoản.

**Cần chủ máy:** xác nhận Supabase đã bật Google provider và chạy `supabase/schema.sql`; chốt chữ danh hiệu; có giữ cờ `?mo-khoa=tat-ca` cho demo khi đã bắt đăng nhập không.

---

# Kế hoạch: làm lại màn hình check-in, chụp được mọi điểm đã mở

Chủ máy chốt (2026-11-14):
- Màn hình check-in hiện luôn danh sách **mọi điểm đã mở** (điểm của Màn 1–3 có sẵn, điểm của Màn 4–6 mở theo chuỗi màn). Bấm điểm nào thì chụp ngay với khung của điểm đó, **không cần định vị, không cần dấu hoàn thành màn hay nghe tour** (bỏ luật cũ `level || tour`).
- Dấu **ĐÃ ĐẾN** vẫn **chỉ cấp khi check-in tại chỗ** (định vị đúng nơi hoặc cờ `?demo=`). Ảnh chụp từ danh sách không ghi dấu.

Bố cục mới của `/photobooth` (một màn hình chính thay cho bước "intro" + bước "từ xa"):
1. Thẻ **"Check-in tại chỗ"** (nhỏ gọn, trên cùng): giải thích "Đứng tại điểm tham quan để nhận dấu ĐÃ ĐẾN", nút "Xác định vị trí". Luồng định vị → tại chỗ giữ nguyên như hiện nay.
2. Lưới **"Chụp ảnh với khung điểm"**: mỗi điểm một thẻ trong thế giới của nó (màu nhấn, cảnh), tên điểm, chip "Đã đến" nếu đã có dấu visited. Điểm đã mở: nút "Chụp ảnh". Điểm thuộc màn đang khóa: ổ khóa + "Hoàn thành Màn X: … để mở" + nút tới màn đó. Có `?spot=<id>` thì thẻ đó được làm nổi và cuộn tới.
3. Bấm "Chụp ảnh" → khung chụp (PhotoBooth chế độ remote) trong ThemeScope của điểm, nút "Chọn điểm khác" quay lại lưới. Không đóng dấu.
4. Phản hồi định vị "ngoài vùng / lỗi": nút phụ đổi thành "Chụp ảnh với khung điểm" → quay về màn hình chính (lưới), không còn bước "từ xa" riêng.
Máy tính (`lg:`): thẻ tại chỗ + lưới 3 cột; khi đang chụp: 2 cột như hiện nay.

| Task | Nội dung | File (chỉ sửa) | Worker |
|---|---|---|---|
| C1 Màn hình check-in mới | Gộp intro + danh sách thành màn hình chính như trên; bỏ luật `level || tour`, mở theo `isSpotUnlocked` (+ cờ `?mo-khoa=tat-ca`); `?spot=` làm nổi thẻ; giữ nguyên luồng định vị, OnsiteBooth, cờ `?demo=`, chỉ `spot_id` rời máy; focus: tiêu đề mỗi màn nhận focus khi đổi bước (mỗi màn một ref riêng, không dùng chung một ref cho hai tiêu đề cùng lúc) | `components/checkin/CheckinFlow.tsx`, `components/checkin/CheckinIntro.tsx`, `components/checkin/RemoteModeView.tsx`, `components/checkin/CheckinFeedback.tsx` (chỉ chữ/nút phụ) | ui-hydrogen-high |

Một task (các file dính chặt với nhau). Review: `reviewer` model sonnet, tối đa 2 vòng sửa. Kiểm: tsc, eslint, vitest; trình duyệt 375px + 1440px: hộ chiếu trống chụp được 3 điểm Màn 1–3 ngay, Màn 4–6 khóa; chụp từ lưới không thêm dấu vào hộ chiếu; `?demo=bao-tang-cham` vẫn nhận dấu ĐÃ ĐẾN.

---

# Kế hoạch giai đoạn E: mỗi địa điểm một thế giới + mở khóa theo chuỗi màn

Chủ máy chốt (2026-11-14):
- **Theme theo địa điểm** = mỗi địa điểm (màn) là một thế giới riêng: cảnh lớp, trời shader, màu nhấn, hiệu ứng chuyển cảnh và ăn mừng. Thế giới đó đi theo người chơi ra ngoài màn chơi: điểm dừng tour, check-in, thẻ hộ chiếu của điểm đó. Không làm giao diện chung chọn được cho cả app.
- **Mở khóa theo chuỗi màn**: 3 màn P0 (Chăm, Giữ thành, Bài chòi) mở sẵn. Màn 4 mở khi xong Màn 3 (≥ 1 sao), Màn 5 khi xong Màn 4, Màn 6 khi xong Màn 5.

Đã có sẵn để dùng lại: `lib/scene` (kit theo `Theme`: `di-san-cham`, `lich-su-giu-thanh`, `nghe-thuat-dan-gian`, `home`), `components/fx/SceneBackdrop.tsx` (`SceneBackdrop`, `getShaderPresetForKit`), `ParallaxScene`, `PhaseTransition`, `Celebrate`, `ZoomNavigate`, passport `levels[levelId].stars`, RemoteModeView đã có luật "đã mở khóa = có dấu level hoặc tour".

Ngoài phạm vi (theo thứ tự cắt của KH): trạm vẽ `open_drawing`, hoạt động mới "ảnh xưa và nay", giao diện chung chọn được, đồng bộ Firestore. Màn 4–6 chỉ dùng các dạng trạm đã có (`map_pin`, `jigsaw`, `order`, `match`, `open_text_or_voice`).

## E1. Giao kèo + luật mở khóa (Claude, phiên chính) — XONG 2026-11-14
Đã có: `Level.unlock`, `TourRequest.spot_ids?`, `SceneKit.accent`, `lib/level/unlock.ts` (`demoUnlockAll`, `isLevelUnlocked`, `unlockedLevelIds`, `newlyUnlocked`, `isSpotUnlocked`, `unlockedSpotIds`, `requiredLevel`), `pickStops(..., allowedIds?)`, route nhận `spot_ids`, `sceneIdForSpot`, validator kiểm `unlock`.
- `lib/types.ts`: `Level.unlock?: { after: string; min_stars: 1 | 2 | 3 }` (không có = mở sẵn). `SceneKit.accent: string` (màu nhấn của thế giới, dùng cho viền, nút, chip khi đang ở điểm đó).
- `lib/level/unlock.ts` + test: `isLevelUnlocked(level, passport)`, `unlockedLevelIds(levels, passport)`, `newlyUnlocked(levels, before, after)` (màn vừa mở sau một lần ghi kết quả), `isSpotUnlocked(spotId, levels, passport)` (điểm thuộc ít nhất một màn đã mở).
- Cờ demo cho giám khảo: `?mo-khoa=tat-ca` mở mọi màn trong phiên (giống cờ `?demo=` của check-in, không ghi vào hộ chiếu). Hàm `demoUnlockAll(search)` trong `unlock.ts`.
- `lib/tour/plan.ts`: `pickStops` nhận thêm danh sách `spot_id` đã mở; tour chỉ đi qua điểm đã mở. Cập nhật test.
- `lib/scene`: thêm `accent` cho 4 kit hiện có; `sceneIdForSpot(spotId)`.
- `scripts/validate-content.mjs`: kiểm `unlock.after` trỏ tới màn có thật, không có vòng lặp.
- Chấp nhận: tsc, eslint, vitest qua (test mới cho mọi hàm trên).

## E2. Nội dung Màn 4–6 (Claude soạn nháp, đội nội dung kiểm chứng)
**Nháp xong 2026-11-14:** 5 điểm + 3 màn đã vào `content/*.json` dạng khung giữ chỗ `[CHỜ KIỂM CHỨNG]` (tọa độ 0, mục/nhãn giữ chỗ, chưa có ảnh/khung), khóa chuỗi màn 3 → 4 → 5 → 6. Điểm mì Quảng tạm là `diem-mi-quang` (tên giữ chỗ), Màn 6 = Cầu Rồng + Ngũ Hành Sơn. Đội nội dung điền dữ kiện, tọa độ, nguồn.
- `content/spots.json`: thêm `lang-da-non-nuoc`, `lang-nuoc-mam-nam-o` (theme `lang-nghe`), một điểm mì Quảng do đội chọn (`am-thuc`), `cau-rong`, `ngu-hanh-son` (`do-thi-song-le-hoi`). Mọi `story` ghi `[CHỜ KIỂM CHỨNG]`, `status: "draft"`, kèm nguồn.
- `content/levels.json`: `man-4-lang-nghe` (`unlock.after: man-3-ho-bai-choi`), `man-5-vi-quang` (after màn 4), `man-6-thanh-pho-ben-song` (after màn 5). Trạm Làm: màn 4 `order` (quy trình làm nghề), màn 5 `order` (nấu tô mì), màn 6 `match` (công trình ↔ đặc điểm). Trạm Thể hiện: `open_text_or_voice` có rubric.
- Chấp nhận: `node scripts/validate-content.mjs` qua; nội dung nháp hiện nhãn "Nội dung nháp" như hiện nay.

## E3. Tranh 3 thế giới mới (Claude điều phối tạo ảnh, song song với E2)
**Tiến độ 2026-11-14:** prompt 12 lớp đã thêm vào `scripts/gen-scene-art.mjs`. Có 6/12: `lang-nghe` đủ 4 lớp (sky, nui-da, xuong-da, chum-mam), `am-thuc` có sky + pho-cho. Hết hạn mức ảnh, hồi 06:33 UTC 14/11. Còn: `am-thuc` ganh-hang, to-mi; `do-thi-song-le-hoi` cả 4 lớp (chạy lại `.agy-tasks/e3-art.md`, bỏ 6 ảnh đã có). Cần đội nội dung xem: đèn đá trong xuong-da có dáng Nhật, núi đá giống Quế Lâm hơn Ngũ Hành Sơn; lưới trong chum-mam ánh hồng do tách nền.
- Kit `lang-nghe` (núi đá, xưởng đá, thuyền thúng, chum nước mắm), `am-thuc` (gánh hàng, tô mì, khói bếp), `do-thi-song-le-hoi` (cầu Rồng, sông Hàn đêm, pháo hoa). Mỗi kit 3–5 lớp, qua `invoke_subagent` → `image-generator` của agy, rồi `node scripts/gen-scene-art.mjs --kit <kit>`.
- Hạn mức ảnh hồi 10:55 UTC mỗi lần hết; thiếu ảnh thì kit tạm dùng trời + shader + 1–2 lớp SVG.

## E4. Giao diện (worker)
Mẫu tham chiếu: `components/shell/LevelCard.tsx`, `components/level/LevelPlayer.tsx`, `components/tour/TourEnd.tsx`, `components/fx/SceneBackdrop.tsx`, `components/checkin/RemoteModeView.tsx` (đọc passport sau hydrate bằng `useSyncExternalStore`).
Quy tắc chung: chỉ đọc khóa qua `lib/level/unlock.ts`; không đọc store trước hydrate (trước hydrate hiện khung trung tính, không chớp "bị khóa" rồi mở); không lộ nội dung màn bị khóa (tiêu đề và thế giới hiện dạng bóng mờ, không hiện câu hỏi/đáp án); tôn trọng reduced-motion; vá CSS kính bằng hậu tố `!` như đợt photobooth (hoặc chờ T7 sửa gốc `glass.css`).

| Task | Nội dung | File (chỉ sửa) | Worker | Phụ thuộc |
|---|---|---|---|---|
| U1 Danh sách màn có khóa | Thẻ màn bị khóa: ổ khóa, cảnh mờ của thế giới, dòng "Hoàn thành Màn 3 để mở"; thẻ vừa mở lần đầu có hiệu ứng mở khóa một lần (nhớ bằng localStorage, bọc try/catch); bấm thẻ khóa thì rung nhẹ + giải thích, không điều hướng | `app/kham-pha/page.tsx`, `components/shell/LevelCard.tsx` | ui-hydrogen | E1 |
| U2 Chặn vào màn bị khóa | Vào thẳng `/kham-pha/{id}` khi chưa mở: màn hình "Địa điểm chưa mở" (bóng thế giới mờ, điều kiện, nút tới màn cần chơi); không render LevelPlayer | `app/kham-pha/[levelId]/page.tsx`, `components/level/LockedLevel.tsx` (mới) | ui-hydrogen-high | E1 |
| U3 Khoảnh khắc mở khóa | Sau reveal, nếu `newlyUnlocked` có màn mới: thẻ "Mở khóa địa điểm mới" xem trước thế giới đó (SceneBackdrop thu nhỏ), Celebrate theo kit mới, nút ZoomNavigate vào màn | `components/level/LevelPlayer.tsx`, `components/level/UnlockReveal.tsx` (mới) | ui-hydrogen-high (hoặc ui-argon nếu đã hồi quota, khoảng 18/11) | E1 |
| U4a Thế giới đi theo tour | `components/fx/ThemeScope.tsx` (mới): bọc nội dung bằng trời/shader + biến CSS `--world-accent` theo `sceneIdForSpot`; áp vào điểm dừng đang nghe của tour (đổi thế giới khi sang điểm, dùng PhaseTransition của kit); TourSetup gửi `spot_ids: unlockedSpotIds(...)` trong body `/api/tour/plan` và truyền cùng danh sách vào `pickStops(..., allowedIds)` ở nhánh dự phòng | `components/fx/ThemeScope.tsx`, `components/tour/TourPlayer.tsx`, `components/tour/TourStopStation.tsx`, `components/tour/TourSetup.tsx` | ui-hydrogen | E1 |
| U4b Thế giới ở check-in + hộ chiếu | Dùng `ThemeScope` cho OnsiteBooth, điểm đã chọn ở RemoteModeView, thẻ dấu hộ chiếu (viền/màu nhấn theo thế giới); điểm chưa mở trong RemoteModeView ghi rõ "Hoàn thành Màn X để mở" bằng `isSpotUnlocked` | `components/checkin/OnsiteBooth.tsx`, `components/checkin/RemoteModeView.tsx`, `components/passport/StampCard.tsx` | ui-hydrogen | U4a |
| U5 Kit 3 thế giới mới | `lib/scene/kits/lang-nghe.ts`, `am-thuc.ts`, `do-thi-song-le-hoi.ts` theo mẫu kit có sẵn, đăng ký trong `kits/index.ts`, thêm preset shader | `lib/scene/kits/*`, `components/fx/shaders/*` (preset) | ui-flash | E3 |

Thứ tự: E1 → (E2 ∥ E3 ∥ U1 ∥ U2 ∥ U3 ∥ U4a) → U4b, U5.
**Tiến độ 2026-11-14:** U1, U2, U3, U4a xong, reviewer (sonnet) duyệt sau ≤ 1 vòng sửa, kiểm trình duyệt với khóa thử tạm (đã gỡ). U4b xong (reviewer duyệt ngay). E2 nháp đã vào. Còn: E3 (tranh), U5 (kit 3 thế giới mới), đội nội dung điền Màn 4–6. Không task nào chung file trong cùng đợt.
Review: `reviewer` gọi bằng model sonnet, tối đa 2 vòng sửa. Review U1–U3 kiểm kỹ: không lộ nội dung màn khóa, không chớp trạng thái khóa trước hydrate, cờ `?mo-khoa=tat-ca` không ghi vào hộ chiếu.
Kiểm cuối (phiên chính): tsc, eslint, vitest, `next build` (dừng dev trước); trình duyệt 375px và 1440px: hộ chiếu trống → chơi xong Màn 3 → thấy Màn 4 mở; thử `?mo-khoa=tat-ca`; tour 10 phút chỉ đi qua điểm đã mở.

**Cần chủ máy/đội nội dung xác nhận:** điểm mì Quảng cụ thể cho Màn 5; Màn 6 dùng Cầu Rồng + Ngũ Hành Sơn hay thêm cầu sông Hàn; tour cho người bận chỉ đi qua điểm đã mở (kế hoạch hiện tại) hay mở mọi điểm.

---

# Kế hoạch: làm đẹp /photobooth (check-in) + bản máy tính (mục 3.3 báo cáo, phần còn lại)

Mẫu phong cách (đọc trước khi làm): `components/tour/TourSetup.tsx`, `components/tour/TourEnd.tsx` (GlassPanel, GlowButton/GlowLink, KineticText, StampPress, Celebrate, TiltCard, motion + `useReducedMotion`), `components/level/LevelPlayer.tsx` (bố cục `lg:` 2 cột, cột trái sticky), `lib/haptics.ts`.

Quy tắc chung (mọi task):
- **Không đổi logic**: xác thực vị trí (`locateSpot`, `requestIdRef`), cờ demo `?demo=`, `?spot=`, gọi `/api/caption` (timeout 8 giây, dự phòng `caption_fallback`, ô sửa ≤ 100 ký tự), đóng dấu `stamp(spot.id, "visited")` đúng một lần, camera (`useCamera`), ghép ảnh (`compose.ts`, `frames.ts`: **không sửa**), tải ảnh về.
- **Quyền riêng tư CK-06 giữ nguyên**: tọa độ và ảnh không rời máy, chỉ `spot_id` gửi lên. Không thêm request mạng nào.
- Giữ focus: `headingRef` vẫn gắn vào tiêu đề mỗi bước (CheckinFlow focus khi đổi bước). Không đổi `key` để tạo hiệu ứng (mất focus), rung/nảy dùng `useAnimate`.
- Tôn trọng reduced-motion; nút ≥ 44px; focus ring không bị cắt (`overflow-hidden` cẩn thận).
- Điện thoại giữ 1 cột; máy tính từ `lg:`.
- Không đọc store passport trong lúc render trước hydrate (giữ cách `useSyncExternalStore` đang có ở RemoteModeView).
- Worker không chạy lệnh shell.

Chấp nhận: `npx tsc --noEmit`, `npx eslint app components lib`, `npx vitest run` qua; reviewer duyệt; phiên chính kiểm trên trình duyệt ở 375px và 1440px với `/photobooth?demo=<spot>` (tại chỗ) và chế độ từ xa.

| Task | Nội dung | File (chỉ sửa) | Worker |
|---|---|---|---|
| P1 Mở đầu + định vị | Trang rộng ra ở máy tính (giống `app/tour/page.tsx`); băng "Chế độ demo" thành chip kính vàng; **CheckinIntro**: GlassPanel, tiêu đề KineticText, nút "Xác định vị trí" là GlowButton, "Ghé thăm từ xa" nút kính phụ; **CheckinFeedback**: lúc đang định vị có vòng radar tỏa ra (tắt khi reduced-motion), ngoài vùng hiện khoảng cách nổi bật + nút thử lại / từ xa, lỗi dùng panel kính tông cảnh báo; `haptic()` nhẹ khi định vị xong | `app/photobooth/page.tsx`, `components/checkin/CheckinFlow.tsx` (chỉ phần JSX bọc ngoài và băng demo), `components/checkin/CheckinIntro.tsx`, `components/checkin/CheckinFeedback.tsx` | ui-hydrogen |
| P2 Khung chụp | **PhotoBooth** (chỉ giao diện): khung ngắm bo tròn có viền kính, số đếm ngược lớn dạng nảy (KineticText hoặc motion scale), chớp trắng khi chụp (tắt khi reduced-motion), ảnh xem lại nằm trong TiltCard, các nút là GlowButton/nút kính; trạng thái lỗi camera là panel kính có hướng dẫn. Không đổi `BoothPhase`, props, `onCaptured`, logic camera/ghép ảnh/tải về | `components/photobooth/PhotoBooth.tsx` | ui-hydrogen-high |
| P3 Tại chỗ + nhận dấu | **OnsiteBooth**: tiêu đề "Bạn đang ở …" là panel kính; khi nhận dấu: StampPress "ĐÃ ĐẾN" + Celebrate + `haptic("success")`, nút "Xem hộ chiếu" là GlowLink; ô chú thích là panel kính, trạng thái đang tạo chú thích có shimmer. Máy tính: 2 cột, khung chụp trái, chú thích + dấu phải (sticky) | `components/checkin/OnsiteBooth.tsx` | ui-hydrogen |
| P4 Ghé thăm từ xa | **RemoteModeView**: danh sách điểm thành thẻ TiltCard có ảnh/tên/chip đã có dấu; chọn thẻ có vòng sáng vàng; máy tính lưới 3 cột, khi đã chọn điểm thì 2 cột (khung chụp trái, thông tin phải). Giữ nguyên cách đọc stamps sau hydrate | `components/checkin/RemoteModeView.tsx` | ui-hydrogen |

P1–P4 không chung file → chạy song song. Sau mỗi task: `reviewer`, tối đa 2 vòng sửa. Brief để trong `.agy-tasks/p1..p4.md`.
Hạn mức: argon hết đến khoảng 18/11, nên không dùng argon.
Ngoài phạm vi: sửa khung ảnh (`frames.ts`), tách nền MediaPipe, dải 3 khung (đã cắt theo KH).

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

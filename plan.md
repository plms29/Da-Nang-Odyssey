# plan.md

## Giai đoạn B, đợt B1: Photobooth check-in + hộ chiếu + hạ tầng (KH mục 11, giai đoạn 2)

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

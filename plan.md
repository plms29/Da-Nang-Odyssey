# plan.md — Giai đoạn A: Khung sườn sản phẩm

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

# Quay lại clip demo (ngang 1920×1080)
1. Chạy app ở cổng 3200 **trong một bản sao riêng của repo** (không chạy chung `.next` với dev server cổng 3000), với Supabase giả để khỏi bị chặn đăng nhập:
   `NEXT_PUBLIC_SUPABASE_URL=https://mock.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=mock npx next dev -p 3200`
   Trong bản sao đặt `devIndicators: false` ở `next.config.ts` để ẩn badge lỗi dev.
2. `pip install playwright` và `playwright install chromium`
3. `python record.py` (tất cả) hoặc `python record.py dien_hai`. Kết quả ở `clips/`.
Cộng đồng dùng dữ liệu mẫu (xem `mock_supabase` trong `record.py`). Thẻ tiêu đề/công nghệ/kết nằm trong `cards.html`.

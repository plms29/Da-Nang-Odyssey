# Khôi phục `.env.local`

File `.env.local` không nằm trên GitHub (chứa khóa bí mật). Sau khi clone, tạo lại như sau:

```bash
git clone https://github.com/plms29/Da-Nang-Odyssey.git
cd Da-Nang-Odyssey
npm install
cp .env.example .env.local
```

Điền các biến sau vào `.env.local`:

| Biến | Lấy ở đâu |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → project → Project Settings → API → *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cùng trang → *anon public* key |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey → Create API key (có thể tạo key mới, key cũ nên thu hồi) |
| `GEMINI_MODEL` | tên model Gemini muốn dùng (xem `.env.example` / mã nguồn `app/api/*`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | (tùy chọn) Google Cloud Console → APIs & Services → Credentials, bật Maps JavaScript API |
| `VERCEL_OIDC_TOKEN` | không cần nhập tay: chạy `npx vercel link` rồi `npx vercel env pull .env.local` (token hết hạn nhanh, tự sinh lại) |

Nếu project đã deploy trên Vercel, cách nhanh nhất: `npx vercel link && npx vercel env pull .env.local` sẽ kéo lại các biến đã lưu ở Vercel.

Schema database: chạy `supabase/schema.sql` trong Supabase SQL Editor nếu cần dựng project Supabase mới.

Lưu ý: nếu từng lộ key ở đâu đó, hãy tạo lại (rotate) key trên dashboard tương ứng.

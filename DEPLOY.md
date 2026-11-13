# Triển khai lên Cloud Run

Một service chạy cả giao diện và API ở `asia-southeast1` (KH mục 8, I1). Camera và định vị chỉ chạy qua HTTPS, nên luôn thử trên URL Cloud Run, không thử qua IP mạng LAN.

## Một lần cho mỗi dự án

```bash
gcloud config set project <PROJECT_ID>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
printf '%s' '<GEMINI_API_KEY>' | gcloud secrets create gemini-api-key --data-file=-
```

Cấp quyền đọc secret cho service account của Cloud Run (mặc định là `<PROJECT_NUMBER>-compute@developer.gserviceaccount.com`):

```bash
gcloud secrets add-iam-policy-binding gemini-api-key --member=serviceAccount:<PROJECT_NUMBER>-compute@developer.gserviceaccount.com --role=roles/secretmanager.secretAccessor
```

## Mỗi lần triển khai

Từ thư mục gốc repo (Cloud Build dùng `Dockerfile`):

```bash
gcloud run deploy danang-odyssey --source . --region asia-southeast1 --allow-unauthenticated --set-secrets GEMINI_API_KEY=gemini-api-key:latest --set-env-vars GEMINI_MODEL=<tên model đã tra trên ai.google.dev>
```

Kiểm tra: `curl https://<URL>/healthz` trả `{"ok":true}`.

## Ghi chú

- Thiếu `GEMINI_API_KEY` hoặc `GEMINI_MODEL` thì app vẫn chạy, `/api/judge` chấm bằng đường dự phòng (`graded_by: "fallback"`).
- Bản demo trước giám khảo: chạy `npm run validate:demo` trước để chắc mọi nội dung đã `verified`.
- CI (`.github/workflows/ci.yml`) chạy validate, tsc, lint, test, build cho mỗi lần push lên `main`; chưa tự động deploy (cần quyết định về Workload Identity Federation trước).

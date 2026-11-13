import { PageHeader } from "@/components/shell/PageHeader";

export default function PhotoboothPage() {
  return (
    <main className="space-y-4 pb-4">
      <PageHeader
        title="Check-in điểm di sản"
        subtitle="Chụp ảnh lưu niệm với khung hình văn hóa tại điểm tham quan thực tế."
        backHref="/"
      />

      <section className="rounded-lg border border-ink/15 bg-white/75 p-4 text-sm leading-relaxed text-ink">
        <p>
          Khi bạn có mặt trong bán kính điểm văn hóa tại Đà Nẵng, ứng dụng sẽ
          xác thực vị trí, ghép khung ảnh chủ đề và đóng dấu{" "}
          <strong>đã đến</strong> vào hộ chiếu của bạn.
        </p>
      </section>

      <section
        aria-label="Trạng thái tính năng"
        className="rounded-lg border border-dashed border-terracotta/50 bg-terracotta/5 p-6 text-center"
      >
        <p className="text-sm font-bold text-terracotta">Đang xây dựng</p>
        <p className="mt-1 text-xs text-muted">
          Máy ảnh, khung hình di sản và kiểm tra tọa độ GPS đang được hoàn thiện.
        </p>
      </section>
    </main>
  );
}

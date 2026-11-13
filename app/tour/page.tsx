import { PageHeader } from "@/components/shell/PageHeader";

export default function TourPage() {
  return (
    <main className="space-y-4 pb-4">
      <PageHeader
        title="Tour 5 phút"
        subtitle="Lộ trình kể chuyện nhanh trên bản đồ sông Hàn dành cho người có ít thời gian."
        backHref="/"
      />

      <section className="rounded-lg border border-ink/15 bg-white/75 p-4 text-sm leading-relaxed text-ink">
        <p>
          Chọn thời lượng và chủ đề yêu thích để nghe thuyết minh ngắn gọn qua
          các điểm di sản dọc sông Hàn, nhận dấu <strong>đã nghe tour</strong>{" "}
          vào hộ chiếu văn hóa.
        </p>
      </section>

      <section
        aria-label="Trạng thái tính năng"
        className="rounded-lg border border-dashed border-river/50 bg-river/5 p-6 text-center"
      >
        <p className="text-sm font-bold text-river">Đang xây dựng</p>
        <p className="mt-1 text-xs text-muted">
          Trình phát tour âm thanh và bản đồ lộ trình sẽ mở ở giai đoạn tiếp theo.
        </p>
      </section>
    </main>
  );
}

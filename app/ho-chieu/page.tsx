import { PageHeader } from "@/components/shell/PageHeader";

export default function HoChieuPage() {
  return (
    <main className="space-y-4 pb-4">
      <PageHeader
        title="Hộ chiếu văn hóa"
        subtitle="Lưu giữ các con dấu và thành tích trên hành trình khám phá Đà Nẵng."
        backHref="/"
      />

      <section className="space-y-3 rounded-lg border border-ink/15 bg-white/75 p-4 text-sm leading-relaxed text-ink">
        <p>
          Mỗi địa danh văn hóa tại Đà Nẵng có ba loại con dấu để bạn sưu tầm:
        </p>
        <ul className="list-inside list-disc space-y-1.5 text-muted">
          <li>
            <strong className="text-ink">Hoàn thành màn:</strong> vượt qua cả ba
            trạm Tìm, Làm, Thể hiện trong chiến dịch Khám phá.
          </li>
          <li>
            <strong className="text-ink">Đã nghe tour:</strong> lắng nghe trọn
            vẹn câu chuyện di sản trong chế độ Tour 5 phút.
          </li>
          <li>
            <strong className="text-ink">Đã đến:</strong> chụp ảnh check-in trực
            tiếp tại tọa độ điểm tham quan ngoài đời thực.
          </li>
        </ul>
      </section>

      <section
        aria-label="Trạng thái tính năng"
        className="rounded-lg border border-dashed border-gold/70 bg-gold/10 p-6 text-center"
      >
        <p className="text-sm font-bold text-ink">Đang xây dựng</p>
        <p className="mt-1 text-xs text-muted">
          Sổ hộ chiếu hiển thị bộ sưu tập dấu và sao sẽ được kết nối trong bước tiếp theo.
        </p>
      </section>
    </main>
  );
}

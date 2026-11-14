import { Suspense } from "react";
import { CheckinFlow } from "@/components/checkin/CheckinFlow";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSpots } from "@/lib/content";

export default function PhotoboothPage() {
  const spots = getSpots();

  return (
    <main className="space-y-4 pb-6">
      <PageHeader
        title="Check-in địa điểm"
        subtitle="Chụp ảnh lưu niệm tại điểm di sản và ghi nhận dấu đã đến."
        backHref="/"
      />

      <Suspense
        fallback={
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-border bg-surface/90 p-5 text-sm text-muted backdrop-blur-md"
          >
            Đang tải trình check-in…
          </div>
        }
      >
        <CheckinFlow spots={spots} />
      </Suspense>
    </main>
  );
}

import { Suspense } from "react";
import { CheckinFlow } from "@/components/checkin/CheckinFlow";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSpots } from "@/lib/content";

export default function PhotoboothPage() {
  const spots = getSpots();

  return (
    <main className="space-y-4 pb-6">
      <PageHeader
        title="Check-in"
        subtitle="Chụp ảnh tại điểm tham quan, nhận dấu đã đến"
        backHref="/"
      />

      <Suspense
        fallback={
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-ink/15 bg-white/80 p-5 text-sm text-muted"
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

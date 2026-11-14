import { Suspense } from "react";
import { CheckinFlow } from "@/components/checkin/CheckinFlow";
import { GlassPanel } from "@/components/fx/Glass";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSpots } from "@/lib/content";

export default function PhotoboothPage() {
  const spots = getSpots();

  return (
    <main className="space-y-4 pb-6 lg:space-y-8 lg:pb-12">
      <PageHeader
        title="Check-in"
        subtitle="Chụp ảnh tại điểm tham quan, nhận dấu đã đến"
        backHref="/"
      />

      <Suspense
        fallback={
          <GlassPanel
            tone="light"
            role="status"
            aria-live="polite"
            className="rounded-2xl p-5 text-sm text-muted lg:mx-auto lg:max-w-2xl lg:p-8"
          >
            Đang tải trình check-in…
          </GlassPanel>
        }
      >
        <CheckinFlow spots={spots} />
      </Suspense>
    </main>
  );
}

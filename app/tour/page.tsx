import { PageHeader } from "@/components/shell/PageHeader";
import { TourApp } from "@/components/tour/TourApp";
import { getSpots } from "@/lib/content";

export default function TourPage() {
  return (
    <main className="space-y-4 pb-4 lg:space-y-8 lg:pb-12">
      <PageHeader
        title="Tour 5 phút"
        subtitle="Lộ trình thuyết minh ngắn gọn dọc sông Hàn dành cho người bận rộn."
        backHref="/"
      />

      <TourApp spots={getSpots()} />
    </main>
  );
}

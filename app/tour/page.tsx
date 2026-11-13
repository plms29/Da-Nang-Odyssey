import { PageHeader } from "@/components/shell/PageHeader";
import { TourApp } from "@/components/tour/TourApp";
import { getSpots } from "@/lib/content";

export default function TourPage() {
  return (
    <main className="space-y-4 pb-4">
      <PageHeader
        title="Tour 5 phút"
        subtitle="Lộ trình kể chuyện nhanh trên bản đồ sông Hàn dành cho người có ít thời gian."
        backHref="/"
      />

      <TourApp spots={getSpots()} />
    </main>
  );
}

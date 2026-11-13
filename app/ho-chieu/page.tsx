import { getLevels, getSpots } from "@/lib/content";
import { PageHeader } from "@/components/shell/PageHeader";
import { PassportView } from "@/components/passport/PassportView";

export default function HoChieuPage() {
  const spots = getSpots();
  const levels = getLevels();

  return (
    <main className="space-y-4 pb-4">
      <PageHeader
        title="Hộ chiếu văn hóa"
        subtitle="Dấu hoàn thành màn, đã nghe tour và đã đến tận nơi"
        backHref="/"
      />

      <PassportView spots={spots} levels={levels} />
    </main>
  );
}

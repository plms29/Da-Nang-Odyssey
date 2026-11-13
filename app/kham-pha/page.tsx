import { getLevels } from "@/lib/content";
import { LevelCard } from "@/components/shell/LevelCard";
import { PageHeader } from "@/components/shell/PageHeader";

export default function KhamPhaPage() {
  const levels = getLevels();

  return (
    <main className="pb-4">
      <PageHeader
        title="Chiến dịch khám phá"
        subtitle="Mỗi màn gồm ba trạm: Tìm trên bản đồ, Làm thử thách và Thể hiện cảm nhận."
        backHref="/"
      />

      <ul className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
        {levels.map((level, index) => (
          <li key={level.id}>
            <LevelCard level={level} delay={Math.min(0.05 * index, 0.2)} />
          </li>
        ))}
      </ul>
    </main>
  );
}

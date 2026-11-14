import { getLevels } from "@/lib/content";
import { LevelCard } from "@/components/shell/LevelCard";
import { PageHeader } from "@/components/shell/PageHeader";

export default function KhamPhaPage() {
  const levels = getLevels();

  return (
    <main className="pb-4">
      <PageHeader
        title="Hành trình khám phá"
        subtitle="Chọn một điểm di sản để bắt đầu qua ba chặng: Tìm trên bản đồ, Thử thách và Thể hiện."
        backHref="/"
      />

      <ul className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {levels.map((level) => (
          <li key={level.id}>
            <LevelCard level={level} />
          </li>
        ))}
      </ul>
    </main>
  );
}

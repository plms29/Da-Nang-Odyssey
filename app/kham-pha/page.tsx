import { getLevels } from "@/lib/content";
import { LevelCard } from "@/components/shell/LevelCard";
import { PageHeader } from "@/components/shell/PageHeader";
import { GuideIntro } from "@/components/story/GuideIntro";
import { PageProgress } from "@/components/story/PageProgress";

export default function KhamPhaPage() {
  const levels = getLevels();

  return (
    <main className="pb-4">
      <PageHeader
        title="Chiến dịch khám phá"
        subtitle="Cùng Hàn tìm lại sáu trang sổ tay bị gió cuốn đi."
        backHref="/"
      />

      <div className="mb-6 space-y-4">
        <GuideIntro levels={levels} />
        <PageProgress levels={levels} />
      </div>

      <ul className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
        {levels.map((level, index) => (
          <li key={level.id}>
            <LevelCard
              level={level}
              levels={levels}
              delay={Math.min(0.05 * index, 0.2)}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}

import { notFound } from "next/navigation";
import { getLevel, getLevels } from "@/lib/content";
import { PageHeader } from "@/components/shell/PageHeader";
import { LevelPlayer } from "@/components/level/LevelPlayer";
import { LevelGate } from "@/components/level/LockedLevel";

export function generateStaticParams() {
  return getLevels().map((level) => ({ levelId: level.id }));
}

export default async function LevelPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  const level = getLevel(levelId);

  if (!level) {
    notFound();
  }

  return (
    <main className="pb-6">
      <PageHeader
        title={`Màn ${level.order}: ${level.title}`}
        backHref="/kham-pha"
        backLabel="Hành trình khám phá"
      />
      <LevelGate level={level}>
        <LevelPlayer level={level} />
      </LevelGate>
    </main>
  );
}

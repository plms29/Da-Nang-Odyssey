import Link from "next/link";
import { getLevels } from "@/lib/content";
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

      <ul className="space-y-3">
        {levels.map((level) => (
          <li key={level.id}>
            <Link
              href={`/kham-pha/${level.id}`}
              className="group block rounded-lg border border-ink/15 bg-white/80 p-4 transition-all hover:border-terracotta hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-terracotta uppercase">
                  Màn {level.order}
                </span>
                {level.status === "draft" && (
                  <span className="rounded-sm border border-gold/60 bg-gold/20 px-2 py-0.5 text-xs font-semibold text-ink">
                    Nội dung nháp
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-ink group-hover:text-terracotta">
                  {level.title}
                </h2>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-terracotta"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

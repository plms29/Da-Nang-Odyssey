import Link from "next/link";
import type { PassportState } from "@/lib/passport/logic";
import type { Spot } from "@/lib/types";

export interface StampCardProps {
  spot: Spot;
  stamp?: PassportState["stamps"][string];
}

function formatVisitDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function StampCard({ spot, stamp }: StampCardProps) {
  const hasLevel = Boolean(stamp?.level);
  const hasTour = Boolean(stamp?.tour);
  const visitedDate = stamp?.visited ? formatVisitDate(stamp.visited) : null;

  return (
    <article className="rounded-lg border border-ink/15 bg-white/80 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-ink">{spot.name}</h3>
        {!visitedDate && (
          <Link
            href={`/photobooth?spot=${encodeURIComponent(spot.id)}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-xs font-semibold text-terracotta underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Check-in tại đây
          </Link>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div
          role="group"
          aria-label={
            hasLevel ? "Hoàn thành màn: có" : "Hoàn thành màn: chưa"
          }
          className={`flex min-h-14 flex-col items-center justify-center rounded-md px-2 py-2 text-center text-xs ${
            hasLevel
              ? "bg-terracotta font-semibold text-sand"
              : "border border-dashed border-ink/25 bg-sand/50 text-muted"
          }`}
        >
          <span>Hoàn thành màn</span>
          <span className="mt-1 text-xs opacity-90">
            {hasLevel ? "Đã có" : "Chưa"}
          </span>
        </div>

        <div
          role="group"
          aria-label={hasTour ? "Đã nghe tour: có" : "Đã nghe tour: chưa"}
          className={`flex min-h-14 flex-col items-center justify-center rounded-md px-2 py-2 text-center text-xs ${
            hasTour
              ? "bg-river font-semibold text-sand"
              : "border border-dashed border-ink/25 bg-sand/50 text-muted"
          }`}
        >
          <span>Đã nghe tour</span>
          <span className="mt-1 text-xs opacity-90">
            {hasTour ? "Đã có" : "Chưa"}
          </span>
        </div>

        <div
          role="group"
          aria-label={
            visitedDate
              ? `Đã đến: có, ngày ${visitedDate}`
              : "Đã đến: chưa"
          }
          className={`flex min-h-14 flex-col items-center justify-center rounded-md px-2 py-2 text-center text-xs ${
            visitedDate
              ? "bg-gold font-semibold text-ink"
              : "border border-dashed border-ink/25 bg-sand/50 text-muted"
          }`}
        >
          <span>Đã đến</span>
          <span className="mt-1 text-xs">
            {visitedDate ?? "Chưa"}
          </span>
        </div>
      </div>
    </article>
  );
}

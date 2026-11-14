import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { getSpot } from "@/lib/content";
import { getMuseums3D } from "@/lib/museum3d/data";

export default function Museum3DIndexPage() {
  const museums = getMuseums3D();

  return (
    <main className="space-y-4 pb-6">
      <PageHeader
        title="3D"
        subtitle="Dạo bảo tàng góc nhìn thứ nhất"
        backHref="/"
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {museums.map((museum) => {
          const spot = getSpot(museum.spotId);
          const name = spot?.name ?? museum.spotId;

          return (
            <li key={museum.spotId}>
              <Link
                href={`/3d/${museum.spotId}`}
                className="block rounded-2xl border border-ink/15 bg-white/80 p-5 shadow-sm transition hover:border-terracotta/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-ink">{name}</h2>
                  <span className="shrink-0 rounded-full bg-terracotta/15 px-2.5 py-0.5 text-xs font-semibold text-terracotta">
                    {museum.exhibits.length} hiện vật
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Sảnh {museum.hall.width}m × {museum.hall.depth}m · Góc nhìn thứ nhất
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { Museum3D } from "@/lib/museum3d/data";

const MuseumScene = dynamic(
  () => import("@/components/museum3d/MuseumScene").then((m) => m.MuseumScene),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="flex h-full w-full items-center justify-center rounded-2xl border border-ink/15 bg-white/80 text-sm text-muted"
      >
        Đang dựng bảo tàng…
      </div>
    ),
  },
);

export function MuseumClient({ museum }: { museum: Museum3D }) {
  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl lg:h-[80vh]">
      <MuseumScene museum={museum} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { listPhotos, photoUrl, type CommunityPhoto } from "@/lib/community/photos";

export function CommunityFeed() {
  const [photos, setPhotos] = useState<CommunityPhoto[] | null>(null);

  useEffect(() => {
    void listPhotos().then(setPhotos);
  }, []);

  if (!photos) return <p role="status" className="px-3 text-sm text-muted">Đang tải ảnh…</p>;
  if (photos.length === 0)
    return <p className="px-3 text-sm text-muted">Chưa có ảnh nào. Chụp ở trang Check-in và tick &ldquo;Chia sẻ&rdquo; nhé!</p>;

  return (
    <ul className="grid grid-cols-2 gap-3 px-3 lg:grid-cols-4">
      {photos.map((p) => (
        <li key={p.id} className="overflow-hidden rounded-xl border border-ink/15 bg-sand/90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl(p.path)} alt={p.caption ?? p.spot_name} loading="lazy" className="aspect-[3/4] w-full object-cover" />
          <div className="p-2 text-xs">
            <p className="font-bold text-ink">{p.spot_name}</p>
            {p.caption && <p className="text-muted">{p.caption}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

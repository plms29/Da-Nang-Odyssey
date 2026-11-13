"use client";

import { useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { PhotoBooth } from "@/components/photobooth/PhotoBooth";
import { usePassport } from "@/lib/passport/store";
import type { Spot } from "@/lib/types";

export interface OnsiteBoothProps {
  spot: Spot;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReset: () => void;
}

export function OnsiteBooth({ spot, headingRef, onReset }: OnsiteBoothProps) {
  const [captured, setCaptured] = useState(false);
  const stampedRef = useRef(false);

  function handleCaptured() {
    if (stampedRef.current) return;
    stampedRef.current = true;
    usePassport.getState().stamp(spot.id, "visited");
    setCaptured(true);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-river/30 bg-white/80 p-4">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-base font-bold text-river focus:outline-none"
        >
          Bạn đang ở {spot.name}
        </h2>
        <p className="mt-1 text-xs text-muted">
          Chụp ảnh và chọn &ldquo;Dùng ảnh này&rdquo; để nhận dấu ĐÃ ĐẾN vào hộ
          chiếu.
        </p>
      </div>

      {captured && (
        <div
          role="status"
          className="space-y-3 rounded-lg border border-gold bg-gold/15 p-4"
        >
          <p className="text-sm font-bold text-ink">
            Đã nhận dấu ĐÃ ĐẾN vào hộ chiếu
          </p>
          <Link
            href="/ho-chieu"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-river px-4 py-2 text-sm font-semibold text-sand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Xem hộ chiếu
          </Link>
        </div>
      )}

      <PhotoBooth spot={spot} mode="onsite" onCaptured={handleCaptured} />

      <div className="pt-1">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          Kiểm tra lại vị trí
        </button>
      </div>
    </section>
  );
}

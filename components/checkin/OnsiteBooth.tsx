"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Celebrate } from "@/components/fx/Celebrate";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowLink } from "@/components/fx/GlowButton";
import { StampPress } from "@/components/fx/StampPress";
import { PhotoBooth } from "@/components/photobooth/PhotoBooth";
import { usePassport } from "@/lib/passport/store";
import type { CaptionResult, Spot } from "@/lib/types";

const CAPTION_TIMEOUT_MS = 8000;
const MAX_CAPTION_LENGTH = 100;

export interface OnsiteBoothProps {
  spot: Spot;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReset: () => void;
}

export function OnsiteBooth({ spot, headingRef, onReset }: OnsiteBoothProps) {
  const [captured, setCaptured] = useState(false);
  const [caption, setCaption] = useState(spot.caption_fallback);
  const [suggestedCaption, setSuggestedCaption] = useState(
    spot.caption_fallback,
  );
  const [loadingCaption, setLoadingCaption] = useState(true);

  const stampedRef = useRef(false);
  const userEditedRef = useRef(false);
  const captionInputId = useId();
  const reduceMotion = Boolean(useReducedMotion());

  useEffect(() => {
    const controller = new AbortController();
    let abortedByTimeout = false;
    let active = true;

    const timeoutId = window.setTimeout(() => {
      abortedByTimeout = true;
      controller.abort();
    }, CAPTION_TIMEOUT_MS);

    async function fetchCaption() {
      try {
        const response = await fetch("/api/caption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spot_id: spot.id }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Caption request failed");
        }

        const data = (await response.json()) as Partial<CaptionResult>;
        const nextCaption =
          typeof data.caption === "string" && data.caption.trim().length > 0
            ? data.caption.trim()
            : spot.caption_fallback;

        if (!active) return;
        setSuggestedCaption(nextCaption);
        if (!userEditedRef.current) {
          setCaption(nextCaption);
        }
      } catch {
        if (!active) return;
        if (controller.signal.aborted && !abortedByTimeout) {
          return;
        }
        setSuggestedCaption(spot.caption_fallback);
        if (!userEditedRef.current) {
          setCaption(spot.caption_fallback);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (active) {
          setLoadingCaption(false);
        }
      }
    }

    void fetchCaption();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [spot.id, spot.caption_fallback]);

  function handleCaptured() {
    if (stampedRef.current) return;
    stampedRef.current = true;
    usePassport.getState().stamp(spot.id, "visited");
    setCaptured(true);
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-6">
      <div className="space-y-4 lg:sticky lg:top-24 lg:col-span-5 lg:col-start-8 lg:row-start-1">
        <GlassPanel
          tone="light"
          className="border border-river/25 p-4 lg:p-5"
        >
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-bold text-river focus:outline-none lg:text-lg"
          >
            Bạn đang ở {spot.name}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Chụp ảnh và chọn &ldquo;Dùng ảnh này&rdquo; để nhận dấu ĐÃ ĐẾN vào
            hộ chiếu.
          </p>
        </GlassPanel>

        {captured && (
          <GlassPanel
            tone="light"
            role="status"
            className="relative space-y-3 overflow-hidden border border-gold/60 bg-gold/15 p-4 lg:p-5"
          >
            <Celebrate kind="gold-burst" play={captured} />
            <div className="flex flex-wrap items-center gap-3">
              <StampPress play={captured}>
                <span className="inline-flex items-center rounded-md border-2 border-terracotta bg-sand/95 px-2.5 py-1 text-xs font-extrabold tracking-wider text-terracotta shadow-sm">
                  ĐÃ ĐẾN
                </span>
              </StampPress>
              <p className="text-sm font-bold text-ink">
                Đã nhận dấu ĐÃ ĐẾN vào hộ chiếu
              </p>
            </div>
            <div>
              <GlowLink
                href="/ho-chieu"
                className="min-h-11 px-4 py-2 text-sm"
              >
                Xem hộ chiếu
              </GlowLink>
            </div>
          </GlassPanel>
        )}

        <GlassPanel
          tone="light"
          className="space-y-3 border border-ink/15 p-4 lg:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-ink">Chú thích cho ảnh</h3>
            {loadingCaption && (
              <span role="status" className="text-xs font-medium text-river">
                Đang viết chú thích…
              </span>
            )}
          </div>

          {loadingCaption && (
            <div
              aria-hidden="true"
              className="relative h-2 w-full overflow-hidden rounded-full bg-river/15"
            >
              {!reduceMotion && (
                <motion.div
                  className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-gold/60 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor={captionInputId}
              className="block text-xs font-semibold text-ink"
            >
              Nội dung chú thích (tối đa {MAX_CAPTION_LENGTH} ký tự)
            </label>
            <input
              id={captionInputId}
              type="text"
              maxLength={MAX_CAPTION_LENGTH}
              value={caption}
              onChange={(e) => {
                userEditedRef.current = true;
                setCaption(e.target.value);
              }}
              placeholder="Nhập chú thích ngắn cho ảnh…"
              className="min-h-11 w-full rounded-md border border-ink/20 bg-sand/85 px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                userEditedRef.current = true;
                setCaption("");
              }}
              disabled={caption === ""}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-white/90 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:opacity-50"
            >
              Bỏ chú thích
            </button>

            <button
              type="button"
              onClick={() => {
                userEditedRef.current = false;
                setCaption(suggestedCaption);
              }}
              disabled={caption === suggestedCaption}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-gold/60 bg-gold/20 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta disabled:opacity-50"
            >
              Dùng lại gợi ý
            </button>
          </div>

          <p className="text-xs text-muted">
            Chỉ mã điểm được gửi để viết chú thích, ảnh không rời máy.
          </p>
        </GlassPanel>
      </div>

      <div className="space-y-4 lg:col-span-7 lg:col-start-1 lg:row-start-1">
        <PhotoBooth
          spot={spot}
          mode="onsite"
          caption={caption}
          onCaptured={handleCaptured}
        />

        <div className="pt-1">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 bg-sand px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Kiểm tra lại vị trí
          </button>
        </div>
      </div>
    </section>
  );
}

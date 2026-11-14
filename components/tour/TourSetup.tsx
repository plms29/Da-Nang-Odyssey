"use client";

import { useState, type Dispatch } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GlassPanel } from "@/components/fx/Glass";
import { GlowButton } from "@/components/fx/GlowButton";
import { TOUR_STOPS } from "@/lib/tour/config";
import { fallbackPlan, pickStops } from "@/lib/tour/plan";
import type { TourAction } from "@/lib/tour/player";
import type { Spot, Theme, TourPlan, TourStop } from "@/lib/types";

export interface TourSetupProps {
  spots: Spot[];
  dispatch: Dispatch<TourAction>;
  notice?: string | null;
  onClearNotice?: () => void;
  onEmptyPlan?: (message: string) => void;
}

const DURATION_OPTIONS = [
  { seconds: 180, label: "3 phút" },
  { seconds: 300, label: "5 phút" },
  { seconds: 600, label: "10 phút" },
] as const;

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "di-san-cham", label: "Di sản Chăm" },
  { value: "lich-su-giu-thanh", label: "Lịch sử giữ thành" },
  { value: "lang-nghe", label: "Làng nghề" },
  { value: "nghe-thuat-dan-gian", label: "Nghệ thuật dân gian" },
  { value: "am-thuc", label: "Ẩm thực" },
  { value: "do-thi-song-le-hoi", label: "Đô thị bên sông, lễ hội" },
];

const EMPTY_PLAN_MESSAGE =
  "Hiện chưa có điểm tham quan phù hợp cho lộ trình này. Bạn hãy thử chọn lại nhé.";

function isValidTourPlan(data: unknown): data is TourPlan {
  if (typeof data !== "object" || data === null) return false;
  const candidate = data as { stops?: unknown };
  if (!Array.isArray(candidate.stops)) return false;
  return candidate.stops.every(
    (stop) =>
      typeof stop === "object" &&
      stop !== null &&
      typeof (stop as TourStop).spot_id === "string" &&
      typeof (stop as TourStop).narration === "string",
  );
}

function sanitizeStops(stops: TourStop[], spots: Spot[]): TourStop[] {
  const spotsById = new Map(spots.map((spot) => [spot.id, spot]));
  const sanitized: TourStop[] = [];

  for (const stop of stops) {
    const matchedSpot = spotsById.get(stop.spot_id);
    if (!matchedSpot) continue;

    const hasValidSeconds =
      typeof stop.seconds === "number" &&
      Number.isFinite(stop.seconds) &&
      stop.seconds > 0;

    sanitized.push({
      spot_id: stop.spot_id,
      narration: stop.narration,
      transition: typeof stop.transition === "string" ? stop.transition : "",
      seconds: hasValidSeconds ? stop.seconds : matchedSpot.tour_seconds,
    });
  }

  return sanitized;
}

export function TourSetup({
  spots,
  dispatch,
  notice,
  onClearNotice,
  onEmptyPlan,
}: TourSetupProps) {
  const [seconds, setSeconds] = useState<number>(300);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const availableThemes = THEME_OPTIONS.filter((opt) =>
    spots.some((spot) => spot.theme === opt.value),
  );
  const selectedDuration =
    DURATION_OPTIONS.find((opt) => opt.seconds === seconds) ??
    DURATION_OPTIONS[1];
  const selectedStopCount = Math.min(
    TOUR_STOPS[seconds] ?? 0,
    spots.length,
  );

  function toggleTheme(theme: Theme) {
    setLocalError(null);
    onClearNotice?.();
    setThemes((prev) =>
      prev.includes(theme)
        ? prev.filter((item) => item !== theme)
        : [...prev, theme],
    );
  }

  async function handleStart() {
    if (isStarting) return;
    setIsStarting(true);
    setLocalError(null);
    onClearNotice?.();
    dispatch({ type: "load" });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);
    let plan: TourPlan;

    try {
      const res = await fetch("/api/tour/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds, themes }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error("Tour plan request failed");
      }

      const body: unknown = await res.json();
      if (!isValidTourPlan(body)) {
        throw new Error("Invalid tour plan payload");
      }

      plan = body;
    } catch {
      plan = fallbackPlan(pickStops(spots, seconds, themes));
    } finally {
      clearTimeout(timeoutId);
    }

    let sanitizedStops = sanitizeStops(plan.stops, spots);

    if (sanitizedStops.length === 0) {
      plan = fallbackPlan(pickStops(spots, seconds, themes));
      sanitizedStops = sanitizeStops(plan.stops, spots);
    }

    if (sanitizedStops.length === 0) {
      setLocalError(EMPTY_PLAN_MESSAGE);
      onEmptyPlan?.(EMPTY_PLAN_MESSAGE);
      setIsStarting(false);
      dispatch({ type: "restart" });
      return;
    }

    dispatch({
      type: "loaded",
      plan: {
        ...plan,
        stops: sanitizedStops,
      },
    });
  }

  const displayError = localError ?? notice;

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
      <GlassPanel
        tone="light"
        className="hidden border-border bg-surface/90 lg:col-span-5 lg:flex lg:flex-col lg:gap-5 lg:rounded-2xl lg:p-8"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold text-terracotta">
            Hành trình dọc sông Hàn
          </p>
          <h2 className="text-2xl font-bold leading-snug text-ink">
            Nghe kể chuyện nhanh theo quỹ thời gian của bạn
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Chọn thời lượng và những chủ đề bạn quan tâm. Hệ thống sẽ sắp xếp
            lộ trình các điểm văn hóa dọc sông Hàn kèm bản đồ, thuyết minh và
            phụ đề trực tiếp.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
          <div className="rounded-xl border border-border bg-sand/70 p-3">
            <dt className="text-xs font-medium text-muted">Thời lượng</dt>
            <dd className="mt-1 font-bold text-ink">
              {selectedDuration.label} ({selectedStopCount} điểm)
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-sand/70 p-3">
            <dt className="text-xs font-medium text-muted">Chủ đề</dt>
            <dd className="mt-1 font-bold text-ink">
              {themes.length === 0 ? "Tất cả nổi bật" : `${themes.length} đã chọn`}
            </dd>
          </div>
        </dl>

        <p className="text-xs leading-relaxed text-muted">
          Mỗi điểm dừng hoàn thành sẽ được ghi dấu “đã nghe tour” vào Hộ chiếu
          văn hóa của bạn.
        </p>
      </GlassPanel>

      <GlassPanel
        as="section"
        tone="light"
        className="space-y-5 rounded-2xl border-border bg-surface/90 p-5 lg:col-span-7 lg:p-8"
      >
        {displayError && (
          <p
            role="alert"
            className="rounded-md border border-terracotta/40 bg-terracotta/10 px-3.5 py-2.5 text-sm font-medium text-terracotta"
          >
            {displayError}
          </p>
        )}

        <fieldset className="space-y-2.5">
          <legend className="text-sm font-bold text-ink">Thời lượng</legend>
          <div className="grid grid-cols-3 gap-2.5">
            {DURATION_OPTIONS.map((option) => {
              const stopCount = Math.min(
                TOUR_STOPS[option.seconds] ?? 0,
                spots.length,
              );
              const checked = seconds === option.seconds;
              return (
                <motion.label
                  key={option.seconds}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  className={`flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-colors motion-reduce:transition-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta ${
                    checked
                      ? "border-terracotta bg-terracotta text-on-accent ring-1 ring-terracotta/40"
                      : "border-border bg-sand/70 text-ink hover:border-terracotta/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="tour-duration"
                    value={option.seconds}
                    checked={checked}
                    onChange={() => {
                      setLocalError(null);
                      onClearNotice?.();
                      setSeconds(option.seconds);
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold">{option.label}</span>
                  <span
                    className={`mt-0.5 text-xs ${
                      checked ? "text-on-accent/90" : "text-muted"
                    }`}
                  >
                    {stopCount} điểm
                  </span>
                </motion.label>
              );
            })}
          </div>
        </fieldset>

        {availableThemes.length > 0 && (
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-bold text-ink">
              Chủ đề quan tâm
            </legend>
            <p className="text-xs text-muted">
              Không chọn chủ đề nào để nghe tất cả điểm nổi bật dọc sông Hàn.
            </p>
            <div className="flex flex-wrap gap-2">
              {availableThemes.map((option) => {
                const checked = themes.includes(option.value);
                return (
                  <motion.label
                    key={option.value}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors motion-reduce:transition-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta ${
                      checked
                        ? "border-river bg-river text-on-accent ring-1 ring-river/40"
                        : "border-border bg-sand/70 text-ink hover:border-terracotta/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTheme(option.value)}
                      className="sr-only"
                    />
                    <span>{option.label}</span>
                  </motion.label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="pt-1">
          <GlowButton
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="min-h-11 w-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Bắt đầu tour
          </GlowButton>
        </div>
      </GlassPanel>
    </div>
  );
}

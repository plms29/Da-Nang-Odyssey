"use client";

import { useMemo, useState } from "react";
import { GlassPanel } from "@/components/fx/Glass";
import { getLevels } from "@/lib/content";
import { haptic } from "@/lib/haptics";
import { requiredLevel } from "@/lib/level/unlock";
import type { PassportState } from "@/lib/passport/logic";
import { usePrefs } from "@/lib/prefs/store";
import { getSceneKit, sceneIdForLevel, type SceneId, type SceneKit } from "@/lib/scene";
import { availableThemes } from "@/lib/theme";
import type { Level } from "@/lib/types";

export interface ThemePickerProps {
  levels?: Level[];
  levelProgress: PassportState["levels"];
  resolvedTheme: SceneId;
}

interface WorldOption {
  id: SceneId;
  name: string;
  kit: SceneKit;
  firstLevel?: Level;
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function ThemePicker({
  levels,
  levelProgress,
  resolvedTheme,
}: ThemePickerProps) {
  const [announcement, setAnnouncement] = useState("");
  const allLevels = useMemo(
    () => (levels ?? getLevels()).slice().sort((a, b) => a.order - b.order),
    [levels],
  );

  const worlds = useMemo<WorldOption[]>(() => {
    const seen = new Set<SceneId>(["home"]);
    const list: WorldOption[] = [
      {
        id: "home",
        name: "Đà Nẵng",
        kit: getSceneKit("home"),
      },
    ];

    for (const level of allLevels) {
      const id = sceneIdForLevel(level);
      if (seen.has(id)) continue;
      seen.add(id);
      list.push({
        id,
        name: level.title,
        kit: getSceneKit(id),
        firstLevel: level,
      });
    }

    return list;
  }, [allLevels]);

  const allowedSet = useMemo(
    () => new Set(availableThemes(allLevels, { levels: levelProgress })),
    [allLevels, levelProgress],
  );

  const handleSelect = (option: WorldOption) => {
    if (option.id === resolvedTheme) return;
    usePrefs.getState().setTheme(option.id);
    haptic("tap");
    setAnnouncement(`Đã đổi giao diện: ${option.name}`);
  };

  return (
    <GlassPanel as="section" aria-labelledby="theme-picker-heading" className="rounded-xl! bg-white/65! p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="theme-picker-heading" className="text-lg font-bold text-ink">
            Giao diện ứng dụng
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Chọn một thế giới bạn đã mở để làm sắc thái cho hành trình.
          </p>
        </div>
        <p role="status" aria-live="polite" className="text-xs font-semibold text-ink">
          {announcement}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {worlds.map((option) => {
          const unlocked = allowedSet.has(option.id);
          const isSelected = unlocked && resolvedTheme === option.id;

          if (!unlocked) {
            const req = option.firstLevel
              ? requiredLevel(option.firstLevel, allLevels)
              : undefined;
            const lockText = req
              ? `Hoàn thành Màn ${req.order}: ${req.title}`
              : "Chưa mở khóa";

            return (
              <div
                key={option.id}
                aria-disabled="true"
                className="flex min-h-11 cursor-not-allowed flex-col rounded-lg border border-ink/10 bg-white/50 p-2.5"
              >
                <div
                  aria-hidden="true"
                  className="relative h-20 w-full overflow-hidden rounded-md border-2 opacity-60"
                  style={{
                    background: option.kit.sky,
                    borderColor: option.kit.accent,
                  }}
                >
                  <div className="absolute inset-0 bg-sand/35 backdrop-blur-[1px]" />
                </div>
                <div className="mt-2.5 space-y-1">
                  <p className="text-sm font-bold text-ink">{option.name}</p>
                  <p className="flex items-start gap-1.5 text-xs font-medium text-muted">
                    <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{lockText}</span>
                  </p>
                </div>
              </div>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelect(option)}
              className={`group flex min-h-11 flex-col rounded-lg border bg-white/85 p-2.5 text-left transition-colors motion-reduce:transition-none hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                isSelected
                  ? "border-gold ring-2 ring-gold ring-offset-2 ring-offset-sand"
                  : "border-ink/15 hover:border-ink/30"
              }`}
            >
              <div
                aria-hidden="true"
                className="relative h-20 w-full overflow-hidden rounded-md border-2"
                style={{
                  background: option.kit.sky,
                  borderColor: option.kit.accent,
                }}
              >
                <span
                  className="absolute bottom-2 left-2 h-1.5 w-10 rounded-full opacity-90"
                  style={{ backgroundColor: option.kit.accent }}
                />
                {isSelected && (
                  <span className="absolute right-2 top-2 rounded-full border border-gold/80 bg-sand/90 px-2 py-0.5 text-[11px] font-bold text-ink">
                    Đang dùng
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink">{option.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}

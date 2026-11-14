"use client";

import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/fx/Glass";
import { AccountPanel, useUser } from "@/components/passport/AccountPanel";
import { getLevels } from "@/lib/content";
import { countStamps } from "@/lib/passport/logic";
import { usePassport } from "@/lib/passport/store";
import { usePrefs } from "@/lib/prefs/store";
import { getSceneKit, type SceneId } from "@/lib/scene";
import { supabase } from "@/lib/supabase/client";
import { availableThemes, playerTitle } from "@/lib/theme";
import { ThemePicker } from "./ThemePicker";

function UserAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string;
  displayName: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = displayName.trim().charAt(0).toUpperCase() || "Đ";

  if (!avatarUrl || failed) {
    return (
      <div
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-river text-xl font-bold text-sand"
      >
        {initial}
      </div>
    );
  }

  return (
    // Google profile photo URL is external and ephemeral; never persisted.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-16 w-16 shrink-0 rounded-full border border-ink/15 object-cover"
    />
  );
}

export function ProfileView() {
  const [passportHydrated, setPassportHydrated] = useState(false);
  const [prefsHydrated, setPrefsHydrated] = useState(false);

  const user = useUser();
  const stamps = usePassport((s) => s.stamps);
  const levelProgress = usePassport((s) => s.levels);
  const totalCodeScore = usePassport((s) => s.total_code_score);
  const storedTheme = usePrefs((s) => s.theme);

  useEffect(() => {
    const done = () => setPassportHydrated(true);
    if (usePassport.persist.hasHydrated()) done();
    return usePassport.persist.onFinishHydration(done);
  }, []);

  useEffect(() => {
    const done = () => setPrefsHydrated(true);
    if (usePrefs.persist.hasHydrated()) done();
    return usePrefs.persist.onFinishHydration(done);
  }, []);

  const hydrated = passportHydrated && prefsHydrated;

  if (!hydrated) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Đang tải hồ sơ"
        className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start"
      >
        <span className="sr-only">Đang tải hồ sơ…</span>
        <div className="space-y-4 lg:col-span-5">
          <div className="h-28 animate-pulse rounded-xl border border-ink/10 bg-white/60" />
          <div className="h-32 animate-pulse rounded-xl border border-ink/10 bg-white/60" />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-lg border border-ink/10 bg-white/60"
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="h-80 animate-pulse rounded-xl border border-ink/10 bg-white/60" />
        </div>
      </div>
    );
  }

  const allLevels = getLevels();
  const allowedThemes = availableThemes(allLevels, { levels: levelProgress });
  const resolvedTheme: SceneId = allowedThemes.includes(storedTheme)
    ? storedTheme
    : "home";
  const resolvedKit = getSceneKit(resolvedTheme);

  const { title, pages, nextAt } = playerTitle(allLevels, {
    levels: levelProgress,
  });
  const totalLevels = allLevels.length;
  const progressPercent =
    totalLevels > 0 ? Math.min(100, Math.round((pages / totalLevels) * 100)) : 0;

  const totalStars = Object.values(levelProgress).reduce(
    (sum, entry) => sum + entry.stars,
    0,
  );
  const stampCounts = countStamps({
    stamps,
    levels: levelProgress,
    total_code_score: totalCodeScore,
  });

  const avatarUrl =
    user && typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "";
  const displayName = user
    ? (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name.trim()) ||
      user.email ||
      "Người chơi"
    : "";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      <div className="space-y-4 lg:col-span-5">
        <section aria-label="Thông tin tài khoản" className="space-y-3">
          <GlassPanel className="rounded-xl! bg-white/70! p-4">
            {supabase === null || user === null ? (
              <div className="space-y-1">
                <p className="text-base font-bold text-ink">Chơi trên máy này</p>
                <p className="text-xs text-muted">
                  Tiến độ và giao diện hiện đang lưu trên trình duyệt của bạn.
                </p>
              </div>
            ) : user === undefined ? (
              <>
                <span role="status" className="sr-only">
                  Đang tải tài khoản…
                </span>
                <div
                  aria-hidden="true"
                  className="h-16 animate-pulse rounded-lg bg-ink/10"
                />
              </>
            ) : (
              <div className="flex items-center gap-4">
                <UserAvatar
                  key={avatarUrl}
                  avatarUrl={avatarUrl}
                  displayName={displayName}
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-ink">
                    {displayName}
                  </p>
                  {user.email && user.email !== displayName && (
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  )}
                </div>
              </div>
            )}
          </GlassPanel>

          <AccountPanel />
        </section>

        <GlassPanel
          as="section"
          aria-labelledby="title-card-heading"
          className="rounded-xl! border-2 bg-white/75! p-4"
          style={{ borderColor: resolvedKit.accent }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Danh hiệu hiện tại
              </p>
              <h2 id="title-card-heading" className="mt-0.5 text-lg font-bold text-ink">
                {title}
              </h2>
            </div>
            <span className="shrink-0 text-xs font-bold text-ink">
              {pages}/{totalLevels} trang
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={pages}
            aria-valuemin={0}
            aria-valuemax={totalLevels}
            aria-label="Số trang sổ tay đã tìm"
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ink/10"
          >
            <div
              className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: resolvedKit.accent,
              }}
            />
          </div>

          {nextAt !== null && (
            <p className="mt-2 text-xs font-medium text-muted">
              Còn {nextAt - pages} trang nữa để lên danh hiệu mới
            </p>
          )}
        </GlassPanel>

        <section aria-label="Thống kê hành trình">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <GlassPanel className="rounded-lg! bg-white/70! p-3">
              <p className="text-xs font-semibold text-muted">Tổng sao</p>
              <p className="mt-1 text-xl font-bold text-terracotta">
                {totalStars}
              </p>
            </GlassPanel>
            <GlassPanel className="rounded-lg! bg-white/70! p-3">
              <p className="text-xs font-semibold text-muted">Hoàn thành màn</p>
              <p className="mt-1 text-xl font-bold text-ink">
                {stampCounts.level}
              </p>
            </GlassPanel>
            <GlassPanel className="rounded-lg! bg-white/70! p-3">
              <p className="text-xs font-semibold text-muted">Đã nghe</p>
              <p className="mt-1 text-xl font-bold text-river">
                {stampCounts.tour}
              </p>
            </GlassPanel>
            <GlassPanel className="rounded-lg! bg-white/70! p-3">
              <p className="text-xs font-semibold text-muted">Đã đến</p>
              <p className="mt-1 text-xl font-bold text-ink">
                {stampCounts.visited}
              </p>
            </GlassPanel>
            <GlassPanel className="col-span-2 rounded-lg! bg-white/70! p-3 sm:col-span-2">
              <p className="text-xs font-semibold text-muted">Điểm hoạt động</p>
              <p className="mt-1 text-xl font-bold text-river">
                {totalCodeScore}
              </p>
            </GlassPanel>
          </div>
        </section>
      </div>

      <div className="lg:col-span-7">
        <ThemePicker
          levels={allLevels}
          levelProgress={levelProgress}
          resolvedTheme={resolvedTheme}
        />
      </div>
    </div>
  );
}

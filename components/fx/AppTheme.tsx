"use client";

import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { SceneBackdrop } from "@/components/fx/SceneBackdrop";
import { getLevels } from "@/lib/content";
import { usePassport } from "@/lib/passport/store";
import { usePrefs } from "@/lib/prefs/store";
import { getSceneKit, type SceneId } from "@/lib/scene";
import { availableThemes } from "@/lib/theme";

const HOME_ACCENT = "#A84825";

function subscribeHydration(onStoreChange: () => void): () => void {
  const unsubPassport = usePassport.persist.onFinishHydration(() => onStoreChange());
  const unsubPrefs = usePrefs.persist.onFinishHydration(() => onStoreChange());
  return () => {
    unsubPassport();
    unsubPrefs();
  };
}

function getHydrationSnapshot(): boolean {
  return usePassport.persist.hasHydrated() && usePrefs.persist.hasHydrated();
}

function getServerHydrationSnapshot(): boolean {
  return false;
}

/** Resolves the account's active theme after both stores hydrate, defaulting to "home". */
export function useAppTheme(): SceneId {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const levels = usePassport((s) => s.levels);
  const theme = usePrefs((s) => s.theme);

  if (!hydrated) return "home";
  return availableThemes(getLevels(), { levels }).includes(theme)
    ? theme
    : "home";
}

/** Exposes `--app-accent`; the page background itself comes from AppBackground. */
export function AppThemeFrame({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const kit = getSceneKit(theme);
  const accent = theme === "home" ? HOME_ACCENT : kit.accent;

  return (
    <div
      className="flex flex-1 flex-col"
      style={{ "--app-accent": accent } as CSSProperties}
    >
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Renders the home hero backdrop using the player's resolved app theme. */
export function ThemedHomeBackdrop() {
  const theme = useAppTheme();
  return <SceneBackdrop kit={getSceneKit(theme)} />;
}

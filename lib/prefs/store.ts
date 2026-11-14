import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SceneId } from "@/lib/scene";
import { defaultPrefs, type Prefs } from "./logic";

export interface PrefsStore extends Prefs {
  /** Callers must only pass a theme from availableThemes(); sync re-checks it on load. */
  setTheme: (theme: SceneId) => void;
}

export const usePrefs = create<PrefsStore>()(
  persist(
    (set) => ({
      ...defaultPrefs(),
      setTheme: (theme) => set({ theme, theme_at: Date.now() }),
    }),
    {
      name: "dn-prefs",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): Prefs => ({ theme: s.theme, theme_at: s.theme_at }),
    },
  ),
);

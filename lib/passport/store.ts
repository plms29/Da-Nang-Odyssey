import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StampKind } from "@/lib/types";
import {
  applyLevelResult,
  applyStamp,
  emptyPassport,
  type PassportState,
} from "./logic";

export interface PassportStore extends PassportState {
  stamp: (spotId: string, kind: StampKind) => void;
  recordLevel: (levelId: string, stars: 1 | 2 | 3, codeScore: number) => void;
  reset: () => void;
}

function localToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const usePassport = create<PassportStore>()(
  persist(
    (set) => ({
      ...emptyPassport(),
      stamp: (spotId, kind) =>
        set((state) => applyStamp(state, spotId, kind, localToday())),
      recordLevel: (levelId, stars, codeScore) =>
        set((state) => applyLevelResult(state, levelId, stars, codeScore)),
      reset: () => set(() => emptyPassport()),
    }),
    {
      name: "dn-passport",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PassportState => ({
        stamps: state.stamps,
        levels: state.levels,
        total_code_score: state.total_code_score,
      }),
    },
  ),
);

import type { StampKind } from "@/lib/types";

export interface PassportState {
  stamps: Record<string, { level?: boolean; tour?: boolean; visited?: string }>;
  levels: Record<string, { stars: 1 | 2 | 3; code_score: number }>;
  total_code_score: number;
}

export function emptyPassport(): PassportState {
  return {
    stamps: {},
    levels: {},
    total_code_score: 0,
  };
}

export function applyStamp(
  state: PassportState,
  spotId: string,
  kind: StampKind,
  today: string,
): PassportState {
  const prev = state.stamps[spotId] ?? {};
  const nextEntry: { level?: boolean; tour?: boolean; visited?: string } = { ...prev };

  if (kind === "level") {
    nextEntry.level = true;
  } else if (kind === "tour") {
    nextEntry.tour = true;
  } else {
    // Keep the first visit date once recorded.
    nextEntry.visited = prev.visited || today;
  }

  return {
    stamps: {
      ...state.stamps,
      [spotId]: nextEntry,
    },
    levels: state.levels,
    total_code_score: state.total_code_score,
  };
}

export function applyLevelResult(
  state: PassportState,
  levelId: string,
  stars: 1 | 2 | 3,
  codeScore: number,
): PassportState {
  const prev = state.levels[levelId];
  const bestStars = (prev ? Math.max(prev.stars, stars) : stars) as 1 | 2 | 3;
  const bestScore = prev ? Math.max(prev.code_score, codeScore) : codeScore;

  const nextLevels: PassportState["levels"] = {
    ...state.levels,
    [levelId]: {
      stars: bestStars,
      code_score: bestScore,
    },
  };

  const total_code_score = Object.values(nextLevels).reduce(
    (sum, entry) => sum + entry.code_score,
    0,
  );

  return {
    stamps: state.stamps,
    levels: nextLevels,
    total_code_score,
  };
}

export function countStamps(state: PassportState): {
  level: number;
  tour: number;
  visited: number;
} {
  let level = 0;
  let tour = 0;
  let visited = 0;

  for (const entry of Object.values(state.stamps)) {
    if (entry.level) level += 1;
    if (entry.tour) tour += 1;
    if (entry.visited) visited += 1;
  }

  return { level, tour, visited };
}

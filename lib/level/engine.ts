import type { JudgeResult, Level, Station, StationResult } from "@/lib/types";

export type LevelPhase = "intro" | "station" | "reveal";

export interface LevelState {
  levelId: string;
  phase: LevelPhase;
  stationIndex: 0 | 1 | 2;
  results: StationResult[];
  judge: JudgeResult | null;
}

export type LevelAction =
  | { type: "start" }
  | { type: "completeActivity"; result: StationResult }
  | { type: "submitExpress"; judge: JudgeResult }
  | { type: "restart" };

/** Create the initial state for a level at the intro phase. */
export function initLevel(level: Level): LevelState {
  return {
    levelId: level.id,
    phase: "intro",
    stationIndex: 0,
    results: [],
    judge: null,
  };
}

/** Pure state machine reducer for advancing through a 3-station level. */
export function levelReducer(
  state: LevelState,
  action: LevelAction
): LevelState {
  switch (action.type) {
    case "start": {
      if (state.phase !== "intro") return state;
      return {
        ...state,
        phase: "station",
        stationIndex: 0,
      };
    }

    case "completeActivity": {
      if (
        state.phase !== "station" ||
        (state.stationIndex !== 0 && state.stationIndex !== 1) ||
        !action.result.correct
      ) {
        return state;
      }
      const nextIndex = state.stationIndex === 0 ? 1 : 2;
      return {
        ...state,
        stationIndex: nextIndex,
        results: [...state.results, action.result],
      };
    }

    case "submitExpress": {
      if (state.phase !== "station" || state.stationIndex !== 2) return state;
      return {
        ...state,
        phase: "reveal",
        judge: action.judge,
      };
    }

    case "restart": {
      return {
        levelId: state.levelId,
        phase: "intro",
        stationIndex: 0,
        results: [],
        judge: null,
      };
    }
  }
}

/** Sum the scores from activity stations 1 and 2, excluding the judge score. */
export function codeScore(state: LevelState): number {
  return state.results.reduce((total, result) => total + result.score, 0);
}

/** Return the star rating awarded by the express station judge, if present. */
export function levelStars(state: LevelState): 1 | 2 | 3 | null {
  return state.judge?.stars ?? null;
}

/** Return the station at state.stationIndex from level, or null if none. */
export function currentStation(
  level: Level,
  state: LevelState
): Station | null {
  return level.stations[state.stationIndex] ?? null;
}

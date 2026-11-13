import type { TourPlan, TourStop } from "@/lib/types";

export type TourPhase = "setup" | "loading" | "stop" | "activity" | "end";

export interface TourState {
  phase: TourPhase;
  plan: TourPlan | null;
  stopIndex: number;
  activityDone: Record<string, "done" | "skipped">;
  listened: string[];
}

export type TourAction =
  | { type: "load" }
  | { type: "loaded"; plan: TourPlan }
  | { type: "narrationEnded" }
  | { type: "activityDone"; spotId: string }
  | { type: "activitySkipped"; spotId: string }
  | { type: "next" }
  | { type: "skipStop" }
  | { type: "restart" };

/** Create the initial state for a 5-minute tour at the setup phase. */
export function initialTour(): TourState {
  return {
    phase: "setup",
    plan: null,
    stopIndex: 0,
    activityDone: {},
    listened: [],
  };
}

function currentStop(state: TourState): TourStop | undefined {
  return state.plan?.stops[state.stopIndex];
}

function advanceStop(state: TourState): TourState {
  if (!state.plan) return state;
  const nextIndex = state.stopIndex + 1;
  if (nextIndex >= state.plan.stops.length) {
    return { ...state, phase: "end" };
  }
  return {
    ...state,
    phase: "stop",
    stopIndex: nextIndex,
  };
}

function recordActivity(
  state: TourState,
  spotId: string,
  status: "done" | "skipped"
): TourState {
  const stop = currentStop(state);
  if (state.phase !== "activity" || !stop || spotId !== stop.spot_id) {
    return state;
  }
  return {
    ...state,
    activityDone: {
      ...state.activityDone,
      [spotId]: status,
    },
  };
}

/** Pure state machine reducer for advancing through a 5-minute tour. */
export function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case "load": {
      if (state.phase !== "setup") return state;
      return {
        ...state,
        phase: "loading",
      };
    }

    case "loaded": {
      if (state.phase !== "loading" || action.plan.stops.length === 0) {
        return state;
      }
      return {
        ...state,
        phase: "stop",
        plan: action.plan,
        stopIndex: 0,
      };
    }

    case "narrationEnded": {
      const stop = currentStop(state);
      if (state.phase !== "stop" || !stop) return state;
      const listened = state.listened.includes(stop.spot_id)
        ? state.listened
        : [...state.listened, stop.spot_id];
      return {
        ...state,
        phase: "activity",
        listened,
      };
    }

    case "activityDone":
      return recordActivity(state, action.spotId, "done");

    case "activitySkipped":
      return recordActivity(state, action.spotId, "skipped");

    case "next": {
      if (state.phase !== "activity") return state;
      return advanceStop(state);
    }

    case "skipStop": {
      if (state.phase !== "stop") return state;
      return advanceStop(state);
    }

    case "restart":
      return initialTour();
  }
}

/** Return the list of spot IDs whose tour narration finished playing. */
export function listenedSpotIds(state: TourState): string[] {
  return state.listened;
}

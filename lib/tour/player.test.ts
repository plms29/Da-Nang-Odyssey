import { describe, expect, it } from "vitest";
import {
  initialTour,
  listenedSpotIds,
  tourReducer,
  type TourState,
} from "@/lib/tour/player";
import type { TourPlan } from "@/lib/types";

const samplePlan: TourPlan = {
  generated_by: "fallback",
  stops: [
    {
      spot_id: "bao-tang-cham",
      narration: "Lời kể điểm một.",
      transition: "",
      seconds: 60,
    },
    {
      spot_id: "cau-rong",
      narration: "Lời kể điểm hai.",
      transition: "Tiếp theo, chúng ta đến Cầu Rồng.",
      seconds: 60,
    },
  ],
};

const emptyPlan: TourPlan = {
  generated_by: "fallback",
  stops: [],
};

describe("tour player state machine", () => {
  it("runs the full happy path through 2 stops and resets cleanly", () => {
    const s0 = initialTour();
    expect(s0).toEqual({
      phase: "setup",
      plan: null,
      stopIndex: 0,
      activityDone: {},
      listened: [],
    });
    expect(listenedSpotIds(s0)).toEqual([]);

    const s1 = tourReducer(s0, { type: "load" });
    expect(s1.phase).toBe("loading");

    const s2 = tourReducer(s1, { type: "loaded", plan: samplePlan });
    expect(s2.phase).toBe("stop");
    expect(s2.plan).toBe(samplePlan);
    expect(s2.stopIndex).toBe(0);

    const s3 = tourReducer(s2, { type: "narrationEnded" });
    expect(s3.phase).toBe("activity");
    expect(listenedSpotIds(s3)).toEqual(["bao-tang-cham"]);

    const s4 = tourReducer(s3, {
      type: "activityDone",
      spotId: "bao-tang-cham",
    });
    expect(s4.phase).toBe("activity");
    expect(s4.activityDone).toEqual({ "bao-tang-cham": "done" });

    const s5 = tourReducer(s4, { type: "next" });
    expect(s5.phase).toBe("stop");
    expect(s5.stopIndex).toBe(1);

    const s6 = tourReducer(s5, { type: "narrationEnded" });
    expect(s6.phase).toBe("activity");
    expect(listenedSpotIds(s6)).toEqual(["bao-tang-cham", "cau-rong"]);

    const s7 = tourReducer(s6, {
      type: "activitySkipped",
      spotId: "cau-rong",
    });
    expect(s7.phase).toBe("activity");
    expect(s7.activityDone).toEqual({
      "bao-tang-cham": "done",
      "cau-rong": "skipped",
    });

    const s8 = tourReducer(s7, { type: "next" });
    expect(s8.phase).toBe("end");
    expect(listenedSpotIds(s8)).toEqual(["bao-tang-cham", "cau-rong"]);

    const restarted = tourReducer(s8, { type: "restart" });
    expect(restarted).toEqual(initialTour());
  });

  it("handles skipStop without recording the spot in listened", () => {
    const loading = tourReducer(initialTour(), { type: "load" });
    const atStop0 = tourReducer(loading, { type: "loaded", plan: samplePlan });

    const atStop1 = tourReducer(atStop0, { type: "skipStop" });
    expect(atStop1.phase).toBe("stop");
    expect(atStop1.stopIndex).toBe(1);
    expect(listenedSpotIds(atStop1)).toEqual([]);

    const atEnd = tourReducer(atStop1, { type: "skipStop" });
    expect(atEnd.phase).toBe("end");
    expect(listenedSpotIds(atEnd)).toEqual([]);
  });

  it("does not duplicate spot IDs in listened", () => {
    const loading = tourReducer(initialTour(), { type: "load" });
    const atStop0 = tourReducer(loading, { type: "loaded", plan: samplePlan });
    const preListened: TourState = {
      ...atStop0,
      listened: ["bao-tang-cham"],
    };

    const atActivity0 = tourReducer(preListened, { type: "narrationEnded" });
    expect(atActivity0.phase).toBe("activity");
    expect(listenedSpotIds(atActivity0)).toEqual(["bao-tang-cham"]);
  });

  it("ignores invalid actions and returns the exact same state reference", () => {
    const setup = initialTour();
    expect(tourReducer(setup, { type: "loaded", plan: samplePlan })).toBe(setup);
    expect(tourReducer(setup, { type: "narrationEnded" })).toBe(setup);
    expect(
      tourReducer(setup, { type: "activityDone", spotId: "bao-tang-cham" })
    ).toBe(setup);
    expect(
      tourReducer(setup, { type: "activitySkipped", spotId: "bao-tang-cham" })
    ).toBe(setup);
    expect(tourReducer(setup, { type: "next" })).toBe(setup);
    expect(tourReducer(setup, { type: "skipStop" })).toBe(setup);

    const loading = tourReducer(setup, { type: "load" });
    expect(tourReducer(loading, { type: "load" })).toBe(loading);
    expect(tourReducer(loading, { type: "loaded", plan: emptyPlan })).toBe(
      loading
    );
    expect(tourReducer(loading, { type: "narrationEnded" })).toBe(loading);
    expect(
      tourReducer(loading, { type: "activityDone", spotId: "bao-tang-cham" })
    ).toBe(loading);
    expect(tourReducer(loading, { type: "next" })).toBe(loading);
    expect(tourReducer(loading, { type: "skipStop" })).toBe(loading);

    const atStop = tourReducer(loading, { type: "loaded", plan: samplePlan });
    expect(tourReducer(atStop, { type: "load" })).toBe(atStop);
    expect(tourReducer(atStop, { type: "loaded", plan: samplePlan })).toBe(
      atStop
    );
    expect(
      tourReducer(atStop, { type: "activityDone", spotId: "bao-tang-cham" })
    ).toBe(atStop);
    expect(
      tourReducer(atStop, { type: "activitySkipped", spotId: "bao-tang-cham" })
    ).toBe(atStop);
    expect(tourReducer(atStop, { type: "next" })).toBe(atStop);

    const atActivity = tourReducer(atStop, { type: "narrationEnded" });
    expect(tourReducer(atActivity, { type: "load" })).toBe(atActivity);
    expect(
      tourReducer(atActivity, { type: "loaded", plan: samplePlan })
    ).toBe(atActivity);
    expect(tourReducer(atActivity, { type: "narrationEnded" })).toBe(
      atActivity
    );
    expect(tourReducer(atActivity, { type: "skipStop" })).toBe(atActivity);

    const atEnd = tourReducer(
      tourReducer(tourReducer(atActivity, { type: "next" }), {
        type: "skipStop",
      }),
      { type: "restart" }
    );
    expect(atEnd).toEqual(setup);

    const ended = tourReducer(
      tourReducer(atActivity, { type: "next" }),
      { type: "skipStop" }
    );
    expect(ended.phase).toBe("end");
    expect(tourReducer(ended, { type: "load" })).toBe(ended);
    expect(tourReducer(ended, { type: "loaded", plan: samplePlan })).toBe(
      ended
    );
    expect(tourReducer(ended, { type: "narrationEnded" })).toBe(ended);
    expect(
      tourReducer(ended, { type: "activityDone", spotId: "cau-rong" })
    ).toBe(ended);
    expect(tourReducer(ended, { type: "next" })).toBe(ended);
    expect(tourReducer(ended, { type: "skipStop" })).toBe(ended);
  });

  it("ignores activityDone and activitySkipped for a wrong spot ID", () => {
    const loading = tourReducer(initialTour(), { type: "load" });
    const atStop0 = tourReducer(loading, { type: "loaded", plan: samplePlan });
    const atActivity0 = tourReducer(atStop0, { type: "narrationEnded" });

    const doneWrong = tourReducer(atActivity0, {
      type: "activityDone",
      spotId: "cau-rong",
    });
    expect(doneWrong).toBe(atActivity0);
    expect(doneWrong.activityDone).toEqual({});

    const skippedWrong = tourReducer(atActivity0, {
      type: "activitySkipped",
      spotId: "unknown-spot",
    });
    expect(skippedWrong).toBe(atActivity0);
    expect(skippedWrong.activityDone).toEqual({});
  });

  it("restarts from every phase back to initialTour", () => {
    const setup = initialTour();
    const loading = tourReducer(setup, { type: "load" });
    const atStop = tourReducer(loading, { type: "loaded", plan: samplePlan });
    const atActivity = tourReducer(atStop, { type: "narrationEnded" });
    const atEnd = tourReducer(
      tourReducer(atActivity, { type: "next" }),
      { type: "skipStop" }
    );

    for (const state of [setup, loading, atStop, atActivity, atEnd]) {
      expect(tourReducer(state, { type: "restart" })).toEqual(initialTour());
    }
  });
});

import { describe, it, expect } from "vitest";
import {
  codeScore,
  currentStation,
  initLevel,
  levelReducer,
  levelStars,
} from "@/lib/level/engine";
import type { JudgeResult, Level, StationResult } from "@/lib/types";

const sampleLevel: Level = {
  id: "man-1-dau-an-cham",
  order: 1,
  title: "Dấu ấn Chăm",
  spot_ids: ["bao-tang-cham"],
  intro: { text: "Truyện dẫn" },
  stations: [
    {
      id: "tim",
      type: "map_pin",
      clue: "Manh mối",
      target: { lat: 16.06, lng: 108.22, radius_m: 150 },
      hints: ["G1", "G2", "G3"],
    },
    {
      id: "lam",
      type: "jigsaw",
      instruction: "Ghép hình",
      image: "images/man-1.jpg",
      grid: [3, 3],
      hints: ["G1", "G2", "G3"],
    },
    {
      id: "the-hien",
      type: "open_text_or_voice",
      prompt: "Thuyết minh",
      max_chars: 600,
      rubric: [{ id: "dung", desc: "Đúng tri thức" }],
    },
  ],
  reveal: { text: "Mở khóa", sources: [] },
  status: "draft",
};

const sampleJudge: JudgeResult = {
  criteria: [{ id: "dung", score: 3, evidence: "Đủ ý" }],
  score: 9,
  stars: 3,
  praise: "Rất tốt",
  addition: "Bổ sung nhỏ",
  graded_by: "fallback",
};

describe("level engine", () => {
  it("runs the full happy path intro -> station -> reveal and restarts cleanly", () => {
    const s0 = initLevel(sampleLevel);
    expect(s0).toEqual({
      levelId: "man-1-dau-an-cham",
      phase: "intro",
      stationIndex: 0,
      results: [],
      judge: null,
    });
    expect(codeScore(s0)).toBe(0);
    expect(levelStars(s0)).toBeNull();

    const s1 = levelReducer(s0, { type: "start" });
    expect(s1.phase).toBe("station");
    expect(s1.stationIndex).toBe(0);
    expect(currentStation(sampleLevel, s1)).toBe(sampleLevel.stations[0]);

    const res1: StationResult = { correct: true, score: 100, hints_used: 0 };
    const s2 = levelReducer(s1, { type: "completeActivity", result: res1 });
    expect(s2.phase).toBe("station");
    expect(s2.stationIndex).toBe(1);
    expect(s2.results).toEqual([res1]);
    expect(currentStation(sampleLevel, s2)).toBe(sampleLevel.stations[1]);

    const res2: StationResult = { correct: true, score: 80, hints_used: 1 };
    const s3 = levelReducer(s2, { type: "completeActivity", result: res2 });
    expect(s3.phase).toBe("station");
    expect(s3.stationIndex).toBe(2);
    expect(s3.results).toEqual([res1, res2]);
    expect(currentStation(sampleLevel, s3)).toBe(sampleLevel.stations[2]);

    const s4 = levelReducer(s3, { type: "submitExpress", judge: sampleJudge });
    expect(s4.phase).toBe("reveal");
    expect(s4.stationIndex).toBe(2);
    expect(s4.judge).toBe(sampleJudge);
    expect(levelStars(s4)).toBe(3);

    const restarted = levelReducer(s4, { type: "restart" });
    expect(restarted).toEqual(s0);
  });

  it("ignores invalid actions and returns the exact same state reference", () => {
    const intro = initLevel(sampleLevel);
    expect(
      levelReducer(intro, {
        type: "completeActivity",
        result: { correct: true, score: 100, hints_used: 0 },
      })
    ).toBe(intro);
    expect(
      levelReducer(intro, { type: "submitExpress", judge: sampleJudge })
    ).toBe(intro);

    const at0 = levelReducer(intro, { type: "start" });
    expect(levelReducer(at0, { type: "start" })).toBe(at0);
    expect(
      levelReducer(at0, { type: "submitExpress", judge: sampleJudge })
    ).toBe(at0);

    const at1 = levelReducer(at0, {
      type: "completeActivity",
      result: { correct: true, score: 100, hints_used: 0 },
    });
    expect(
      levelReducer(at1, { type: "submitExpress", judge: sampleJudge })
    ).toBe(at1);

    const at2 = levelReducer(at1, {
      type: "completeActivity",
      result: { correct: true, score: 80, hints_used: 1 },
    });
    expect(
      levelReducer(at2, {
        type: "completeActivity",
        result: { correct: true, score: 100, hints_used: 0 },
      })
    ).toBe(at2);

    const reveal = levelReducer(at2, {
      type: "submitExpress",
      judge: sampleJudge,
    });
    expect(levelReducer(reveal, { type: "start" })).toBe(reveal);
    expect(
      levelReducer(reveal, {
        type: "completeActivity",
        result: { correct: true, score: 100, hints_used: 0 },
      })
    ).toBe(reveal);
    expect(
      levelReducer(reveal, { type: "submitExpress", judge: sampleJudge })
    ).toBe(reveal);
  });

  it("does not advance when an activity result is incorrect", () => {
    const at0 = levelReducer(initLevel(sampleLevel), { type: "start" });
    const wrongResult: StationResult = {
      correct: false,
      score: 0,
      hints_used: 1,
    };

    const next0 = levelReducer(at0, {
      type: "completeActivity",
      result: wrongResult,
    });
    expect(next0).toBe(at0);
    expect(next0.stationIndex).toBe(0);
    expect(next0.results).toEqual([]);

    const at1 = levelReducer(at0, {
      type: "completeActivity",
      result: { correct: true, score: 100, hints_used: 0 },
    });
    const next1 = levelReducer(at1, {
      type: "completeActivity",
      result: wrongResult,
    });
    expect(next1).toBe(at1);
    expect(next1.stationIndex).toBe(1);
    expect(next1.results).toHaveLength(1);
  });

  it("computes codeScore from activity stations only and excludes judge score", () => {
    let state = levelReducer(initLevel(sampleLevel), { type: "start" });
    state = levelReducer(state, {
      type: "completeActivity",
      result: { correct: true, score: 100, hints_used: 0 },
    });
    state = levelReducer(state, {
      type: "completeActivity",
      result: { correct: true, score: 60, hints_used: 2 },
    });
    state = levelReducer(state, {
      type: "submitExpress",
      judge: { ...sampleJudge, score: 9, stars: 1 },
    });

    expect(codeScore(state)).toBe(160);
    expect(levelStars(state)).toBe(1);
  });
});

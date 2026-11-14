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

/** Union of two passports: keeps every stamp, best stars/score per level, earliest visit date. */
export function mergePassports(a: PassportState, b: PassportState): PassportState {
  let merged: PassportState = { ...a, stamps: { ...a.stamps } };
  for (const [spotId, s] of Object.entries(b.stamps)) {
    const prev = merged.stamps[spotId] ?? {};
    const visited = [prev.visited, s.visited].filter(Boolean).sort()[0];
    merged.stamps[spotId] = {
      ...prev,
      ...(prev.level || s.level ? { level: true } : {}),
      ...(prev.tour || s.tour ? { tour: true } : {}),
      ...(visited ? { visited } : {}),
    };
  }
  for (const [levelId, l] of Object.entries(b.levels)) {
    merged = applyLevelResult(merged, levelId, l.stars, l.code_score);
  }
  return merged;
}

// Ids are content slugs; anything else (incl. "__proto__") is dropped. Caps keep a hostile row small.
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_KEYS = 200;
const MAX_CODE_SCORE = 1_000_000;

/** Untrusted passport (cloud row): keep only well-formed stamps and level results; recompute the total. */
export function sanitizePassport(raw: unknown): PassportState {
  const obj = (v: unknown) => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const entries = (v: unknown) => Object.entries(obj(v)).filter(([id]) => SAFE_ID.test(id)).slice(0, MAX_KEYS);
  const r = obj(raw);
  const stamps: PassportState["stamps"] = {};
  for (const [id, v] of entries(r.stamps)) {
    const s = obj(v);
    stamps[id] = {
      ...(s.level === true ? { level: true } : {}),
      ...(s.tour === true ? { tour: true } : {}),
      ...(typeof s.visited === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.visited) ? { visited: s.visited } : {}),
    };
  }
  let state: PassportState = { stamps, levels: {}, total_code_score: 0 };
  for (const [id, v] of entries(r.levels)) {
    const l = obj(v);
    const score =
      typeof l.code_score === "number" && Number.isFinite(l.code_score)
        ? Math.min(MAX_CODE_SCORE, Math.max(0, l.code_score))
        : 0;
    if (l.stars === 1 || l.stars === 2 || l.stars === 3) state = applyLevelResult(state, id, l.stars, score);
  }
  return state;
}

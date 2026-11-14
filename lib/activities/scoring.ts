import { distanceMeters } from "@/lib/geo/distance";
import type {
  LatLng,
  MapPinStation,
  MatchStation,
  OrderStation,
  JudgeResult,
  RecipeStation,
  RetellStation,
  SpotDiffStation,
  StationResult,
} from "@/lib/types";

/** Compute activity score from hints and wrong attempts, floored at 20. */
export function attemptScore(hintsUsed: number, wrongAttempts: number): number {
  return Math.max(20, 100 - 20 * hintsUsed - 10 * wrongAttempts);
}

/** Check whether a map pin falls within the target radius (in metres). */
export function checkMapPin(
  station: MapPinStation,
  pin: LatLng
): { correct: boolean; distance_m: number } {
  const distance_m = distanceMeters(pin, station.target);
  return {
    correct: distance_m <= station.target.radius_m,
    distance_m,
  };
}

/** Check whether every jigsaw slot contains its matching piece index. */
export function checkJigsaw(
  placement: number[],
  grid: [number, number]
): boolean {
  const [rows, cols] = grid;
  const total = rows * cols;
  if (placement.length !== total) return false;
  return placement.every((pieceIndex, slotIndex) => pieceIndex === slotIndex);
}

/** Check whether submitted item IDs match the station's canonical order. */
export function checkOrder(
  station: OrderStation,
  submittedIds: string[]
): boolean {
  if (submittedIds.length !== station.items.length) return false;
  return station.items.every((item, index) => submittedIds[index] === item.id);
}

/** Check whether every pair ID maps to itself with an exact key count match. */
export function checkMatch(
  station: MatchStation,
  mapping: Record<string, string>
): boolean {
  if (Object.keys(mapping).length !== station.pairs.length) return false;
  return station.pairs.every(
    (pair) =>
      Object.prototype.hasOwnProperty.call(mapping, pair.id) &&
      mapping[pair.id] === pair.id
  );
}

/** Check whether the bowl holds exactly the recipe steps, in order (no distractors). */
export function checkRecipe(station: RecipeStation, submittedIds: string[]): boolean {
  if (submittedIds.length !== station.steps.length) return false;
  return station.steps.every((step, index) => submittedIds[index] === step.id);
}

/** Return the id of the spot hit by a tap at (x, y) percent of the picture, or null. */
export function hitSpot(
  station: SpotDiffStation,
  x: number,
  y: number,
  aspect = 1,
): string | null {
  // r is a percent of width; y percents are scaled by aspect (height / width) so the hit area is round.
  const hit = station.spots.find(
    (s) => Math.hypot(x - s.x, (y - s.y) * aspect) <= s.r,
  );
  return hit?.id ?? null;
}

/** Check whether every changed spot has been found. */
export function checkSpotDiff(station: SpotDiffStation, foundIds: string[]): boolean {
  const found = new Set(foundIds);
  return station.spots.every((s) => found.has(s.id));
}

/** Build a StationResult; incorrect attempts always score 0. */
export function finalResult(
  correct: boolean,
  hintsUsed: number,
  wrongAttempts: number
): StationResult {
  return {
    correct,
    score: correct ? attemptScore(hintsUsed, wrongAttempts) : 0,
    hints_used: hintsUsed,
  };
}

/** Grade a learn_retell station: every blank is filled at the end, so stars come from wrong picks. */
export function checkRetell(station: RetellStation, wrongPicks: number): JudgeResult {
  const total = station.blanks.length;
  const score = Math.max(20, Math.round(100 - (60 * wrongPicks) / Math.max(1, total)));
  const stars: 1 | 2 | 3 = wrongPicks === 0 ? 3 : score >= 60 ? 2 : 1;
  return {
    criteria: [{ id: "du-y", score: stars, evidence: `${total} chỗ trống, chọn sai ${wrongPicks} lần` }],
    score,
    stars,
    praise: wrongPicks === 0 ? "Bạn nhớ trọn cả bài!" : "Bạn đã hoàn thành cả bài.",
    addition: "",
    graded_by: "local",
  };
}

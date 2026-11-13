import { distanceMeters } from "@/lib/geo/distance";
import type {
  LatLng,
  MapPinStation,
  MatchStation,
  OrderStation,
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

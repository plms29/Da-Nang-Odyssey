import type { Spot, Theme, TourPlan } from "@/lib/types";
import { TOUR_STOPS, TRANSITION_FALLBACK } from "./config";

/** Select tour stops by duration and preferred themes, sorted along the river route. */
export function pickStops(spots: Spot[], seconds: number, themes: Theme[]): Spot[] {
  const count = TOUR_STOPS[seconds] ?? 0;
  const themeSet = new Set<Theme>(themes);
  const preferred = spots.filter((spot) => themeSet.has(spot.theme));
  const others = spots.filter((spot) => !themeSet.has(spot.theme));
  return [...preferred, ...others]
    .slice(0, count)
    .sort((a, b) => a.route_order - b.route_order);
}

/** Build a TourPlan using each spot's prebuilt fallback narration and transitions. */
export function fallbackPlan(stops: Spot[]): TourPlan {
  return {
    stops: stops.map((spot, index) => {
      const nextSpot = stops[index + 1];
      return {
        spot_id: spot.id,
        narration: spot.narration_fallback,
        transition: nextSpot
          ? TRANSITION_FALLBACK.replace("{name}", nextSpot.name)
          : "",
        seconds: spot.tour_seconds,
      };
    }),
    generated_by: "fallback",
  };
}

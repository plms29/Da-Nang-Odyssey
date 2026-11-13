import type { Spot } from "@/lib/types";
import { distanceMeters } from "@/lib/geo/distance";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy_m: number;
}

export type LocateResult =
  | { status: "inside"; spot: Spot; distance_m: number }
  | { status: "outside"; spot: Spot; distance_m: number }
  | { status: "inaccurate"; accuracy_m: number; spot: Spot };

export function locateSpot(
  spots: Spot[],
  pos: GeoPosition,
): LocateResult | null {
  if (spots.length === 0) {
    return null;
  }

  let nearest = spots[0];
  let minDistance = distanceMeters(pos, nearest.checkin);

  for (let i = 1; i < spots.length; i += 1) {
    const candidate = spots[i];
    const distance = distanceMeters(pos, candidate.checkin);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = candidate;
    }
  }

  // CK-02: reject check-in when GPS uncertainty exceeds the spot radius.
  if (pos.accuracy_m > nearest.checkin.radius_m) {
    return {
      status: "inaccurate",
      accuracy_m: pos.accuracy_m,
      spot: nearest,
    };
  }

  if (minDistance <= nearest.checkin.radius_m) {
    return {
      status: "inside",
      spot: nearest,
      distance_m: minDistance,
    };
  }

  return {
    status: "outside",
    spot: nearest,
    distance_m: minDistance,
  };
}

export function getDemoSpotId(search: string): string | null {
  const value = new URLSearchParams(search).get("demo")?.trim();
  return value ? value : null;
}

export function demoPosition(spot: Spot): GeoPosition {
  return {
    lat: spot.checkin.lat,
    lng: spot.checkin.lng,
    accuracy_m: 5,
  };
}

export function getCurrentPosition(timeoutMs = 10000): Promise<GeoPosition> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Geolocation is unavailable"));
  }

  // CK-06: return transient coordinates to caller without storing or sending them.
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
      },
    );
  });
}

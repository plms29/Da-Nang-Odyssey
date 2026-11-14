import type { LatLng } from "../types";
import { distanceMeters } from "./distance";

const COMPASS_DIRECTIONS_VI = [
  "Bắc",
  "Đông Bắc",
  "Đông",
  "Đông Nam",
  "Nam",
  "Tây Nam",
  "Tây",
  "Tây Bắc",
] as const;

/**
 * Compute forward azimuth (bearing) in degrees [0, 360) clockwise from true North
 * between two WGS-84 coordinates.
 */
export function bearingDeg(from: LatLng, to: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = rad(from.lat);
  const lat2 = rad(to.lat);
  const dLng = rad(to.lng - from.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const thetaDeg = (Math.atan2(y, x) * 180) / Math.PI;
  const normalized = ((thetaDeg % 360) + 360) % 360;
  return normalized >= 360 ? 0 : normalized;
}

/**
 * Map a bearing in degrees to the nearest of 8 Vietnamese compass directions.
 */
export function directionName(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const sectorIndex = Math.round(normalized / 45) % 8;
  return COMPASS_DIRECTIONS_VI[sectorIndex];
}

/**
 * Format a distance in metres for Vietnamese UI: rounded metres below 1 km,
 * and kilometres with one decimal place (comma separator) from 1 km upwards.
 */
export function formatDistance(m: number): string {
  const safeMeters = Math.max(0, m);
  const roundedMeters = Math.round(safeMeters / 10) * 10;
  if (roundedMeters < 1000) {
    return `${safeMeters < 10 ? Math.round(safeMeters) : roundedMeters} m`;
  }
  return `${(safeMeters / 1000).toFixed(1).replace(".", ",")} km`;
}

/**
 * Format a relative compass hint ("còn ~1,2 km về phía Đông Bắc") without exposing numeric coordinates.
 * Returns "Bạn đang ở ngay đây!" when within 10 metres.
 */
export function directionHint(from: LatLng, to: LatLng): string {
  const meters = distanceMeters(from, to);
  if (meters < 10) {
    return "Bạn đang ở ngay đây!";
  }
  const direction = directionName(bearingDeg(from, to));
  return `còn ~${formatDistance(meters)} về phía ${direction}`;
}

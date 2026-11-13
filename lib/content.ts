import type { Level, Spot } from "./types";
import spotsJson from "@/content/spots.json";
import levelsJson from "@/content/levels.json";

// Content is bundled with the app (KH mục 9); scripts/validate-content.mjs checks its shape at build time.
const spots = spotsJson as Spot[];
const levels = (levelsJson as unknown as Level[]).slice().sort((a, b) => a.order - b.order);

export const getSpots = (): Spot[] => spots;
export const getSpot = (id: string): Spot | undefined => spots.find((s) => s.id === id);
export const getLevels = (): Level[] => levels;
export const getLevel = (id: string): Level | undefined => levels.find((l) => l.id === id);
export const levelForSpot = (spotId: string): Level | undefined => levels.find((l) => l.spot_ids.includes(spotId));

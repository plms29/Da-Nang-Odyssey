import { NextResponse } from "next/server";
import { getSpots } from "@/lib/content";
import { TOUR_STOPS } from "@/lib/tour/config";
import { narrate } from "@/lib/tour/narrate";
import { pickStops } from "@/lib/tour/plan";
import type { Theme } from "@/lib/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { seconds, themes, spot_ids } = body as {
    seconds?: unknown;
    themes?: unknown;
    spot_ids?: unknown;
  };

  if (
    typeof seconds !== "number" ||
    !Number.isInteger(seconds) ||
    !Object.prototype.hasOwnProperty.call(TOUR_STOPS, seconds)
  ) {
    return NextResponse.json({ error: "Invalid tour duration seconds" }, { status: 400 });
  }

  if (
    !Array.isArray(themes) ||
    themes.length > 6 ||
    !themes.every((theme): theme is string => typeof theme === "string")
  ) {
    return NextResponse.json(
      { error: "themes must be an array of at most 6 strings" },
      { status: 400 },
    );
  }

  const spots = getSpots();
  if (
    spot_ids !== undefined &&
    (!Array.isArray(spot_ids) ||
      spot_ids.length > spots.length ||
      !spot_ids.every((id): id is string => typeof id === "string"))
  ) {
    return NextResponse.json(
      { error: "spot_ids must be an array of spot id strings" },
      { status: 400 },
    );
  }

  // Unknown ids are simply ignored by pickStops (it filters the known spot list).
  const stops = pickStops(spots, seconds, themes as Theme[], spot_ids as string[] | undefined);
  return NextResponse.json(await narrate(stops, seconds));
}

import { describe, it, expect } from "vitest";
import type { Spot } from "@/lib/types";
import { demoPosition, getDemoSpotId, locateSpot } from "./locate";

function makeSpot(id: string, lat: number, lng: number, radius_m = 200): Spot {
  return {
    id,
    name: id,
    theme: "di-san-cham",
    checkin: { lat, lng, radius_m },
    story: "Test story",
    tour_seconds: 60,
    route_order: 1,
    image: `images/${id}.jpg`,
    frame: `frames/${id}.png`,
    caption_fallback: "Caption",
    narration_fallback: "Narration",
    sources: [{ title: "Source", url: "https://example.com" }],
    status: "draft",
  };
}

const spotCham = makeSpot("bao-tang-cham", 16.06, 108.22, 200);
// ~2 km north of spotCham
const spotDienHai = makeSpot("thanh-dien-hai", 16.078, 108.22, 200);

describe("geo locate", () => {
  it("returns null when spots list is empty", () => {
    expect(locateSpot([], { lat: 16.06, lng: 108.22, accuracy_m: 10 })).toBeNull();
  });

  it("returns inside when within radius and accuracy is sufficient", () => {
    const result = locateSpot([spotCham], {
      lat: 16.0605,
      lng: 108.22,
      accuracy_m: 20,
    });
    expect(result?.status).toBe("inside");
    if (result?.status === "inside") {
      expect(result.spot.id).toBe("bao-tang-cham");
      expect(result.distance_m).toBeLessThanOrEqual(200);
    }
  });

  it("returns outside when distance exceeds radius", () => {
    const result = locateSpot([spotCham], {
      lat: 16.065,
      lng: 108.22,
      accuracy_m: 15,
    });
    expect(result?.status).toBe("outside");
    if (result?.status === "outside") {
      expect(result.spot.id).toBe("bao-tang-cham");
      expect(result.distance_m).toBeGreaterThan(200);
    }
  });

  it("returns inaccurate when accuracy_m is larger than spot radius", () => {
    const result = locateSpot([spotCham], {
      lat: 16.06,
      lng: 108.22,
      accuracy_m: 250,
    });
    expect(result).toEqual({
      status: "inaccurate",
      accuracy_m: 250,
      spot: spotCham,
    });
  });

  it("picks the nearest spot among multiple spots", () => {
    const nearDienHai = locateSpot([spotCham, spotDienHai], {
      lat: 16.0775,
      lng: 108.22,
      accuracy_m: 10,
    });
    expect(nearDienHai?.status).toBe("inside");
    expect(nearDienHai?.spot.id).toBe("thanh-dien-hai");

    const midpoint = locateSpot([spotCham, spotDienHai], {
      lat: 16.065,
      lng: 108.22,
      accuracy_m: 10,
    });
    expect(midpoint?.status).toBe("outside");
    expect(midpoint?.spot.id).toBe("bao-tang-cham");
  });

  it("parses demo query param when present, absent, or empty", () => {
    expect(getDemoSpotId("?demo=bao-tang-cham")).toBe("bao-tang-cham");
    expect(getDemoSpotId("?foo=1&demo=thanh-dien-hai")).toBe("thanh-dien-hai");
    expect(getDemoSpotId("")).toBeNull();
    expect(getDemoSpotId("?foo=bar")).toBeNull();
    expect(getDemoSpotId("?demo=")).toBeNull();
    expect(getDemoSpotId("?demo")).toBeNull();
  });

  it("builds a demo position inside the spot checkin area", () => {
    const pos = demoPosition(spotCham);
    expect(pos).toEqual({ lat: 16.06, lng: 108.22, accuracy_m: 5 });
    expect(locateSpot([spotCham], pos)).toEqual({
      status: "inside",
      spot: spotCham,
      distance_m: 0,
    });
  });
});

import { describe, expect, it } from "vitest";
import { fallbackPlan, pickStops } from "./plan";
import type { Spot, Theme } from "@/lib/types";

function makeSpot(
  id: string,
  name: string,
  theme: Theme,
  routeOrder: number,
  tourSeconds = 60,
): Spot {
  return {
    id,
    name,
    theme,
    checkin: { lat: 16.06, lng: 108.22, radius_m: 200 },
    story: `Câu chuyện về ${name}.`,
    tour_seconds: tourSeconds,
    route_order: routeOrder,
    image: `images/${id}.jpg`,
    frame: `frames/${id}.png`,
    caption_fallback: `Chú thích ${name}`,
    narration_fallback: `Lời kể dựng sẵn cho ${name}.`,
    sources: [{ title: "Nguồn", url: "https://example.com" }],
    status: "draft",
  };
}

const spots: Spot[] = [
  makeSpot("s4", "Chợ Hàn", "am-thuc", 4, 70),
  makeSpot("s2", "Thành Điện Hải", "lich-su-giu-thanh", 2, 60),
  makeSpot("s5", "Cầu Rồng", "do-thi-song-le-hoi", 5, 80),
  makeSpot("s1", "Bảo tàng Chăm", "di-san-cham", 1, 60),
  makeSpot("s3", "Điểm Bài Chòi", "nghe-thuat-dan-gian", 3, 55),
];

describe("pickStops", () => {
  it("picks the configured stop count per duration and sorts by route_order", () => {
    const shortStops = pickStops(spots, 180, []);
    expect(shortStops.map((s) => s.id)).toEqual(["s2", "s4"]);

    const mediumStops = pickStops(spots, 300, []);
    expect(mediumStops.map((s) => s.id)).toEqual(["s2", "s4", "s5"]);

    const longStops = pickStops(spots, 600, []);
    expect(longStops.map((s) => s.id)).toEqual(["s1", "s2", "s3", "s4", "s5"]);
  });

  it("prefers matching themes, fills remaining slots, and sorts by route_order", () => {
    const picked = pickStops(spots, 300, ["di-san-cham", "nghe-thuat-dan-gian"]);
    expect(picked).toHaveLength(3);
    expect(picked.map((s) => s.id)).toEqual(["s1", "s3", "s4"]);
  });

  it("returns all spots sorted by route_order when fewer spots than duration target exist", () => {
    const twoSpots = spots.slice(0, 2);
    const picked = pickStops(twoSpots, 600, ["di-san-cham"]);
    expect(picked.map((s) => s.id)).toEqual(["s2", "s4"]);
  });

  it("only uses allowed (unlocked) spots and ignores unknown ids", () => {
    const picked = pickStops(spots, 600, ["am-thuc"], ["s1", "s3", "khong-co"]);
    expect(picked.map((s) => s.id)).toEqual(["s1", "s3"]);
    expect(pickStops(spots, 300, [], [])).toEqual([]);
  });
});

describe("fallbackPlan", () => {
  it("builds prebuilt narrations and transitions with empty transition on the last stop", () => {
    const ordered = pickStops(spots, 300, ["di-san-cham", "lich-su-giu-thanh"]);
    const plan = fallbackPlan(ordered);

    expect(plan.generated_by).toBe("fallback");
    expect(plan.stops).toEqual([
      {
        spot_id: "s1",
        narration: "Lời kể dựng sẵn cho Bảo tàng Chăm.",
        transition: "Tiếp theo, chúng ta đến Thành Điện Hải.",
        seconds: 60,
      },
      {
        spot_id: "s2",
        narration: "Lời kể dựng sẵn cho Thành Điện Hải.",
        transition: "Tiếp theo, chúng ta đến Chợ Hàn.",
        seconds: 60,
      },
      {
        spot_id: "s4",
        narration: "Lời kể dựng sẵn cho Chợ Hàn.",
        transition: "",
        seconds: 70,
      },
    ]);
  });

  it("sets empty transition when there is only one stop", () => {
    const plan = fallbackPlan([spots[0]]);
    expect(plan.stops).toHaveLength(1);
    expect(plan.stops[0].transition).toBe("");
  });
});

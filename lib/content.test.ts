import { describe, expect, it } from "vitest";
import { getLevels, levelForSpot } from "./content";

describe("levelForSpot", () => {
  it("returns the first level that contains the spot", () => {
    const level = getLevels()[0];
    expect(levelForSpot(level.spot_ids[0])?.id).toBe(level.id);
  });
  it("returns undefined for an unknown spot", () => {
    expect(levelForSpot("khong-co")).toBeUndefined();
  });
});

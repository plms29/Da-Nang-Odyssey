import { describe, it, expect } from "vitest";
import { getSceneKit, sceneIdForLevel } from "@/lib/scene";

describe("scene", () => {
  it("maps a level to its first spot's theme", () => {
    expect(sceneIdForLevel({ spot_ids: ["bao-tang-cham"] })).toBe("di-san-cham");
    expect(sceneIdForLevel({ spot_ids: ["thanh-dien-hai"] })).toBe("lich-su-giu-thanh");
  });
  it("falls back to home for unknown or empty spots", () => {
    expect(sceneIdForLevel({ spot_ids: [] })).toBe("home");
    expect(sceneIdForLevel({ spot_ids: ["khong-co"] })).toBe("home");
  });
  it("always returns a kit", () => {
    const kit = getSceneKit("am-thuc");
    expect(kit.sky).toBeTruthy();
    expect(Array.isArray(kit.layers)).toBe(true);
  });
});

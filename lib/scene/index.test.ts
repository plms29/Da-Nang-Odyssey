import { describe, it, expect } from "vitest";
import { getSceneKit, sceneIdForLevel, sceneIdForSpot } from "@/lib/scene";

describe("scene", () => {
  it("maps a level to its first spot's theme", () => {
    expect(sceneIdForLevel({ spot_ids: ["bao-tang-cham"] })).toBe("di-san-cham");
    expect(sceneIdForLevel({ spot_ids: ["thanh-dien-hai"] })).toBe("lich-su-giu-thanh");
  });
  it("falls back to home for unknown or empty spots", () => {
    expect(sceneIdForLevel({ spot_ids: [] })).toBe("home");
    expect(sceneIdForLevel({ spot_ids: ["khong-co"] })).toBe("home");
  });
  it("maps a spot to its world", () => {
    expect(sceneIdForSpot("diem-bai-choi")).toBe("nghe-thuat-dan-gian");
    expect(sceneIdForSpot("khong-co")).toBe("home");
  });
  it("every kit has a hex accent", () => {
    for (const id of ["home", "di-san-cham", "lich-su-giu-thanh", "nghe-thuat-dan-gian", "am-thuc"] as const) {
      expect(getSceneKit(id).accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
  it("always returns a kit", () => {
    const kit = getSceneKit("am-thuc");
    expect(kit.sky).toBeTruthy();
    expect(Array.isArray(kit.layers)).toBe(true);
  });
});

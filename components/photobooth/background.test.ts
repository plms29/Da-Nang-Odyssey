import { describe, expect, it } from "vitest";
import { getSceneKit } from "@/lib/scene";
import { bottomFraction, parseSky } from "./background";
import { layersFor } from "./compose";

describe("parseSky", () => {
  it("keeps CSS order for url + gradient", () => {
    const layers = parseSky(
      "url(/scenes/home/ai-sky.webp) center / cover no-repeat, linear-gradient(180deg, #F6EFE4 0%, #C87A55 100%)",
    );
    expect(layers).toEqual([
      { kind: "url", src: "/scenes/home/ai-sky.webp" },
      { kind: "linear", angleDeg: 180, stops: [{ color: "#F6EFE4", pos: 0 }, { color: "#C87A55", pos: 1 }] },
    ]);
  });

  it("does not split inside rgba()", () => {
    const layers = parseSky(
      "linear-gradient(180deg, rgba(16, 18, 46, 0.78) 0%, rgba(56, 39, 94, 0.58) 100%), url(/a.webp) center / cover, linear-gradient(180deg, #0E122B 0%, #3B2863 100%)",
    );
    expect(layers.map((l) => l.kind)).toEqual(["linear", "url", "linear"]);
    const first = layers[0];
    expect(first.kind === "linear" && first.stops[0]).toEqual({ color: "rgba(16, 18, 46, 0.78)", pos: 0 });
  });

  it("parses every scene kit sky to at least one gradient", () => {
    for (const id of ["home", "di-san-cham", "lang-nghe", "am-thuc", "lich-su-giu-thanh", "nghe-thuat-dan-gian", "do-thi-song-le-hoi"] as const) {
      expect(parseSky(getSceneKit(id).sky).some((l) => l.kind === "linear")).toBe(true);
    }
  });

  it("drops unknown parts", () => {
    expect(parseSky("radial-gradient(#fff, #000)")).toEqual([]);
  });
});

describe("bottomFraction", () => {
  it("reads bottom-[N%]", () => {
    expect(bottomFraction("bottom-[34%] left-0 w-full")).toBeCloseTo(0.34);
    expect(bottomFraction("bottom-0 left-0")).toBe(0);
  });
});

describe("layersFor", () => {
  it("falls back to frame without a mask", () => {
    for (const bg of ["frame", "world", "bg-only"] as const) {
      expect(layersFor(bg, false)).toEqual({ world: false, frame: true });
    }
  });
  it("picks layers with a mask", () => {
    expect(layersFor("frame", true)).toEqual({ world: false, frame: true });
    expect(layersFor("world", true)).toEqual({ world: true, frame: true });
    expect(layersFor("bg-only", true)).toEqual({ world: true, frame: false });
  });
});

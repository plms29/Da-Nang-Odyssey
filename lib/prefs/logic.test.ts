import { describe, expect, it } from "vitest";
import type { Level } from "@/lib/types";
import { availableThemes, playerTitle } from "@/lib/theme";
import { mergePrefs, sanitizePrefs } from "./logic";

describe("prefs", () => {
  const allowed = ["home", "di-san-cham"] as const;

  it("keeps an allowed theme and drops anything else", () => {
    expect(sanitizePrefs({ theme: "di-san-cham", theme_at: 5 }, allowed)).toEqual({ theme: "di-san-cham", theme_at: 5 });
    expect(sanitizePrefs({ theme: "am-thuc", theme_at: 9 }, allowed)).toEqual({ theme: "home", theme_at: 0 });
    expect(sanitizePrefs({ theme: "<script>", theme_at: "x" }, allowed)).toEqual({ theme: "home", theme_at: 0 });
    expect(sanitizePrefs(null, allowed)).toEqual({ theme: "home", theme_at: 0 });
    expect(sanitizePrefs({ theme: "home", theme_at: Infinity }, allowed)).toEqual({ theme: "home", theme_at: 0 });
  });

  it("newer choice wins, ties keep local, invalid cloud never wins", () => {
    const local = { theme: "home", theme_at: 10 };
    expect(mergePrefs(local, { theme: "di-san-cham", theme_at: 20 }, allowed).theme).toBe("di-san-cham");
    expect(mergePrefs(local, { theme: "di-san-cham", theme_at: 5 }, allowed).theme).toBe("home");
    expect(mergePrefs(local, { theme: "lang-nghe", theme_at: 99 }, allowed).theme).toBe("home");
    expect(mergePrefs(undefined, undefined, allowed)).toEqual({ theme: "home", theme_at: 0 });
  });

  it("ignores far-future timestamps so they cannot win forever", () => {
    const now = 1_000_000_000_000;
    expect(sanitizePrefs({ theme: "di-san-cham", theme_at: now + 2 * 86_400_000 }, allowed, now).theme_at).toBe(0);
    expect(mergePrefs({ theme: "home", theme_at: now - 5 }, { theme: "di-san-cham", theme_at: 1e15 }, allowed, now).theme).toBe("home");
  });
});

describe("theme helpers", () => {
  const lv = (id: string, order: number, spot: string) => ({ id, order, spot_ids: [spot] }) as Level;
  const levels = [lv("m2", 2, "thanh-dien-hai"), lv("m1", 1, "bao-tang-cham"), lv("m3", 3, "diem-bai-choi")];

  it("offers home plus worlds of open levels in campaign order", () => {
    expect(availableThemes(levels, { levels: {} })).toEqual(["home", "di-san-cham"]);
    expect(availableThemes(levels, { levels: { m1: { stars: 2, code_score: 1 } } })).toEqual([
      "home",
      "di-san-cham",
      "lich-su-giu-thanh",
    ]);
  });

  it("titles follow pages found", () => {
    expect(playerTitle(levels, { levels: {} })).toMatchObject({ pages: 0, nextAt: 1 });
    const two = { levels: { m1: { stars: 1 as const, code_score: 1 }, m2: { stars: 1 as const, code_score: 1 } } };
    expect(playerTitle(levels, two)).toMatchObject({ pages: 2, nextAt: 3 });
  });
});

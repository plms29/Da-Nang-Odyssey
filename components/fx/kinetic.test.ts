import { describe, expect, it } from "vitest";
import { splitGraphemes } from "./KineticText";

describe("splitGraphemes", () => {
  it("splits NFC Vietnamese text into words of graphemes", () => {
    const words = splitGraphemes("Hành trình văn hóa Đà Nẵng");
    expect(words).toHaveLength(6);
    expect(words.map((w) => w.join(""))).toEqual(["Hành", "trình", "văn", "hóa", "Đà", "Nẵng"]);
  });

  it("normalizes NFD combining marks so diacritics stay attached", () => {
    const nfc = "Hành trình văn hóa Đà Nẵng";
    const nfd = nfc.normalize("NFD");
    const result = splitGraphemes(nfd);
    expect(result).toEqual(splitGraphemes(nfc));
    expect(result.map((w) => w.join(""))).toEqual(["Hành", "trình", "văn", "hóa", "Đà", "Nẵng"]);
    expect(splitGraphemes("Ha\u0300nh")).toEqual([["H", "à", "n", "h"]]);
  });

  it("returns an empty array for empty or whitespace-only input", () => {
    expect(splitGraphemes("")).toEqual([]);
    expect(splitGraphemes("   \t\n  ")).toEqual([]);
  });
});

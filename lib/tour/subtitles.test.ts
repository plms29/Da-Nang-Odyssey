import { describe, expect, it } from "vitest";
import { sentenceTimings, splitSentences } from "@/lib/tour/subtitles";

describe("splitSentences", () => {
  it("splits multiple sentences on ., !, ?, … followed by whitespace or end", () => {
    const text =
      "Xin chào Đà Nẵng. Đây là cầu Rồng! Bạn đã ghé thăm chưa? Tuyệt vời… Hẹn gặp lại.";
    expect(splitSentences(text)).toEqual([
      "Xin chào Đà Nẵng.",
      "Đây là cầu Rồng!",
      "Bạn đã ghé thăm chưa?",
      "Tuyệt vời…",
      "Hẹn gặp lại.",
    ]);
  });

  it("keeps text without terminal punctuation as one sentence", () => {
    expect(splitSentences("Bảo tàng Điêu khắc Chăm bên sông Hàn")).toEqual([
      "Bảo tàng Điêu khắc Chăm bên sông Hàn",
    ]);
  });

  it("handles ellipsis, extra spaces, and newlines", () => {
    const text =
      "  Điểm dừng đầu tiên…   Hãy ngắm nhìn sông Hàn...\n\tRất thơ mộng!  ";
    expect(splitSentences(text)).toEqual([
      "Điểm dừng đầu tiên…",
      "Hãy ngắm nhìn sông Hàn...",
      "Rất thơ mộng!",
    ]);
  });

  it("does not split when punctuation is not followed by whitespace", () => {
    expect(splitSentences("Cây cầu dài 1.5 km. Thật ấn tượng.")).toEqual([
      "Cây cầu dài 1.5 km.",
      "Thật ấn tượng.",
    ]);
  });

  it("preserves Vietnamese diacritics and drops empty input", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   \n\t  ")).toEqual([]);
    expect(
      splitSentences(
        "Nghệ thuật bài chòi ở Đà Nẵng rất đặc sắc. Bạn thử nghe nhé!"
      )
    ).toEqual([
      "Nghệ thuật bài chòi ở Đà Nẵng rất đặc sắc.",
      "Bạn thử nghe nhé!",
    ]);
  });

  it("keeps a trailing sentence without terminal punctuation", () => {
    expect(splitSentences("Câu đầu tiên. Câu tiếp theo")).toEqual([
      "Câu đầu tiên.",
      "Câu tiếp theo",
    ]);
  });
});

describe("sentenceTimings", () => {
  it("returns empty array for empty input", () => {
    expect(sentenceTimings([], 20)).toEqual([]);
    expect(sentenceTimings([], 0)).toEqual([]);
  });

  it("returns [0] for a single sentence", () => {
    expect(sentenceTimings(["Một câu duy nhất."], 20)).toEqual([0]);
  });

  it("computes start seconds proportional to character length", () => {
    // Lengths: 2, 6 -> total 8 -> starts at 0 and (2/8)*8 = 2
    expect(sentenceTimings(["ab", "cdefgh"], 8)).toEqual([0, 2]);

    // Lengths: 1, 2, 3 -> total 6 -> starts at 0, (1/6)*12 = 2, (3/6)*12 = 6
    expect(sentenceTimings(["a", "bc", "def"], 12)).toEqual([0, 2, 6]);
  });

  it("maintains bounds: first is 0, nondecreasing, and last < totalSeconds when totalSeconds > 0", () => {
    const sentences = [
      "Chào mừng bạn.",
      "Đây là điểm dừng thứ hai với mô tả dài hơn một chút.",
      "Kết thúc!",
    ];
    const totalSeconds = 15;
    const timings = sentenceTimings(sentences, totalSeconds);

    expect(timings).toHaveLength(sentences.length);
    expect(timings[0]).toBe(0);
    for (let i = 1; i < timings.length; i += 1) {
      expect(timings[i]).toBeGreaterThanOrEqual(timings[i - 1]);
    }
    expect(timings[timings.length - 1]).toBeLessThan(totalSeconds);
  });

  it("keeps last < totalSeconds even if an empty string is passed inside sentences", () => {
    const timings = sentenceTimings(["Một câu.", ""], 10);
    expect(timings[0]).toBe(0);
    expect(timings[1]).toBeGreaterThanOrEqual(timings[0]);
    expect(timings[1]).toBeLessThan(10);
  });

  it("returns zeros when totalSeconds <= 0", () => {
    expect(sentenceTimings(["Câu 1.", "Câu 2."], 0)).toEqual([0, 0]);
    expect(sentenceTimings(["Câu 1.", "Câu 2."], -5)).toEqual([0, 0]);
  });
});

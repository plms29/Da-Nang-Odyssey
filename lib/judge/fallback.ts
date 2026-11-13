import type { ExpressStation, JudgeResult, Level } from "@/lib/types";
import { starsFor, totalScore } from "./score";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^[\s\S]+?[.!?](?=\s|$)/);
  return match ? match[0].trim() : trimmed;
}

function clampCriterionScore(value: number): 0 | 1 | 2 | 3 {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  return 3;
}

/** Deterministic fallback grader used when Gemini is unavailable or fails. */
export function gradeFallback(
  level: Level,
  station: ExpressStation,
  text: string,
): JudgeResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    const criteria = station.rubric.map((criterion) => ({
      id: criterion.id,
      score: 0 as const,
      evidence: "",
    }));
    const score = totalScore(criteria);
    return {
      criteria,
      score,
      stars: starsFor(score),
      praise: "Bạn chưa nộp nội dung nào.",
      addition: "Hãy viết vài câu chia sẻ hiểu biết của bạn để hoàn thành trạm này nhé.",
      graded_by: "fallback",
    };
  }

  const normalizedAnswer = normalizeText(trimmed);

  const criteria = station.rubric.map((criterion) => {
    let criterionScore: 0 | 1 | 2 | 3;

    if (criterion.must_include && criterion.must_include.length > 0) {
      let found = 0;
      for (const keyword of criterion.must_include) {
        const normalizedKeyword = normalizeText(keyword).trim();
        if (normalizedKeyword.length > 0 && normalizedAnswer.includes(normalizedKeyword)) {
          found += 1;
        }
      }
      criterionScore = clampCriterionScore(
        Math.round((3 * found) / criterion.must_include.length),
      );
    } else {
      criterionScore = trimmed.length < 40 ? 1 : 2;
    }

    return {
      id: criterion.id,
      score: criterionScore,
      evidence: "",
    };
  });

  const score = totalScore(criteria);
  return {
    criteria,
    score,
    stars: starsFor(score),
    praise: "Cảm ơn bạn đã hoàn thành phần chia sẻ của mình!",
    addition: firstSentence(level.reveal.text),
    graded_by: "fallback",
  };
}

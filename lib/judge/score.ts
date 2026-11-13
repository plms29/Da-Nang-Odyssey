/** Compute percentage score (0..100) from rubric criterion scores (each 0..3). */
export function totalScore(criteria: readonly { score: number }[]): number {
  if (criteria.length === 0) return 0;
  const sum = criteria.reduce((acc, item) => acc + item.score, 0);
  return Math.round((sum / (3 * criteria.length)) * 100);
}

/** Map a 0..100 score to a 1..3 star rating. */
export function starsFor(score: number): 1 | 2 | 3 {
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

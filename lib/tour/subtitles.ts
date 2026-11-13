const SENTENCE_END_PATTERN = /[.!?…](?:\s+|$)/g;

/** Split narration text into trimmed, non-empty sentences while keeping terminal punctuation. */
export function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const sentences: string[] = [];
  SENTENCE_END_PATTERN.lastIndex = 0;

  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = SENTENCE_END_PATTERN.exec(trimmed)) !== null) {
    // End right after the punctuation character, before any trailing whitespace.
    const sentence = trimmed.slice(start, match.index + 1).trim();
    if (sentence) {
      sentences.push(sentence);
    }
    start = match.index + match[0].length;
  }

  if (start < trimmed.length) {
    const tail = trimmed.slice(start).trim();
    if (tail) {
      sentences.push(tail);
    }
  }

  return sentences;
}

/** Compute the start second of each sentence proportionally to its character length. */
export function sentenceTimings(
  sentences: string[],
  totalSeconds: number
): number[] {
  if (sentences.length === 0) return [];
  if (totalSeconds <= 0 || !Number.isFinite(totalSeconds)) {
    return sentences.map(() => 0);
  }

  const weights = sentences.map((sentence) => Math.max(1, sentence.length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  const timings: number[] = [];
  let elapsedWeight = 0;

  for (let i = 0; i < weights.length; i += 1) {
    if (i === 0) {
      timings.push(0);
    } else {
      const rawStart = (elapsedWeight / totalWeight) * totalSeconds;
      const clampedStart =
        rawStart < totalSeconds ? rawStart : totalSeconds * 0.999999;
      timings.push(Math.max(timings[i - 1], clampedStart));
    }
    elapsedWeight += weights[i];
  }

  return timings;
}

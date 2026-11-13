/**
 * Deterministically shuffle items from a seed key while guaranteeing
 * the result is never in the original (solved) order when length >= 2.
 */
export function deterministicShuffle<T>(
  items: readonly T[],
  seedKey: string,
  isSolved?: (shuffled: T[]) => boolean,
): T[] {
  const arr = items.slice();
  if (arr.length < 2) return arr;

  let seed = 0;
  for (let i = 0; i < seedKey.length; i += 1) {
    seed = (seed * 31 + seedKey.charCodeAt(i)) >>> 0;
  }

  for (let i = arr.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  const solved = isSolved
    ? isSolved(arr)
    : arr.every((item, idx) => item === items[idx]);

  if (solved) {
    const tmp = arr[0];
    arr[0] = arr[1];
    arr[1] = tmp;
  }

  return arr;
}

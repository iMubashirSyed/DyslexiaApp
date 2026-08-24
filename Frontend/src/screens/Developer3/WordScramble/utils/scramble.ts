/**
 * Fisher–Yates shuffle (in-place on a copy).
 * Used at session start so level 1 is random, not a fixed first word.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns letter array scrambled so it never equals the original order.
 * Re-shuffles until different (handles short words and identity permutations).
 */
export function scrambleWord(word: string): string[] {
  const letters = word.split('');
  if (letters.length <= 1) {
    return letters;
  }

  const original = letters.join('');
  let attempt = shuffleArray(letters);
  let safety = 0;

  while (attempt.join('') === original && safety < 50) {
    attempt = shuffleArray(letters);
    safety++;
  }

  // Last resort: swap first two (guaranteed change when length >= 2)
  if (attempt.join('') === original) {
    [attempt[0], attempt[1]] = [attempt[1], attempt[0]];
  }

  return attempt;
}

export function buildTilesFromScramble(scrambled: string[]): import('../types').LetterTile[] {
  return scrambled.map((letter, index) => ({
    id: `${letter}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    letter,
    available: true,
  }));
}
import type { Rng } from './rng';

/**
 * Build a 4-choice MCQ choice list containing the correct value plus unique
 * plausible distractors, formatted as strings and shuffled.
 *
 * `candidates` is a list of plausible-wrong-answer generator functions
 * (e.g. digit transposition, off-by-place-value, forgot-carry). Each is
 * tried in order (looping if needed with slight jitter) until 3 unique
 * distractors (all different from the correct value and each other) are
 * collected.
 */
export function buildChoices(
  rng: Rng,
  correct: number,
  candidates: Array<() => number>,
  format: (n: number) => string = (n) => String(n),
): string[] {
  const correctStr = format(correct);
  const seen = new Set<string>([correctStr]);
  const distractors: string[] = [];

  let guardAttempts = 0;
  const pool = [...candidates];

  while (distractors.length < 3 && guardAttempts < 200) {
    guardAttempts++;
    if (pool.length === 0) {
      // Fallback: jitter around the correct value.
      const jitter = correct + rng.pick([-3, -2, -1, 1, 2, 3, 5, -5]);
      const str = format(jitter);
      if (!seen.has(str)) {
        seen.add(str);
        distractors.push(str);
      }
      continue;
    }
    const idx = guardAttempts % pool.length;
    const value = pool[idx]();
    const str = format(value);
    if (!seen.has(str) && Number.isFinite(value)) {
      seen.add(str);
      distractors.push(str);
    } else {
      // Retire an exhausted candidate to avoid infinite loop on duplicates.
      if (guardAttempts % pool.length === pool.length - 1) pool.splice(idx, 1);
    }
  }

  // Last-resort fallback if still short (shouldn't normally happen).
  let fallback = 1;
  while (distractors.length < 3) {
    const str = format(correct + fallback);
    if (!seen.has(str)) {
      seen.add(str);
      distractors.push(str);
    }
    fallback++;
  }

  return rng.shuffle([correctStr, ...distractors]);
}

/** Swap two adjacent digits of an integer (common transposition error). */
export function transposeDigits(n: number, rng: Rng): number {
  const digits = String(Math.abs(Math.round(n))).split('');
  if (digits.length < 2) return n + rng.int(1, 9);
  const i = rng.int(0, digits.length - 2);
  [digits[i], digits[i + 1]] = [digits[i + 1], digits[i]];
  const result = parseInt(digits.join(''), 10);
  return n < 0 ? -result : result;
}

/** Shift the value by one place-value order of magnitude (wrong place value). */
export function wrongPlaceValue(n: number, rng: Rng): number {
  const magnitude = rng.pick([10, 100, 1000]);
  const direction = rng.pick([1, -1]);
  return n + direction * magnitude;
}

/** Simulate "forgot to carry" for a + b by summing digit-wise without carrying. */
export function forgotCarry(a: number, b: number): number {
  const sa = String(a).split('').reverse();
  const sb = String(b).split('').reverse();
  const len = Math.max(sa.length, sb.length);
  const digits: number[] = [];
  for (let i = 0; i < len; i++) {
    const da = parseInt(sa[i] ?? '0', 10);
    const db = parseInt(sb[i] ?? '0', 10);
    digits.push((da + db) % 10);
  }
  return parseInt(digits.reverse().join(''), 10) || a + b - 1;
}

/** Nearby jitter distractor. */
export function nearby(n: number, rng: Rng, spread = 10): number {
  const delta = rng.int(1, spread) * rng.pick([1, -1]);
  return n + (delta === 0 ? 1 : delta);
}

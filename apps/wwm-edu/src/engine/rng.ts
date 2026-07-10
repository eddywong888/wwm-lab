// Seeded PRNG (mulberry32) so exercise sessions can be regenerated / tested
// deterministically. Never use Math.random() in generators.

export interface Rng {
  /** Next float in [0, 1) */
  next(): number;
  /** Integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** Pick a random element from a non-empty array */
  pick<T>(arr: readonly T[]): T;
  /** Fisher-Yates shuffle; returns a new array, does not mutate input */
  shuffle<T>(arr: readonly T[]): T[];
  /** True with the given probability (0..1) */
  chance(p: number): boolean;
}

function hashStringToSeed(str: string): number {
  // xmur3-ish string hash → 32-bit seed
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed: string | number): Rng {
  const numericSeed = typeof seed === 'string' ? hashStringToSeed(seed) : seed >>> 0;
  const next = mulberry32(numericSeed);

  return {
    next,
    int(min: number, max: number): number {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      return lo + Math.floor(next() * (hi - lo + 1));
    },
    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) throw new Error('pick() called on empty array');
      return arr[Math.floor(next() * arr.length)];
    },
    shuffle<T>(arr: readonly T[]): T[] {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    chance(p: number): boolean {
      return next() < p;
    },
  };
}

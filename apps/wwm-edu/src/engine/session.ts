import { makeRng } from './rng';
import type { Difficulty, Question } from './types';
import { MATH_GENERATORS } from './math';

export const QUESTIONS_PER_SESSION = 10;
export const MIXED_TOPIC_ID = 'mixed';

/**
 * Build a fresh 10-question session. `topicId` is either a generator id or
 * MIXED_TOPIC_ID for a shuffled mix across all registered generators.
 * Seed defaults to Date.now() so every session is different, but sessions
 * remain reproducible/testable when an explicit seed is passed.
 */
export function generateSession(topicId: string, difficulty: Difficulty, seed: string | number = Date.now()): Question[] {
  const rng = makeRng(seed);
  const questions: Question[] = [];

  for (let i = 0; i < QUESTIONS_PER_SESSION; i++) {
    const generator = topicId === MIXED_TOPIC_ID
      ? rng.pick(MATH_GENERATORS)
      : MATH_GENERATORS.find((g) => g.meta.id === topicId) ?? rng.pick(MATH_GENERATORS);
    const q = generator.generate(rng, difficulty);
    // Ensure unique ids within a session even if a generator repeats a
    // combination (rare, but keypad/react keys need it).
    questions.push({ ...q, id: `${q.id}-${i}` });
  }

  return questions;
}

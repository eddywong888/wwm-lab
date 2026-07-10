import { makeRng } from './rng';
import type { Difficulty, Question } from './types';
import { MATH_GENERATORS } from './math';
import { ENGLISH_ALL, ENGLISH_TOPIC_IDS, isEnglishTopic, sampleEnglish } from './english';
import { getEnglishServedIds, recordEnglishServedIds } from '../store/local';

export const QUESTIONS_PER_SESSION = 10;
export const MIXED_TOPIC_ID = 'mixed';
export const ENGLISH_MIXED_TOPIC_ID = 'english-mixed';
export const DAILY_TOPIC_ID = 'daily';

const DAILY_MATH_COUNT = 7;
const DAILY_ENGLISH_COUNT = 3;

/** Local (not UTC) calendar date as YYYY-MM-DD, so the Daily Challenge
 * resets at local midnight for the player, not at UTC midnight. */
export function todayDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dailySeed(date: string = todayDateString()): string {
  return `daily-${date}`;
}

/**
 * The Daily Challenge: same 10 questions for every player on a given local
 * date (7 math sampled across all math generators + 3 English from the
 * banks), always at 'standard' difficulty. Determinism wins over
 * anti-repeat here, so English sampling ignores the served-ids history.
 */
function generateDailySession(date: string = todayDateString()): Question[] {
  const rng = makeRng(dailySeed(date));
  const questions: Question[] = [];

  for (let i = 0; i < DAILY_MATH_COUNT; i++) {
    const generator = rng.pick(MATH_GENERATORS);
    const q = generator.generate(rng, 'standard');
    questions.push({ ...q, id: `${q.id}-daily-${i}` });
  }

  const englishQuestions = sampleEnglish(ENGLISH_ALL, 'standard', DAILY_ENGLISH_COUNT, rng, []);
  questions.push(...englishQuestions.map((q, i) => ({ ...q, id: `${q.id}-daily-${DAILY_MATH_COUNT + i}` })));

  return rng.shuffle(questions);
}

/**
 * Build a fresh 10-question session. `topicId` is a math generator id,
 * MIXED_TOPIC_ID (shuffled mix across all math generators), an English
 * bank topic id, ENGLISH_MIXED_TOPIC_ID (shuffled mix across all English
 * topics), or DAILY_TOPIC_ID (date-seeded, identical for every player).
 * Seed defaults to Date.now() so every session is different, but sessions
 * remain reproducible/testable when an explicit seed is passed.
 */
export function generateSession(topicId: string, difficulty: Difficulty, seed: string | number = Date.now()): Question[] {
  if (topicId === DAILY_TOPIC_ID) {
    return generateDailySession();
  }

  if (topicId === ENGLISH_MIXED_TOPIC_ID || isEnglishTopic(topicId)) {
    const rng = makeRng(seed);
    const excludeIds = getEnglishServedIds();
    const bankTopic = topicId === ENGLISH_MIXED_TOPIC_ID ? ENGLISH_ALL : topicId;
    const questions = sampleEnglish(bankTopic, difficulty, QUESTIONS_PER_SESSION, rng, excludeIds);
    recordEnglishServedIds(questions.map((q) => q.id));
    return questions.map((q, i) => ({ ...q, id: `${q.id}-${i}` }));
  }

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

export { ENGLISH_TOPIC_IDS };

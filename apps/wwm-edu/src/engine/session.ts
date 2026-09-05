import { makeRng, type Rng } from './rng';
import type { Difficulty, Question } from './types';
import { MATH_GENERATORS } from './math';
import { ENGLISH_ALL, ENGLISH_TOPIC_IDS, isEnglishTopic, isChineseTopic, sampleBank } from './english';
import { getEnglishServedIds, recordEnglishServedIds } from '../store/local';
import { normalizeText } from '../content/schema';

export const QUESTIONS_PER_SESSION = 10;
export const MIXED_TOPIC_ID = 'mixed';
export const ENGLISH_MIXED_TOPIC_ID = 'english-mixed';
export const CHINESE_MIXED_TOPIC_ID = 'chinese-mixed';
export const DAILY_TOPIC_ID = 'daily';

export function todayDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function dailySeed(date: string = todayDateString()): string { return `daily-three-subjects-${date}`; }

export function questionFingerprint(q: Question): string {
  return normalizeText(`${q.prompt.en}|${q.prompt.zh}|${[...(q.choices ?? [])].sort().join('|')}`);
}

function mathQuestions(topic: string, difficulty: Difficulty, count: number, rng: Rng): Question[] {
  const result: Question[] = [];
  const seen = new Set<string>();
  const schedule = rng.shuffle(MATH_GENERATORS);
  for (let attempts = 0; result.length < count && attempts < count * 100; attempts++) {
    const generator = topic === MIXED_TOPIC_ID
      ? schedule[result.length % schedule.length]
      : MATH_GENERATORS.find((g) => g.meta.id === topic);
    if (!generator) throw new Error(`Unknown maths topic: ${topic}`);
    const question = generator.generate(rng, difficulty);
    // Comparison questions carry their data in the choices; all other
    // stems identify the task even if regenerated with new distractors.
    const comparison = /compare/.test(question.id);
    const key = comparison ? questionFingerprint(question) : normalizeText(`${question.prompt.en}|${question.prompt.zh}`);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...question, id: `${question.id}-${result.length}` });
  }
  if (result.length !== count) throw new Error(`Cannot generate ${count} distinct maths questions`);
  return result;
}

export function generateDailySession(date: string = todayDateString()): Question[] {
  const rng = makeRng(dailySeed(date));
  return rng.shuffle([
    ...mathQuestions(MIXED_TOPIC_ID, 'standard', 4, rng),
    ...sampleBank('english', ENGLISH_ALL, 'standard', 3, rng),
    ...sampleBank('chinese', ENGLISH_ALL, 'standard', 3, rng),
  ]).map((q, i) => ({ ...q, id: `${q.id}-daily-${i}` }));
}

export function generateSession(topicId: string, difficulty: Difficulty, seed: string | number = Date.now()): Question[] {
  if (topicId === DAILY_TOPIC_ID) return generateDailySession();
  const rng = makeRng(seed);
  const chinese = isChineseTopic(topicId) || topicId === CHINESE_MIXED_TOPIC_ID;
  if (chinese || isEnglishTopic(topicId) || topicId === ENGLISH_MIXED_TOPIC_ID) {
    const mixed = topicId === ENGLISH_MIXED_TOPIC_ID || topicId === CHINESE_MIXED_TOPIC_ID;
    const questions = sampleBank(chinese ? 'chinese' : 'english', mixed ? ENGLISH_ALL : topicId, difficulty, QUESTIONS_PER_SESSION, rng, getEnglishServedIds());
    recordEnglishServedIds(questions.map((q) => q.id));
    return questions;
  }
  return mathQuestions(topicId, difficulty, QUESTIONS_PER_SESSION, rng);
}
export { ENGLISH_TOPIC_IDS };

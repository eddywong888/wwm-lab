import { makeRng, type Rng } from './rng';
import type { AnswerRecord, Difficulty, Question } from './types';
import { MATH_GENERATORS } from './math';
import { ENGLISH_ALL, ENGLISH_TOPIC_IDS, isEnglishTopic, isChineseTopic, sampleBank } from './english';
import { getEnglishServedIds, recordEnglishServedIds } from '../store/local';
import type { ReviewSkillProgress } from '../store/local';
import { normalizeText } from '../content/schema';
import { generateConstructedSession, isConstructedTopic } from './constructed';

export const QUESTIONS_PER_SESSION = 10;
export const MIXED_TOPIC_ID = 'mixed';
export const ENGLISH_MIXED_TOPIC_ID = 'english-mixed';
export const CHINESE_MIXED_TOPIC_ID = 'chinese-mixed';
export const DAILY_TOPIC_ID = 'daily';
export const REVIEW_TOPIC_ID = 'review';

export function scoredSessionAnswers(answers: readonly AnswerRecord[]): AnswerRecord[] {
  return answers.filter((answer) => answer.scored !== false && answer.question.kind !== 'self-check');
}

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
  ]).map((q, i) => ({ ...q, id: `${q.id}-daily-${i}`, difficulty: 'standard' as const }));
}

export function generateMixedSession(difficulty: Difficulty, seed: string | number = Date.now()): Question[] {
  const rng = makeRng(`mixed-three-subjects-${seed}`);
  const history = getEnglishServedIds();
  const language = [
    ...sampleBank('english', ENGLISH_ALL, difficulty, 3, rng, history),
    ...sampleBank('chinese', ENGLISH_ALL, difficulty, 3, rng, history),
  ];
  recordEnglishServedIds(language.map((question) => question.id));
  return rng.shuffle([
    ...mathQuestions(MIXED_TOPIC_ID, difficulty, 4, rng),
    ...language,
  ]).map((question, index) => ({ ...question, id: `${question.id}-mixed-${index}`, difficulty }));
}

export function generateSession(topicId: string, difficulty: Difficulty, seed: string | number = Date.now()): Question[] {
  if (topicId === DAILY_TOPIC_ID) return generateDailySession();
  if (topicId === MIXED_TOPIC_ID) return generateMixedSession(difficulty, seed);
  const rng = makeRng(seed);
  if (isConstructedTopic(topicId)) {
    const selfChecks = generateConstructedSession(topicId, difficulty, rng);
    const scored = topicId === 'math-reasoning-studio'
      ? mathQuestions(MIXED_TOPIC_ID, difficulty, QUESTIONS_PER_SESSION - selfChecks.length, rng)
      : sampleBank(topicId === 'chinese-writing-studio' ? 'chinese' : 'english', topicId === 'chinese-writing-studio' ? 'chinese-writing' : 'sentences', difficulty, QUESTIONS_PER_SESSION - selfChecks.length, rng, getEnglishServedIds());
    recordEnglishServedIds(scored.filter((question) => question.id.includes(':')).map((question) => question.id));
    return rng.shuffle([...selfChecks, ...scored]);
  }
  const chinese = isChineseTopic(topicId) || topicId === CHINESE_MIXED_TOPIC_ID;
  if (chinese || isEnglishTopic(topicId) || topicId === ENGLISH_MIXED_TOPIC_ID) {
    const mixed = topicId === ENGLISH_MIXED_TOPIC_ID || topicId === CHINESE_MIXED_TOPIC_ID;
    const questions = sampleBank(chinese ? 'chinese' : 'english', mixed ? ENGLISH_ALL : topicId, difficulty, QUESTIONS_PER_SESSION, rng, getEnglishServedIds());
    recordEnglishServedIds(questions.map((q) => q.id));
    return questions.map((question) => ({ ...question, difficulty }));
  }
  return mathQuestions(topicId, difficulty, QUESTIONS_PER_SESSION, rng)
    .map((question) => ({ ...question, difficulty }));
}

export function generateReviewSession(
  skills: readonly ReviewSkillProgress[],
  count: number = QUESTIONS_PER_SESSION,
  seed: string | number = Date.now(),
): Question[] {
  const selectedSkills = skills.slice(0, count);
  if (selectedSkills.length === 0) return [];
  const rng = makeRng(`review-${seed}`);
  const perSkill = Math.ceil(count / selectedSkills.length);
  const pools = selectedSkills.map((skill) => {
    let questions: Question[];
    if (isChineseTopic(skill.topicId)) {
      questions = sampleBank('chinese', skill.topicId, skill.difficulty, perSkill, rng, getEnglishServedIds());
    } else if (isEnglishTopic(skill.topicId)) {
      questions = sampleBank('english', skill.topicId, skill.difficulty, perSkill, rng, getEnglishServedIds());
    } else {
      questions = mathQuestions(skill.topicId, skill.difficulty, perSkill, rng);
    }
    return questions.map((question) => ({ ...question, difficulty: skill.difficulty }));
  });

  const review: Question[] = [];
  for (let offset = 0; review.length < count; offset++) {
    let added = false;
    for (const pool of pools) {
      const question = pool[offset];
      if (!question || review.length >= count) continue;
      review.push({ ...question, id: `${question.id}-review-${review.length}` });
      added = true;
    }
    if (!added) break;
  }
  recordEnglishServedIds(review.filter((question) => question.id.includes(':')).map((question) => question.id.replace(/-review-\d+$/, '')));
  return rng.shuffle(review);
}
export { ENGLISH_TOPIC_IDS };

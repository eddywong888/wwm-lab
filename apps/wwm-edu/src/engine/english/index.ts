// English question-bank loader + sampler. Banks are curated JSON (not
// procedurally generated) — see src/content/schema.ts for the shape and
// src/content/english/*.json for the actual content.
import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { validatePack, type BankQuestion, type QuestionPack } from '../../content/schema';

import grammar1 from '../../content/english/grammar-1.json';
import vocabulary1 from '../../content/english/vocabulary-1.json';
import sentences1 from '../../content/english/sentences-1.json';
import comprehension1 from '../../content/english/comprehension-1.json';

const RAW_PACKS: unknown[] = [grammar1, vocabulary1, sentences1, comprehension1];

function loadPacks(): QuestionPack[] {
  const packs: QuestionPack[] = [];
  for (const raw of RAW_PACKS) {
    const result = validatePack(raw);
    if (!result.ok) {
      const message = `Invalid English question pack:\n${result.errors.join('\n')}`;
      // Fail loudly in dev so a bad content edit is caught immediately;
      // in production, skip the pack rather than crash the whole app.
      if (import.meta.env.DEV) throw new Error(message);
      console.error(message);
      continue;
    }
    packs.push(result.pack);
  }
  return packs;
}

const PACKS: QuestionPack[] = loadPacks();

/** Every bank question flattened with its parent pack's topic attached. */
interface FlatBankQuestion extends BankQuestion {
  topic: string;
}

const ALL_BANK_QUESTIONS: FlatBankQuestion[] = PACKS.flatMap((pack) =>
  pack.questions.map((q) => ({ ...q, topic: pack.topic })),
);

export const ENGLISH_TOPIC_META: Record<string, GeneratorMeta> = {
  grammar: { id: 'grammar', name: { en: 'Grammar', zh: '语法' }, icon: '📗' },
  vocabulary: { id: 'vocabulary', name: { en: 'Vocabulary', zh: '词汇' }, icon: '📘' },
  sentences: { id: 'sentences', name: { en: 'Sentences', zh: '句子' }, icon: '✍️' },
  comprehension: { id: 'comprehension', name: { en: 'Comprehension', zh: '阅读理解' }, icon: '📖' },
};

/** Topic cards for Home, in a fixed display order. */
export const ENGLISH_TOPICS: GeneratorMeta[] = ['grammar', 'vocabulary', 'sentences', 'comprehension']
  .map((id) => ENGLISH_TOPIC_META[id]);

/** All topic ids backed by a question bank (used by session.ts to route). */
export const ENGLISH_TOPIC_IDS: string[] = ENGLISH_TOPICS.map((t) => t.id);

/** Sentinel meaning "any English topic" — used by the Daily Challenge. */
export const ENGLISH_ALL = 'all';

export function isEnglishTopic(topicId: string): boolean {
  return ENGLISH_TOPIC_IDS.includes(topicId);
}

function toQuestion(bq: FlatBankQuestion): Question {
  return {
    id: bq.id,
    prompt: bq.prompt,
    choices: bq.choices,
    answer: bq.answer,
    kind: 'mcq',
    topic: bq.topic,
    explain: bq.explain,
  };
}

/**
 * Sample `count` questions for `topicId` (or ENGLISH_ALL for any topic).
 * Prefers the requested difficulty, excluding recently served ids; falls
 * back progressively (relax exclusion, then mix in the other difficulty,
 * then allow anything in the topic) so a session is never short even if
 * the anti-repeat window has eaten most of a small pool.
 */
export function sampleEnglish(
  topicId: string,
  difficulty: Difficulty,
  count: number,
  rng: Rng,
  excludeIds: readonly string[] = [],
): Question[] {
  const excludeSet = new Set(excludeIds);
  const pool = ALL_BANK_QUESTIONS.filter((bq) => topicId === ENGLISH_ALL || bq.topic === topicId);

  const chosen: FlatBankQuestion[] = [];
  const usedIds = new Set<string>();

  function takeFrom(candidates: FlatBankQuestion[], limit: number) {
    if (limit <= 0) return;
    const shuffled = rng.shuffle(candidates.filter((bq) => !usedIds.has(bq.id)));
    for (const bq of shuffled.slice(0, limit)) {
      chosen.push(bq);
      usedIds.add(bq.id);
    }
  }

  // 1) preferred difficulty, respecting anti-repeat
  takeFrom(pool.filter((bq) => bq.difficulty === difficulty && !excludeSet.has(bq.id)), count - chosen.length);
  // 2) preferred difficulty, ignore anti-repeat (pool too small this session)
  takeFrom(pool.filter((bq) => bq.difficulty === difficulty), count - chosen.length);
  // 3) the other difficulty, respecting anti-repeat
  takeFrom(pool.filter((bq) => bq.difficulty !== difficulty && !excludeSet.has(bq.id)), count - chosen.length);
  // 4) anything left in the topic
  takeFrom(pool, count - chosen.length);

  return rng.shuffle(chosen).map(toQuestion);
}

export { PACKS as ENGLISH_PACKS };

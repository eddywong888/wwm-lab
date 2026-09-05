import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { normalizeText, validatePack, type BankQuestion, type QuestionPack } from '../../content/schema';
import grammar1 from '../../content/english/grammar-1.json';
import vocabulary1 from '../../content/english/vocabulary-1.json';
import sentences1 from '../../content/english/sentences-1.json';
import comprehension1 from '../../content/english/comprehension-1.json';
import chineseVocabulary from '../../content/chinese/vocabulary-1.json';
import chineseSentences from '../../content/chinese/sentences-1.json';
import chineseComprehension from '../../content/chinese/comprehension-1.json';
import chineseWriting from '../../content/chinese/writing-1.json';

const CONTENT_CACHE_KEY = 'wwm-edu:v1:content-overrides';
const RAW_REPO_PACKS: unknown[] = [grammar1, vocabulary1, sentences1, comprehension1, chineseVocabulary, chineseSentences, chineseComprehension, chineseWriting];
const BASE_TOPIC_META: Record<string, GeneratorMeta> = {
  grammar: { id: 'grammar', name: { en: 'Grammar', zh: '语法' }, icon: '📗' },
  vocabulary: { id: 'vocabulary', name: { en: 'Vocabulary', zh: '词汇' }, icon: '📘' },
  sentences: { id: 'sentences', name: { en: 'Sentences', zh: '句子' }, icon: '✍️' },
  comprehension: { id: 'comprehension', name: { en: 'Comprehension', zh: '阅读理解' }, icon: '📖' },
  'chinese-vocabulary': { id: 'chinese-vocabulary', name: { en: 'Chinese Words', zh: '字词运用' }, icon: '📙' },
  'chinese-sentences': { id: 'chinese-sentences', name: { en: 'Chinese Sentences', zh: '句子与标点' }, icon: '✍️' },
  'chinese-comprehension': { id: 'chinese-comprehension', name: { en: 'Chinese Reading', zh: '阅读理解' }, icon: '📖' },
  'chinese-writing': { id: 'chinese-writing', name: { en: 'Writing Foundations', zh: '习作基础' }, icon: '📝' },
};

export const REPO_PACKS: QuestionPack[] = RAW_REPO_PACKS.map((raw) => {
  const result = validatePack(raw);
  if (!result.ok) throw new Error(`Invalid question pack:\n${result.errors.join('\n')}`);
  return result.pack;
});

export function mergePacks(repo: QuestionPack[], overrides: QuestionPack[]): QuestionPack[] {
  const merged = new Map(repo.map((pack) => [pack.id, pack]));
  for (const pack of overrides) {
    const current = merged.get(pack.id);
    // Old cached packs must not silently undo corrected bundled content.
    if (current && (pack.subject !== current.subject || pack.topic !== current.topic || pack.version < current.version)) continue;
    merged.set(pack.id, pack);
  }
  return [...merged.values()];
}

function validatedPacks(raw: unknown): QuestionPack[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const result = validatePack(item);
    return result.ok ? [result.pack] : [];
  });
}

function cachedPacks(): QuestionPack[] {
  try {
    return validatedPacks(JSON.parse(localStorage.getItem(CONTENT_CACHE_KEY) ?? '[]'));
  } catch {
    return [];
  }
}

let packs = mergePacks(REPO_PACKS, cachedPacks());
function topics(subject: QuestionPack['subject']): GeneratorMeta[] {
  return [...new Map(packs.filter((pack) => pack.subject === subject).map((pack) => [pack.topic, BASE_TOPIC_META[pack.topic] ?? { id: pack.topic, name: pack.title, icon: '📦' }])).values()];
}
export let ENGLISH_TOPICS = topics('english');
export let CHINESE_TOPICS = topics('chinese');
export let ENGLISH_TOPIC_IDS = ENGLISH_TOPICS.map((topic) => topic.id);
export let CHINESE_TOPIC_IDS = CHINESE_TOPICS.map((topic) => topic.id);
export const ENGLISH_ALL = 'all';

export async function refreshEnglishContent(): Promise<boolean> {
  try {
    const response = await fetch('/api/edu/content');
    if (!response.ok) return false;
    const body = await response.json() as { packs?: unknown };
    if (!Array.isArray(body.packs)) return false;
    const overrides = validatedPacks(body.packs);
    packs = mergePacks(REPO_PACKS, overrides);
    ENGLISH_TOPICS = topics('english');
    CHINESE_TOPICS = topics('chinese');
    ENGLISH_TOPIC_IDS = ENGLISH_TOPICS.map((topic) => topic.id);
    CHINESE_TOPIC_IDS = CHINESE_TOPICS.map((topic) => topic.id);
    try { localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(overrides)); } catch { /* Offline storage may be unavailable. */ }
    return true;
  } catch {
    return false;
  }
}

export function isEnglishTopic(id: string): boolean { return ENGLISH_TOPIC_IDS.includes(id); }
export function isChineseTopic(id: string): boolean { return CHINESE_TOPIC_IDS.includes(id); }

export function sampleBank(subject: QuestionPack['subject'], topic: string, difficulty: Difficulty, count: number, rng: Rng, excludeIds: readonly string[] = []): Question[] {
  const pool = packs.filter((pack) => pack.subject === subject && (topic === ENGLISH_ALL || pack.topic === topic)).flatMap((pack) => pack.questions.filter((q) => q.difficulty === difficulty).map((q) => ({ ...q, id: `${subject}:${pack.id}:${q.id}`, topic: pack.topic })));
  const excluded = new Set(excludeIds);
  const selected: (BankQuestion & { topic: string })[] = [];
  const seenEn = new Set<string>();
  const seenZh = new Set<string>();
  for (const q of [...rng.shuffle(pool.filter((q) => !excluded.has(q.id))), ...rng.shuffle(pool.filter((q) => excluded.has(q.id)))]) {
    const en = normalizeText(q.prompt.en);
    const zh = normalizeText(q.prompt.zh);
    if (seenEn.has(en) || seenZh.has(zh)) continue;
    selected.push(q);
    seenEn.add(en);
    seenZh.add(zh);
    if (selected.length === count) break;
  }
  if (selected.length < count) throw new Error(`Insufficient distinct ${difficulty} questions for ${subject}/${topic}`);
  return rng.shuffle(selected).map((q) => ({ id: q.id, topic: q.topic, kind: 'mcq', prompt: q.prompt, choices: rng.shuffle(q.choices), answer: q.answer, explain: q.explain }));
}

export function sampleEnglish(topic: string, difficulty: Difficulty, count: number, rng: Rng, excludeIds: readonly string[] = []): Question[] {
  return sampleBank('english', topic, difficulty, count, rng, excludeIds);
}
export { packs as ENGLISH_PACKS };

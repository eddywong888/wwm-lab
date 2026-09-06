import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { normalizeText, validatePack, type BankQuestion, type QuestionPack } from '../../content/schema';

const CONTENT_CACHE_KEY = 'wwm-edu:v1:content-overrides';
const BASE_ENGLISH_TOPICS: GeneratorMeta[] = [
  { id: 'grammar', name: { en: 'Grammar', zh: '语法' }, icon: '📗' },
  { id: 'vocabulary', name: { en: 'Vocabulary', zh: '词汇' }, icon: '📘' },
  { id: 'sentences', name: { en: 'Sentences', zh: '句子' }, icon: '✍️' },
  { id: 'comprehension', name: { en: 'Comprehension', zh: '阅读理解' }, icon: '📖' },
];
const BASE_CHINESE_TOPICS: GeneratorMeta[] = [
  { id: 'chinese-vocabulary', name: { en: 'Chinese Words', zh: '字词运用' }, icon: '📙' },
  { id: 'chinese-sentences', name: { en: 'Chinese Sentences', zh: '句子与标点' }, icon: '✍️' },
  { id: 'chinese-comprehension', name: { en: 'Chinese Reading', zh: '阅读理解' }, icon: '📖' },
  { id: 'chinese-writing', name: { en: 'Writing Foundations', zh: '习作基础' }, icon: '📝' },
];
const BASE_TOPIC_META = new Map([...BASE_ENGLISH_TOPICS, ...BASE_CHINESE_TOPICS].map((topic) => [topic.id, topic]));

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

let repoPacks: QuestionPack[] = [];
let overridePacks = cachedPacks();
export let REPO_PACKS: QuestionPack[] = [];
let packs = mergePacks(repoPacks, overridePacks);
const loadedSubjects = new Set<QuestionPack['subject']>();
const pendingLoads = new Map<QuestionPack['subject'], Promise<void>>();

function topics(subject: QuestionPack['subject']): GeneratorMeta[] {
  const base = subject === 'english' ? BASE_ENGLISH_TOPICS : BASE_CHINESE_TOPICS;
  const topicMap = new Map(base.map((topic) => [topic.id, topic]));
  for (const pack of packs.filter((item) => item.subject === subject)) {
    topicMap.set(pack.topic, BASE_TOPIC_META.get(pack.topic) ?? { id: pack.topic, name: pack.title, icon: '📦' });
  }
  return [...topicMap.values()];
}
export let ENGLISH_TOPICS = topics('english');
export let CHINESE_TOPICS = topics('chinese');
export let ENGLISH_TOPIC_IDS = ENGLISH_TOPICS.map((topic) => topic.id);
export let CHINESE_TOPIC_IDS = CHINESE_TOPICS.map((topic) => topic.id);
export const ENGLISH_ALL = 'all';

function rebuildPacks() {
  REPO_PACKS = [...repoPacks];
  packs = mergePacks(repoPacks, overridePacks);
  ENGLISH_TOPICS = topics('english');
  CHINESE_TOPICS = topics('chinese');
  ENGLISH_TOPIC_IDS = ENGLISH_TOPICS.map((topic) => topic.id);
  CHINESE_TOPIC_IDS = CHINESE_TOPICS.map((topic) => topic.id);
}

export function isSubjectContentLoaded(subject: QuestionPack['subject']): boolean {
  return loadedSubjects.has(subject);
}

export async function ensureSubjectContent(subject: QuestionPack['subject']): Promise<void> {
  if (loadedSubjects.has(subject)) return;
  const pending = pendingLoads.get(subject);
  if (pending) return pending;
  const load = (async () => {
    const module = subject === 'english'
      ? await import('../../content/english/index')
      : await import('../../content/chinese/index');
    const loaded = module.default.map((raw) => {
      const result = validatePack(raw);
      if (!result.ok) throw new Error(`Invalid ${subject} question pack:\n${result.errors.join('\n')}`);
      return result.pack;
    });
    repoPacks = [...repoPacks.filter((pack) => pack.subject !== subject), ...loaded];
    loadedSubjects.add(subject);
    rebuildPacks();
  })();
  pendingLoads.set(subject, load);
  try {
    await load;
  } finally {
    pendingLoads.delete(subject);
  }
}

export async function ensureAllLanguageContent(): Promise<void> {
  await Promise.all([ensureSubjectContent('english'), ensureSubjectContent('chinese')]);
}

export async function refreshEnglishContent(): Promise<boolean> {
  try {
    const response = await fetch('/api/edu/content');
    if (!response.ok) return false;
    const body = await response.json() as { packs?: unknown };
    if (!Array.isArray(body.packs)) return false;
    overridePacks = validatedPacks(body.packs);
    rebuildPacks();
    try { localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(overridePacks)); } catch { /* Offline storage may be unavailable. */ }
    return true;
  } catch {
    return false;
  }
}

export function isEnglishTopic(id: string): boolean { return ENGLISH_TOPIC_IDS.includes(id); }
export function isChineseTopic(id: string): boolean { return CHINESE_TOPIC_IDS.includes(id); }

export function sampleBank(subject: QuestionPack['subject'], topic: string, difficulty: Difficulty, count: number, rng: Rng, excludeIds: readonly string[] = []): Question[] {
  if (!loadedSubjects.has(subject)) throw new Error(`${subject} content must be loaded before starting practice`);
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

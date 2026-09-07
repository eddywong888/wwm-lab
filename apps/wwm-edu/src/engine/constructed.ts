import type { Difficulty, GeneratorMeta, Question } from './types';
import type { Rng } from './rng';
// Type-only: erased at build time, so the studio banks stay in their own chunk.
import type { Draft } from '../content/constructed/drafts';

export const CONSTRUCTED_SESSION_SIZE = 3;
export const CONSTRUCTED_TOPICS: (GeneratorMeta & { subject: 'math' | 'english' | 'chinese' })[] = [
  { id: 'math-reasoning-studio', subject: 'math', icon: '🧠', name: { en: 'Maths Reasoning Studio', zh: '数学思考练习' }, term: 2 },
  { id: 'english-writing-studio', subject: 'english', icon: '✏️', name: { en: 'English Writing Studio', zh: '英语写作练习' } },
  { id: 'chinese-writing-studio', subject: 'chinese', icon: '🖊️', name: { en: 'Chinese Writing Studio', zh: '华文写作练习' } },
];

// The three studio banks are long bilingual prompts, models and rubrics. They
// load on demand (like the English/Chinese question banks) so the initial
// bundle stays small; call ensureConstructedContent() before a studio session.
let BANKS: Record<string, Draft[]> | null = null;
let pendingLoad: Promise<void> | null = null;

export function isConstructedContentLoaded(): boolean { return BANKS !== null; }

export async function ensureConstructedContent(): Promise<void> {
  if (BANKS) return;
  pendingLoad ??= (async () => {
    BANKS = (await import('../content/constructed/drafts')).default;
  })();
  try {
    await pendingLoad;
  } finally {
    pendingLoad = null;
  }
}

function banks(): Record<string, Draft[]> {
  if (!BANKS) throw new Error('Studio content must be loaded before starting practice');
  return BANKS;
}

export function isConstructedTopic(id: string): boolean { return CONSTRUCTED_TOPICS.some((topic) => topic.id === id); }
export function constructedSubject(id: string) { return CONSTRUCTED_TOPICS.find((topic) => topic.id === id)?.subject; }

function stablePromptId(text: string): string {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
}

export function validateConstructedContent(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>(); const prompts = new Set<string>(); const models = new Set<string>();
  for (const [topic, drafts] of Object.entries(banks())) for (const draft of drafts) {
    const id = `${topic}-${draft.difficulty}-${stablePromptId(draft.prompt.en)}`;
    if (ids.has(id)) errors.push(`Duplicate id: ${id}`); ids.add(id);
    if (prompts.has(draft.prompt.en)) errors.push(`Duplicate prompt: ${draft.prompt.en}`); prompts.add(draft.prompt.en);
    if (models.has(draft.model.en)) errors.push(`Duplicate model: ${draft.model.en}`); models.add(draft.model.en);
    if (draft.criteria.length < 3 || draft.criteria.some((item) => !item.en.trim() || !item.zh.trim())) errors.push(`${id}: incomplete criteria`);
    const englishRange = /Write (\d)[–-](\d) sentences/i.exec(draft.prompt.en);
    const chineseRange = /(?:写|续写)([三五])至([四六])句话/.exec(draft.prompt.zh);
    const range = englishRange ? [Number(englishRange[1]), Number(englishRange[2])] : chineseRange ? [{ 三: 3, 五: 5 }[chineseRange[1] as '三' | '五'], { 四: 4, 六: 6 }[chineseRange[2] as '四' | '六']] : null;
    if (range) {
      const text = topic === 'english-writing-studio' ? draft.model.en : draft.model.zh;
      const count = (text.match(topic === 'english-writing-studio' ? /[.!?](?:\s|$)/g : /[。！？]/g) ?? []).length;
      if (count < range[0] || count > range[1]) errors.push(`${id}: model has ${count} sentences, expected ${range[0]}-${range[1]}`);
    }
  }
  return errors;
}

export function generateConstructedSession(topic: string, difficulty: Difficulty, rng: Rng): Question[] {
  const pool = banks()[topic]?.filter((item) => item.difficulty === difficulty);
  if (!pool || pool.length < CONSTRUCTED_SESSION_SIZE) throw new Error(`Unknown or incomplete self-review topic: ${topic}/${difficulty}`);
  return rng.shuffle(pool).slice(0, CONSTRUCTED_SESSION_SIZE).map((item) => ({
    id: `${topic}-${difficulty}-${stablePromptId(item.prompt.en)}`,
    kind: 'self-check', topic, difficulty, prompt: item.prompt,
    answer: item.model.en,
    selfReview: { modelAnswer: item.model, criteria: item.criteria },
  }));
}

// Framework-free schema + validator for language question banks. Kept
// dependency-free so it can be reused verbatim by a future admin upload
// page (Phase 3) without pulling in the rest of the app.

export type Difficulty = 'standard' | 'advanced';

export interface Bilingual {
  en: string;
  zh: string;
}

export interface BankQuestion {
  /** Unique within the pack (not necessarily globally unique). */
  id: string;
  difficulty: Difficulty;
  /** Assessed text plus any language-specific instruction. */
  prompt: Bilingual;
  /** Exactly 4 unique strings. */
  choices: string[];
  /** Must be one of `choices`. */
  answer: string;
  explain?: Bilingual;
}

export interface QuestionPack {
  id: string;
  subject: 'english' | 'chinese';
  topic: string;
  title: Bilingual;
  version: number;
  questions: BankQuestion[];
}

const BAD_TEXT = /\b(?:NaN|undefined|null)\b/;

export function normalizeText(text: string): string {
  return text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('en');
}

const RESERVED_TOPICS = new Set(['mixed', 'english-mixed', 'chinese-mixed', 'daily', 'all', 'whole-numbers', 'add-sub', 'mul-div', 'money', 'fractions', 'decimals', 'percentages', 'time', 'measurement', 'shapes', 'coordinates-ratio', 'data']);

function isBilingual(v: unknown): v is Bilingual {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.en === 'string' && typeof o.zh === 'string';
}

function bilingualErrors(v: unknown, label: string): string[] {
  const errors: string[] = [];
  if (!isBilingual(v)) {
    errors.push(`${label}: not a valid Bilingual object`);
    return errors;
  }
  if (!v.en.trim()) errors.push(`${label}: empty English text`);
  if (!v.zh.trim()) errors.push(`${label}: empty Chinese text`);
  if (BAD_TEXT.test(v.en)) errors.push(`${label}: bad text in English: "${v.en}"`);
  if (BAD_TEXT.test(v.zh)) errors.push(`${label}: bad text in Chinese: "${v.zh}"`);
  return errors;
}

function validateQuestion(v: unknown, index: number, seenIds: Set<string>): string[] {
  const errors: string[] = [];
  const label = `questions[${index}]`;
  if (!v || typeof v !== 'object') {
    errors.push(`${label}: not an object`);
    return errors;
  }
  const o = v as Record<string, unknown>;

  if (typeof o.id !== 'string' || !o.id.trim()) {
    errors.push(`${label}: missing/invalid id`);
  } else {
    if (seenIds.has(o.id)) errors.push(`${label}: duplicate id "${o.id}"`);
    seenIds.add(o.id);
  }

  if (o.difficulty !== 'standard' && o.difficulty !== 'advanced') {
    errors.push(`${label} (id=${String(o.id)}): difficulty must be 'standard' or 'advanced', got ${JSON.stringify(o.difficulty)}`);
  }

  errors.push(...bilingualErrors(o.prompt, `${label} (id=${String(o.id)}).prompt`));

  if (!Array.isArray(o.choices)) {
    errors.push(`${label} (id=${String(o.id)}): choices must be an array`);
  } else {
    const choices = o.choices as unknown[];
    if (choices.length !== 4) {
      errors.push(`${label} (id=${String(o.id)}): expected exactly 4 choices, got ${choices.length}`);
    }
    if (!choices.every((c) => typeof c === 'string' && c.trim())) {
      errors.push(`${label} (id=${String(o.id)}): all choices must be non-empty strings`);
    }
    const strChoices = choices.filter((c): c is string => typeof c === 'string');
    if (new Set(strChoices.map((choice) => choice.trim())).size !== strChoices.length) {
      errors.push(`${label} (id=${String(o.id)}): choices not unique: ${JSON.stringify(choices)}`);
    }
    for (const c of strChoices) {
      if (BAD_TEXT.test(c)) errors.push(`${label} (id=${String(o.id)}): bad text in choice "${c}"`);
    }
    if (typeof o.answer !== 'string' || !strChoices.includes(o.answer)) {
      errors.push(`${label} (id=${String(o.id)}): answer "${String(o.answer)}" not among choices ${JSON.stringify(choices)}`);
    }
  }

  errors.push(...bilingualErrors(o.explain, `${label} (id=${String(o.id)}).explain`));

  return errors;
}

export function validatePack(data: unknown): { ok: true; pack: QuestionPack } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['pack: not an object'] };
  }
  const o = data as Record<string, unknown>;

  if (typeof o.id !== 'string' || !o.id.trim()) errors.push('pack.id: missing/invalid');
  if (o.subject !== 'english' && o.subject !== 'chinese') errors.push('pack.subject: must be english or chinese');
  if (typeof o.topic !== 'string' || !o.topic.trim()) errors.push('pack.topic: missing/invalid');
  if (typeof o.topic === 'string' && (RESERVED_TOPICS.has(o.topic) || (o.subject === 'chinese' && !o.topic.startsWith('chinese-')) || (o.subject === 'english' && o.topic.startsWith('chinese-')))) errors.push('pack.topic: reserved or wrong subject namespace');
  errors.push(...bilingualErrors(o.title, 'pack.title'));
  if (typeof o.version !== 'number' || !Number.isSafeInteger(o.version) || o.version < 1) errors.push('pack.version: must be a positive integer');

  if (!Array.isArray(o.questions)) {
    errors.push('pack.questions: must be an array');
  } else {
    if (o.questions.length === 0) errors.push('pack.questions: must not be empty');
    const seenIds = new Set<string>();
    const seenPrompts = { en: new Set<string>(), zh: new Set<string>() };
    const tiers = { standard: 0, advanced: 0 };
    o.questions.forEach((q, i) => {
      if (q && typeof q === 'object') {
        const item = q as Record<string, unknown>;
        if (item.difficulty === 'standard' || item.difficulty === 'advanced') tiers[item.difficulty]++;
        if (isBilingual(item.prompt)) {
          for (const lang of ['en', 'zh'] as const) {
            const key = normalizeText(item.prompt[lang]);
            if (seenPrompts[lang].has(key)) errors.push(`questions[${i}]: duplicate ${lang} prompt`);
            seenPrompts[lang].add(key);
          }
        }
      }
      errors.push(...validateQuestion(q, i, seenIds));
    });
    for (const tier of ['standard', 'advanced'] as const) {
      if (tiers[tier] < 10) errors.push(`pack.questions: requires at least 10 ${tier} questions for a complete session`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, pack: data as QuestionPack };
}

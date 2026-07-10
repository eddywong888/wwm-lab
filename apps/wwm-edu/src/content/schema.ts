// Framework-free schema + validator for English question banks. Kept
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
  /** Question text; English content stays English, zh is an instruction hint. */
  prompt: Bilingual;
  /** Exactly 4 unique strings. */
  choices: string[];
  /** Must be one of `choices`. */
  answer: string;
  explain?: Bilingual;
}

export interface QuestionPack {
  id: string;
  subject: 'english';
  topic: string;
  title: Bilingual;
  version: number;
  questions: BankQuestion[];
}

const BAD_TEXT = /NaN|undefined|null/;

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
    if (new Set(strChoices).size !== strChoices.length) {
      errors.push(`${label} (id=${String(o.id)}): choices not unique: ${JSON.stringify(choices)}`);
    }
    for (const c of strChoices) {
      if (BAD_TEXT.test(c)) errors.push(`${label} (id=${String(o.id)}): bad text in choice "${c}"`);
    }
    if (typeof o.answer !== 'string' || !strChoices.includes(o.answer)) {
      errors.push(`${label} (id=${String(o.id)}): answer "${String(o.answer)}" not among choices ${JSON.stringify(choices)}`);
    }
  }

  if (o.explain !== undefined) {
    errors.push(...bilingualErrors(o.explain, `${label} (id=${String(o.id)}).explain`));
  }

  return errors;
}

export function validatePack(data: unknown): { ok: true; pack: QuestionPack } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['pack: not an object'] };
  }
  const o = data as Record<string, unknown>;

  if (typeof o.id !== 'string' || !o.id.trim()) errors.push('pack.id: missing/invalid');
  if (o.subject !== 'english') errors.push(`pack.subject: must be 'english', got ${JSON.stringify(o.subject)}`);
  if (typeof o.topic !== 'string' || !o.topic.trim()) errors.push('pack.topic: missing/invalid');
  errors.push(...bilingualErrors(o.title, 'pack.title'));
  if (typeof o.version !== 'number' || !Number.isFinite(o.version)) errors.push('pack.version: must be a number');

  if (!Array.isArray(o.questions)) {
    errors.push('pack.questions: must be an array');
  } else {
    if (o.questions.length === 0) errors.push('pack.questions: must not be empty');
    const seenIds = new Set<string>();
    o.questions.forEach((q, i) => {
      errors.push(...validateQuestion(q, i, seenIds));
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, pack: data as QuestionPack };
}

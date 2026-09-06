export type Lang = 'en' | 'zh';
export type Subject = 'math' | 'english' | 'chinese';

export interface Bilingual {
  en: string;
  zh: string;
}

export type Difficulty = 'standard' | 'advanced';

export type QuestionVisual =
  | { type: 'bar-chart'; label: Bilingual; categories: string[]; values: number[]; unit: Bilingual }
  | { type: 'clock'; label: Bilingual; hour: number; minute: number }
  | { type: 'angle'; label: Bilingual; degrees: number }
  | { type: 'ruler'; label: Bilingual; rulerCm: number; startCm: number; endCm: number };

export interface SelfReviewGuide {
  modelAnswer: Bilingual;
  criteria: Bilingual[];
  hint?: Bilingual;
}

export interface Question {
  id: string;
  prompt: Bilingual;
  /** Present for kind: 'mcq'. Exactly 4 unique strings, one of which equals `answer`. */
  choices?: string[];
  /** Correct answer for auto-marked questions; model response for self-review questions. */
  answer: string;
  kind: 'mcq' | 'numeric' | 'self-check';
  topic: string;
  difficulty?: Difficulty;
  explain?: Bilingual;
  visual?: QuestionVisual;
  selfReview?: SelfReviewGuide;
}

export interface AnswerRecord {
  question: Question;
  givenAnswer: string;
  correct: boolean;
  /** False for reflective self-checks, which never affect scores or progress. */
  scored?: boolean;
  difficulty: Difficulty;
}

export interface GeneratorMeta {
  id: string;
  name: Bilingual;
  /** Emoji icon representing the topic */
  icon: string;
  /** Practice grouping: numbers/operations (1), measures/space/data (2); not an official term sequence. */
  term?: 1 | 2;
}

export interface Generator {
  meta: GeneratorMeta;
  generate: (rng: import('./rng').Rng, difficulty: Difficulty) => Question;
}

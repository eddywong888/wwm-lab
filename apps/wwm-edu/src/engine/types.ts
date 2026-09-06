export type Lang = 'en' | 'zh';
export type Subject = 'math' | 'english' | 'chinese';

export interface Bilingual {
  en: string;
  zh: string;
}

export type Difficulty = 'standard' | 'advanced';

export interface Question {
  id: string;
  prompt: Bilingual;
  /** Present for kind: 'mcq'. Exactly 4 unique strings, one of which equals `answer`. */
  choices?: string[];
  /** The correct answer, formatted exactly as it should be displayed/compared. */
  answer: string;
  kind: 'mcq' | 'numeric';
  topic: string;
  difficulty?: Difficulty;
  explain?: Bilingual;
}

export interface AnswerRecord {
  question: Question;
  givenAnswer: string;
  correct: boolean;
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

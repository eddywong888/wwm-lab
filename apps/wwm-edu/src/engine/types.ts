export type Lang = 'en' | 'zh';

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
  explain?: Bilingual;
}

export interface GeneratorMeta {
  id: string;
  name: Bilingual;
  /** Emoji icon representing the topic */
  icon: string;
}

export interface Generator {
  meta: GeneratorMeta;
  generate: (rng: import('./rng').Rng, difficulty: Difficulty) => Question;
}

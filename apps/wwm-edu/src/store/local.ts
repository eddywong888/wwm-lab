import type { Difficulty, Lang } from '../engine/types';

const STORAGE_KEY = 'wwm-edu:v1';

export interface TopicProgress {
  attempts: number;
  correct: number;
  bestStreak: number;
  stars: number;
}

export interface EduState {
  lang: Lang;
  difficulty: Difficulty;
  muted: boolean;
  perTopic: Record<string, TopicProgress>;
}

const DEFAULT_STATE: EduState = {
  lang: 'en',
  difficulty: 'standard',
  muted: false,
  perTopic: {},
};

function isTopicProgress(v: unknown): v is TopicProgress {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.attempts === 'number' && typeof o.correct === 'number'
    && typeof o.bestStreak === 'number' && typeof o.stars === 'number';
}

function sanitize(raw: unknown): EduState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE, perTopic: {} };
  const o = raw as Record<string, unknown>;
  const lang: Lang = o.lang === 'zh' ? 'zh' : 'en';
  const difficulty: Difficulty = o.difficulty === 'advanced' ? 'advanced' : 'standard';
  const muted = typeof o.muted === 'boolean' ? o.muted : false;
  const perTopic: Record<string, TopicProgress> = {};
  if (o.perTopic && typeof o.perTopic === 'object') {
    for (const [topic, val] of Object.entries(o.perTopic as Record<string, unknown>)) {
      if (isTopicProgress(val)) perTopic[topic] = val;
    }
  }
  return { lang, difficulty, muted, perTopic };
}

export function loadState(): EduState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, perTopic: {} };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_STATE, perTopic: {} };
  }
}

export function saveState(state: EduState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — silently ignore
  }
}

export function updateState(patch: Partial<EduState>): EduState {
  const current = loadState();
  const next = { ...current, ...patch };
  saveState(next);
  return next;
}

export function recordSession(topicId: string, correctCount: number, totalCount: number, bestStreakThisSession: number): EduState {
  const state = loadState();
  const prev: TopicProgress = state.perTopic[topicId] ?? { attempts: 0, correct: 0, bestStreak: 0, stars: 0 };
  const stars = correctCount >= 9 ? 3 : correctCount >= 7 ? 2 : correctCount >= 5 ? 1 : 0;
  const updated: TopicProgress = {
    attempts: prev.attempts + totalCount,
    correct: prev.correct + correctCount,
    bestStreak: Math.max(prev.bestStreak, bestStreakThisSession),
    stars: Math.max(prev.stars, stars),
  };
  const next: EduState = { ...state, perTopic: { ...state.perTopic, [topicId]: updated } };
  saveState(next);
  return next;
}

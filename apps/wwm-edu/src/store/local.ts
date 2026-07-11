import type { Difficulty, Lang } from '../engine/types';

const STORAGE_KEY = 'wwm-edu:v1';

/** How many recently-served English question ids to remember for anti-repeat. */
const ENGLISH_HISTORY_LIMIT = 200;

export interface TopicProgress {
  attempts: number;
  correct: number;
  bestStreak: number;
  stars: number;
}

export interface DailyResult {
  date: string; // YYYY-MM-DD (local date)
  score: number;
  bestStreak: number;
}

/** Phase 3 nickname+PIN account. No PII: userKey is a one-way hex-SHA-256
 * of nickname+PIN (see src/store/account.ts); the PIN itself is never
 * stored anywhere, locally or on the server. */
export interface Account {
  nickname: string;
  userKey: string;
}

export interface EduState {
  lang: Lang;
  difficulty: Difficulty;
  muted: boolean;
  perTopic: Record<string, TopicProgress>;
  /** Recently-served English bank question ids, most-recent-last, capped at
   * ENGLISH_HISTORY_LIMIT. Optional/defaulted so old saved blobs still load. */
  englishServedIds?: string[];
  /** Best result for each day's Daily Challenge, keyed by date. Optional/
   * defaulted so old saved blobs still load. */
  dailyResults?: Record<string, DailyResult>;
  /** Signed-in account, if any. Optional/defaulted so old saved blobs
   * still load; absent = signed out (local-only, fully offline play). */
  account?: Account;
}

const DEFAULT_STATE: EduState = {
  lang: 'en',
  difficulty: 'standard',
  muted: false,
  perTopic: {},
  englishServedIds: [],
  dailyResults: {},
};

function isTopicProgress(v: unknown): v is TopicProgress {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.attempts === 'number' && typeof o.correct === 'number'
    && typeof o.bestStreak === 'number' && typeof o.stars === 'number';
}

function isDailyResult(v: unknown): v is DailyResult {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.date === 'string' && typeof o.score === 'number' && typeof o.bestStreak === 'number';
}

const USER_KEY_RE = /^[0-9a-f]{64}$/;

function isAccount(v: unknown): v is Account {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.nickname === 'string' && o.nickname.trim().length > 0
    && typeof o.userKey === 'string' && USER_KEY_RE.test(o.userKey);
}

function sanitize(raw: unknown): EduState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE, perTopic: {}, englishServedIds: [], dailyResults: {} };
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
  const englishServedIds: string[] = Array.isArray(o.englishServedIds)
    ? o.englishServedIds.filter((id): id is string => typeof id === 'string').slice(-ENGLISH_HISTORY_LIMIT)
    : [];
  const dailyResults: Record<string, DailyResult> = {};
  if (o.dailyResults && typeof o.dailyResults === 'object') {
    for (const [date, val] of Object.entries(o.dailyResults as Record<string, unknown>)) {
      if (isDailyResult(val)) dailyResults[date] = val;
    }
  }
  const account: Account | undefined = isAccount(o.account) ? o.account : undefined;
  return { lang, difficulty, muted, perTopic, englishServedIds, dailyResults, account };
}

export function loadState(): EduState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, perTopic: {}, englishServedIds: [], dailyResults: {} };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_STATE, perTopic: {}, englishServedIds: [], dailyResults: {} };
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

/** Recently-served English question ids, oldest first, for the anti-repeat sampler. */
export function getEnglishServedIds(): string[] {
  return loadState().englishServedIds ?? [];
}

/** Append newly-served English question ids, trimming to ENGLISH_HISTORY_LIMIT. */
export function recordEnglishServedIds(ids: readonly string[]): EduState {
  const state = loadState();
  const merged = [...(state.englishServedIds ?? []), ...ids].slice(-ENGLISH_HISTORY_LIMIT);
  const next: EduState = { ...state, englishServedIds: merged };
  saveState(next);
  return next;
}

/** Today's Daily Challenge result, if already played, for the given local date. */
export function getDailyResult(date: string): DailyResult | undefined {
  return loadState().dailyResults?.[date];
}

/** Store a Daily Challenge result, keeping the better score if replayed. */
export function recordDailyResult(date: string, score: number, bestStreak: number): EduState {
  const state = loadState();
  const prev = state.dailyResults?.[date];
  const updated: DailyResult = prev && prev.score >= score
    ? { date, score: prev.score, bestStreak: Math.max(prev.bestStreak, bestStreak) }
    : { date, score, bestStreak: prev ? Math.max(prev.bestStreak, bestStreak) : bestStreak };
  const next: EduState = { ...state, dailyResults: { ...(state.dailyResults ?? {}), [date]: updated } };
  saveState(next);
  return next;
}

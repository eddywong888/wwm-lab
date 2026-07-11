// Phase 4 — badges & streak rewards. Every badge is a pure function of
// data already stored in EduState (perTopic + dailyResults), so nothing
// new needs to be persisted or synced: badges are recomputed on demand,
// and "newly unlocked" is found by diffing the computed set before/after
// a session (see App.tsx).
import type { Bilingual } from './types';
import type { DailyResult, EduState, TopicProgress } from '../store/local';
import { MATH_GENERATORS } from './math';
import { ENGLISH_TOPIC_IDS } from './english';
import { MIXED_TOPIC_ID } from './session';

export interface BadgeDef {
  id: string;
  icon: string;
  name: Bilingual;
  description: Bilingual;
  check: (stats: Stats) => boolean;
}

interface Stats {
  perTopic: Record<string, TopicProgress>;
  totalAttempts: number;
  totalCorrect: number;
  topicsPlayed: number;
  topicsMastered: number; // stars === 3
  allTopicIds: string[];
  bestTopicStreak: number;
  dailyStreak: { current: number; best: number };
}

/** All topic ids the player can practice — used for "played every topic" /
 * "mastered every topic" badges. Reads ENGLISH_TOPIC_IDS live since it can
 * change at runtime when KV content overrides load (see engine/english). */
function allTopicIds(): string[] {
  return [MIXED_TOPIC_ID, ...MATH_GENERATORS.map((g) => g.meta.id), ...ENGLISH_TOPIC_IDS];
}

/** Longest run of consecutive calendar days present in `dailyResults`, and
 * whether that run reaches today/yesterday (the "current" streak; a streak
 * is still "current" the day after it was set, before the player has had
 * a chance to play again today). */
export function computeDailyStreak(dailyResults: Record<string, DailyResult> | undefined, today: string = todayLocal()): { current: number; best: number } {
  const dates = Object.keys(dailyResults ?? {}).sort();
  if (dates.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    run = isNextDay(dates[i - 1], dates[i]) ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const lastDate = dates[dates.length - 1];
  const yesterday = addDays(today, -1);
  let current = 0;
  if (lastDate === today || lastDate === yesterday) {
    current = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      if (isNextDay(dates[i - 1], dates[i])) current++;
      else break;
    }
  }

  return { current, best };
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function isNextDay(prev: string, next: string): boolean {
  return addDays(prev, 1) === next;
}

function computeStats(state: EduState): Stats {
  const perTopic = state.perTopic ?? {};
  const entries = Object.values(perTopic);
  const ids = allTopicIds();
  return {
    perTopic,
    totalAttempts: entries.reduce((sum, p) => sum + p.attempts, 0),
    totalCorrect: entries.reduce((sum, p) => sum + p.correct, 0),
    topicsPlayed: ids.filter((id) => (perTopic[id]?.attempts ?? 0) > 0).length,
    topicsMastered: ids.filter((id) => perTopic[id]?.stars === 3).length,
    allTopicIds: ids,
    bestTopicStreak: entries.reduce((max, p) => Math.max(max, p.bestStreak), 0),
    dailyStreak: computeDailyStreak(state.dailyResults),
  };
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first-steps',
    icon: '🌱',
    name: { en: 'First Steps', zh: '初次尝试' },
    description: { en: 'Finish your first practice session.', zh: '完成第一次练习。' },
    check: (s) => s.totalAttempts >= 10,
  },
  {
    id: 'explorer',
    icon: '🧭',
    name: { en: 'Explorer', zh: '探索家' },
    description: { en: 'Try 5 different topics.', zh: '尝试5个不同的主题。' },
    check: (s) => s.topicsPlayed >= 5,
  },
  {
    id: 'completionist',
    icon: '🗺️',
    name: { en: 'Completionist', zh: '全能玩家' },
    description: { en: 'Play every topic at least once.', zh: '玩过所有主题。' },
    check: (s) => s.topicsPlayed >= s.allTopicIds.length,
  },
  {
    id: 'streak-5',
    icon: '🔥',
    name: { en: 'Streak Starter', zh: '连胜新星' },
    description: { en: 'Answer 5 in a row correctly.', zh: '连续答对5题。' },
    check: (s) => s.bestTopicStreak >= 5,
  },
  {
    id: 'streak-10',
    icon: '🔥',
    name: { en: 'On Fire', zh: '势不可挡' },
    description: { en: 'Answer 10 in a row correctly.', zh: '连续答对10题。' },
    check: (s) => s.bestTopicStreak >= 10,
  },
  {
    id: 'streak-20',
    icon: '🔥',
    name: { en: 'Unstoppable', zh: '无人能挡' },
    description: { en: 'Answer 20 in a row correctly.', zh: '连续答对20题。' },
    check: (s) => s.bestTopicStreak >= 20,
  },
  {
    id: 'triple-star',
    icon: '⭐',
    name: { en: 'Triple Star', zh: '三星达成' },
    description: { en: 'Earn 3 stars on any topic.', zh: '在任一主题获得三颗星。' },
    check: (s) => s.topicsMastered >= 1,
  },
  {
    id: 'full-house',
    icon: '🌟',
    name: { en: 'Full House', zh: '满堂星光' },
    description: { en: 'Earn 3 stars on every topic.', zh: '所有主题都获得三颗星。' },
    check: (s) => s.topicsMastered >= s.allTopicIds.length,
  },
  {
    id: 'century',
    icon: '💯',
    name: { en: 'Century', zh: '百题斩' },
    description: { en: 'Answer 100 questions correctly.', zh: '累计答对100题。' },
    check: (s) => s.totalCorrect >= 100,
  },
  {
    id: 'half-k',
    icon: '🏅',
    name: { en: 'Half K', zh: '五百达人' },
    description: { en: 'Answer 500 questions correctly.', zh: '累计答对500题。' },
    check: (s) => s.totalCorrect >= 500,
  },
  {
    id: 'grand-master',
    icon: '🏆',
    name: { en: 'Grand Master', zh: '千题大师' },
    description: { en: 'Answer 1000 questions correctly.', zh: '累计答对1000题。' },
    check: (s) => s.totalCorrect >= 1000,
  },
  {
    id: 'daily-3',
    icon: '🗓️',
    name: { en: 'Daily Devotee', zh: '每日常客' },
    description: { en: 'Play the Daily Challenge 3 days in a row.', zh: '连续3天完成每日挑战。' },
    check: (s) => s.dailyStreak.best >= 3,
  },
  {
    id: 'daily-7',
    icon: '📅',
    name: { en: 'Weekly Warrior', zh: '一周勇士' },
    description: { en: 'Play the Daily Challenge 7 days in a row.', zh: '连续7天完成每日挑战。' },
    check: (s) => s.dailyStreak.best >= 7,
  },
  {
    id: 'daily-30',
    icon: '👑',
    name: { en: 'Unbroken', zh: '坚持不懈' },
    description: { en: 'Play the Daily Challenge 30 days in a row.', zh: '连续30天完成每日挑战。' },
    check: (s) => s.dailyStreak.best >= 30,
  },
];

/** Ids of every badge currently earned, derived from state. */
export function computeEarnedBadgeIds(state: EduState): Set<string> {
  const stats = computeStats(state);
  const earned = new Set<string>();
  for (const badge of BADGES) {
    if (badge.check(stats)) earned.add(badge.id);
  }
  return earned;
}

/** Badges present in `after` but not `before` — for "you just unlocked…" toasts. */
export function newlyEarnedBadges(before: EduState, after: EduState): BadgeDef[] {
  const beforeIds = computeEarnedBadgeIds(before);
  const afterIds = computeEarnedBadgeIds(after);
  return BADGES.filter((b) => afterIds.has(b.id) && !beforeIds.has(b.id));
}

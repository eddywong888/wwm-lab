// Phase 4 — badges & rewards.
//
// KEY DESIGN DECISION: badges are DERIVED, never persisted. computeBadges()
// is a pure function of the existing EduState (perTopic + dailyResults) —
// there is no `unlockedBadgeIds` field anywhere, no migration to write, and
// nothing that can drift out of sync with the underlying stats. Because
// badges are recomputed from data that already syncs (src/store/sync.ts's
// mergeEduState merges perTopic + dailyResults), badges sync across devices
// for free. If you're tempted to persist "which badges are unlocked", stop —
// that reintroduces exactly the drift/migration risk this design avoids.
//
// No React imports here — this module must stay pure/testable from a plain
// Node script (see scripts/check-generators.ts).

import type { Bilingual } from './types';
import type { EduState } from '../store/local';
import { MATH_GENERATORS } from './math';
import { CHINESE_TOPICS, ENGLISH_TOPICS } from './english';
import { MIXED_TOPIC_ID, ENGLISH_MIXED_TOPIC_ID, CHINESE_MIXED_TOPIC_ID, DAILY_TOPIC_ID, REVIEW_TOPIC_ID, QUESTIONS_PER_SESSION } from './session';

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface BadgeDef {
  id: string;
  icon: string;
  name: Bilingual;
  /** Describes what earns the NEXT tier, phrased for a 10-year-old. */
  description: Bilingual;
  /** Ascending thresholds. */
  tiers: { tier: BadgeTier; threshold: number }[];
  /** Current raw progress value, compared against `tiers[].threshold`. */
  progress: (state: EduState) => number;
}

export interface EarnedBadge {
  def: BadgeDef;
  tier: BadgeTier | null;
  value: number;
  next: number | null;
}

/** Pseudo-topic ids that never count as a "real" topic for badge purposes. */
const PSEUDO_TOPIC_IDS = new Set<string>([MIXED_TOPIC_ID, ENGLISH_MIXED_TOPIC_ID, CHINESE_MIXED_TOPIC_ID, DAILY_TOPIC_ID, REVIEW_TOPIC_ID]);

function realTopicEntries(state: EduState) {
  return Object.entries(state.perTopic).filter(([id]) => !PSEUDO_TOPIC_IDS.has(id));
}

function countDailyResults(state: EduState): number {
  return Object.keys(state.dailyResults ?? {}).length;
}

function countPerfectDays(state: EduState): number {
  return Object.values(state.dailyResults ?? {}).filter((d) => d.score >= QUESTIONS_PER_SESSION).length;
}

// Daily Challenge results live ONLY in state.dailyResults — App.tsx's
// finishExercise calls recordDailyResult() instead of recordSession(), so
// daily answers never land in perTopic. Every "overall" metric below must
// therefore fold the dailies in explicitly, or a kid who mainly plays the
// Daily Challenge would never advance the aggregate badges. dailyResults
// stores the BEST result per date, so one day contributes one session's
// worth of questions.
function totalAttempts(state: EduState): number {
  const topics = realTopicEntries(state).reduce((sum, [, p]) => sum + p.attempts, 0);
  return topics + countDailyResults(state) * QUESTIONS_PER_SESSION;
}

function totalCorrect(state: EduState): number {
  const topics = realTopicEntries(state).reduce((sum, [, p]) => sum + p.correct, 0);
  const daily = Object.values(state.dailyResults ?? {}).reduce((sum, d) => sum + d.score, 0);
  return topics + daily;
}

function bestStreakAnywhere(state: EduState): number {
  const topics = realTopicEntries(state).reduce((max, [, p]) => Math.max(max, p.bestStreak), 0);
  const daily = Object.values(state.dailyResults ?? {}).reduce((max, d) => Math.max(max, d.bestStreak), 0);
  return Math.max(topics, daily);
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'topic-master',
    icon: '🏅',
    name: { en: 'Topic Master', zh: '课题大师' },
    description: {
      en: 'Get 3 stars on more topics to earn the next tier!',
      zh: '在更多课题中获得3颗星，即可解锁下一等级！',
    },
    tiers: [
      { tier: 'bronze', threshold: 3 },
      { tier: 'silver', threshold: 8 },
      { tier: 'gold', threshold: 14 },
    ],
    progress: (state) => realTopicEntries(state).filter(([, p]) => p.stars === 3).length,
  },
  {
    id: 'streak-hero',
    icon: '🔥',
    name: { en: 'Streak Hero', zh: '连胜英雄' },
    description: {
      en: 'Answer more questions in a row correctly to earn the next tier!',
      zh: '连续答对更多题目，即可解锁下一等级！',
    },
    tiers: [
      { tier: 'bronze', threshold: 5 },
      { tier: 'silver', threshold: 8 },
      { tier: 'gold', threshold: 10 },
    ],
    progress: bestStreakAnywhere,
  },
  {
    id: 'daily-regular',
    icon: '🗓️',
    name: { en: 'Daily Regular', zh: '每日常客' },
    description: {
      en: 'Play the Daily Challenge on more days to earn the next tier!',
      zh: '在更多天数完成每日挑战，即可解锁下一等级！',
    },
    tiers: [
      { tier: 'bronze', threshold: 3 },
      { tier: 'silver', threshold: 7 },
      { tier: 'gold', threshold: 30 },
    ],
    progress: countDailyResults,
  },
  {
    id: 'daily-perfect',
    icon: '🌟',
    name: { en: 'Perfect Day', zh: '完美一天' },
    description: {
      en: 'Get a perfect 10/10 on more Daily Challenges to earn the next tier!',
      zh: '在更多每日挑战中获得满分10/10，即可解锁下一等级！',
    },
    tiers: [
      { tier: 'bronze', threshold: 1 },
      { tier: 'silver', threshold: 5 },
      { tier: 'gold', threshold: 15 },
    ],
    progress: countPerfectDays,
  },
  {
    id: 'question-crusher',
    icon: '💪',
    name: { en: 'Question Crusher', zh: '题目高手' },
    description: {
      en: 'Answer more questions overall to earn the next tier!',
      zh: '累计回答更多题目，即可解锁下一等级！',
    },
    tiers: [
      { tier: 'bronze', threshold: 100 },
      { tier: 'silver', threshold: 500 },
      { tier: 'gold', threshold: 2000 },
    ],
    progress: totalAttempts,
  },
  {
    id: 'sharp-shooter',
    icon: '🎯',
    name: { en: 'Sharp Shooter', zh: '神射手' },
    description: {
      en: 'Keep your overall accuracy high (after at least 100 questions) to earn the next tier!',
      zh: '在回答满100题后保持高正确率，即可解锁下一等级！',
    },
    tiers: [
      { tier: 'bronze', threshold: 70 },
      { tier: 'silver', threshold: 85 },
      { tier: 'gold', threshold: 95 },
    ],
    progress: (state) => {
      const attempts = totalAttempts(state);
      if (attempts < 100) return 0;
      return (totalCorrect(state) / attempts) * 100;
    },
  },
  {
    id: 'math-explorer',
    icon: '🔢',
    name: { en: 'Math Explorer', zh: '数学探索家' },
    description: {
      en: 'Try more math topics at least once to earn the next tier!',
      zh: '尝试更多不同的数学课题，即可解锁下一等级！',
    },
    tiers: [
      { tier: 'bronze', threshold: 3 },
      { tier: 'silver', threshold: 7 },
      { tier: 'gold', threshold: 10 },
    ],
    progress: (state) => {
      const mathIds = new Set(MATH_GENERATORS.map((g) => g.meta.id));
      return realTopicEntries(state).filter(([id, p]) => mathIds.has(id) && p.attempts > 0).length;
    },
  },
  {
    id: 'word-wizard',
    icon: '📖',
    name: { en: 'Word Wizard', zh: '词汇达人' },
    description: {
      en: 'Try more English topics at least once to earn the next tier!',
      zh: '尝试更多不同的英语课题，即可解锁下一等级！',
    },
    tiers: [
      { tier: 'bronze', threshold: 1 },
      { tier: 'silver', threshold: 2 },
      { tier: 'gold', threshold: 4 },
    ],
    progress: (state) => {
      const englishIds = new Set(ENGLISH_TOPICS.map((t) => t.id));
      return realTopicEntries(state).filter(([id, p]) => englishIds.has(id) && p.attempts > 0).length;
    },
  },
  {
    id: 'chinese-champion',
    icon: '📙',
    name: { en: 'Chinese Champion', zh: '华文小达人' },
    description: {
      en: 'Try more Chinese topics at least once to earn the next tier!',
      zh: '尝试更多不同的华文课题，即可解锁下一等级！',
    },
    tiers: [
      { tier: 'bronze', threshold: 1 },
      { tier: 'silver', threshold: 2 },
      { tier: 'gold', threshold: 4 },
    ],
    progress: (state) => {
      const chineseIds = new Set(CHINESE_TOPICS.map((t) => t.id));
      return realTopicEntries(state).filter(([id, p]) => chineseIds.has(id) && p.attempts > 0).length;
    },
  },
];

function tierForValue(def: BadgeDef, value: number): { tier: BadgeTier | null; next: number | null } {
  let tier: BadgeTier | null = null;
  for (const t of def.tiers) {
    if (value >= t.threshold) {
      tier = t.tier;
    }
  }
  const idx = tier ? def.tiers.findIndex((t) => t.tier === tier) : -1;
  const next = idx >= 0 && idx + 1 < def.tiers.length ? def.tiers[idx + 1].threshold : (tier ? null : def.tiers[0]?.threshold ?? null);
  return { tier, next };
}

export function computeBadges(state: EduState): EarnedBadge[] {
  return BADGE_DEFS.map((def) => {
    const value = def.progress(state);
    const { tier, next } = tierForValue(def, value);
    return { def, tier, value, next };
  });
}

const TIER_RANK: Record<BadgeTier, number> = { bronze: 1, silver: 2, gold: 3 };

function tierRank(tier: BadgeTier | null): number {
  return tier ? TIER_RANK[tier] : 0;
}

/** Badges whose tier strictly increased from `before` to `after` (including null -> bronze). */
export function newlyEarnedBadges(before: EarnedBadge[], after: EarnedBadge[]): EarnedBadge[] {
  const beforeById = new Map(before.map((b) => [b.def.id, b]));
  return after.filter((a) => {
    const b = beforeById.get(a.def.id);
    return tierRank(a.tier) > tierRank(b?.tier ?? null);
  });
}

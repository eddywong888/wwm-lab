// Phase 3 online sync: progress push/pull + weekly leaderboard, backed by
// functions/api/edu/*. Everything here is fire-and-forget / try-catch —
// the app MUST work fully offline (plain `npm run dev` has no Pages
// Functions at all; only `wrangler pages dev` / production do).
import { loadState, saveState, type DailyResult, type EduState, type TopicProgress } from './local';

/** Tracks the outcome of the most recent network call, for a subtle
 * "synced/offline" indicator. `null` = no attempt made yet this session. */
let lastSyncOk: boolean | null = null;

export type SyncStatus = 'unknown' | 'synced' | 'offline';

export function getSyncStatus(): SyncStatus {
  if (lastSyncOk === null) return 'unknown';
  return lastSyncOk ? 'synced' : 'offline';
}

interface RemoteProgress {
  perTopic?: Record<string, TopicProgress>;
  dailyResults?: Record<string, DailyResult>;
  updatedAt?: number;
}

/** Merge a remote progress blob into local state (offline-first: local
 * data is never discarded, only improved on). Per topic, keep whichever
 * side has more attempts (tie broken by higher correct count); bestStreak
 * and stars always take the max of both sides. dailyResults are merged
 * per-date, keeping the better score (tie broken by higher bestStreak). */
export function mergeEduState(local: EduState, remote: RemoteProgress): EduState {
  const perTopic: Record<string, TopicProgress> = { ...local.perTopic };
  if (remote.perTopic) {
    for (const [topicId, r] of Object.entries(remote.perTopic)) {
      const l = perTopic[topicId];
      if (!l) {
        perTopic[topicId] = r;
        continue;
      }
      const preferRemote = r.attempts > l.attempts || (r.attempts === l.attempts && r.correct > l.correct);
      perTopic[topicId] = {
        attempts: preferRemote ? r.attempts : l.attempts,
        correct: preferRemote ? r.correct : l.correct,
        bestStreak: Math.max(l.bestStreak, r.bestStreak),
        stars: Math.max(l.stars, r.stars),
      };
    }
  }

  const dailyResults: Record<string, DailyResult> = { ...(local.dailyResults ?? {}) };
  if (remote.dailyResults) {
    for (const [date, r] of Object.entries(remote.dailyResults)) {
      const l = dailyResults[date];
      if (!l || r.score > l.score || (r.score === l.score && r.bestStreak > l.bestStreak)) {
        dailyResults[date] = r;
      }
    }
  }

  return { ...local, perTopic, dailyResults };
}

/** Push this device's current progress to the server. Fire-and-forget. */
export async function pushProgress(userKey: string): Promise<void> {
  try {
    const state = loadState();
    const body: RemoteProgress = {
      perTopic: state.perTopic,
      dailyResults: state.dailyResults ?? {},
      updatedAt: Date.now(),
    };
    const res = await fetch(`/api/edu/progress?u=${encodeURIComponent(userKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    lastSyncOk = res.ok;
  } catch {
    lastSyncOk = false;
  }
}

/** Pull server progress for `userKey` and merge it into local state,
 * saving the result. Always resolves (never throws) — returns the
 * unchanged local state on any failure so callers never need try/catch. */
export async function pullAndMergeProgress(userKey: string): Promise<EduState> {
  try {
    const res = await fetch(`/api/edu/progress?u=${encodeURIComponent(userKey)}`);
    if (!res.ok) {
      lastSyncOk = false;
      return loadState();
    }
    const remote = (await res.json()) as RemoteProgress;
    lastSyncOk = true;
    const merged = mergeEduState(loadState(), remote);
    saveState(merged);
    return merged;
  } catch {
    lastSyncOk = false;
    return loadState();
  }
}

/** Submit a Daily Challenge result to the weekly leaderboard. Fire-and-forget. */
export async function pushLeaderboard(entry: {
  u: string;
  nickname: string;
  score: number;
  streak: number;
  date: string;
}): Promise<void> {
  try {
    const res = await fetch('/api/edu/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    lastSyncOk = res.ok;
  } catch {
    lastSyncOk = false;
  }
}

export interface LeaderboardEntry {
  nickname: string;
  total: number;
  days: Record<string, number>;
}

export interface LeaderboardResponse {
  week: string;
  entries: LeaderboardEntry[];
}

/** Fetch a week's leaderboard (defaults to the current server week).
 * Returns null on any failure (offline, no functions in plain vite dev). */
export async function fetchLeaderboard(week?: string): Promise<LeaderboardResponse | null> {
  try {
    const url = week ? `/api/edu/leaderboard?week=${encodeURIComponent(week)}` : '/api/edu/leaderboard';
    const res = await fetch(url);
    if (!res.ok) return null;
    lastSyncOk = true;
    return (await res.json()) as LeaderboardResponse;
  } catch {
    lastSyncOk = false;
    return null;
  }
}

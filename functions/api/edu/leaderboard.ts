interface Env {
  VISITS: KVNamespace;
}

/** One player's entry within a single ISO week's leaderboard blob. */
interface LeaderboardEntry {
  nickname: string;
  /** Best Daily Challenge score (0-10) per date this week, keyed YYYY-MM-DD. */
  days: Record<string, number>;
  /** Sum of `days` — recomputed on every write. */
  total: number;
}

/** KV value shape at `edu:lb:<yyyy-Www>`: keyed by userKey. */
type LeaderboardBlob = Record<string, LeaderboardEntry>;

const USER_KEY_RE = /^[0-9a-f]{64}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_RE = /^\d{4}-W\d{2}$/;
const MAX_ENTRIES = 50;
const TOP_N = 20;

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
}

/** ISO-8601 week key (yyyy-Www), Thursday rule, computed in UTC. */
function isoWeekKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thursday of this ISO week
  const isoYear = date.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayNum = (jan4.getUTCDay() + 6) % 7;
  const week1Mon = new Date(jan4);
  week1Mon.setUTCDate(jan4.getUTCDate() - jan4DayNum);
  const week = Math.floor((date.getTime() - week1Mon.getTime()) / (7 * 86400000)) + 1;
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function todayUTC(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((da - db) / 86400000);
}

function recomputeTotal(entry: LeaderboardEntry): number {
  return Object.values(entry.days).reduce((sum, v) => sum + v, 0);
}

async function loadBlob(env: Env, week: string): Promise<LeaderboardBlob> {
  const raw = await env.VISITS.get(`edu:lb:${week}`);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as LeaderboardBlob;
  } catch {
    return {};
  }
}

/**
 * POST /api/edu/leaderboard  body { u, nickname, score (0-10 int), streak
 *   (int >=0), date (YYYY-MM-DD) } → upserts this user's best score for
 *   `date` into that ISO week's blob (`edu:lb:<yyyy-Www>`, week derived
 *   from `date`), recomputes their weekly total (sum of best-per-day
 *   scores), prunes to the top 50 entries by total, and writes back.
 * GET  /api/edu/leaderboard[?week=yyyy-Www] (defaults to the current
 *   server week) → { week, entries: top 20 [{ nickname, total, days }] }.
 */
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const headers = cors();

  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (ctx.request.method === 'POST') {
    let body: unknown;
    try {
      body = await ctx.request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'invalid JSON' }), { status: 400, headers });
    }
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'body must be an object' }), { status: 400, headers });
    }
    const o = body as Record<string, unknown>;
    const u = typeof o.u === 'string' ? o.u : '';
    const nickname = typeof o.nickname === 'string' ? o.nickname.trim().slice(0, 16) : '';
    const score = o.score;
    const streak = o.streak;
    const date = typeof o.date === 'string' ? o.date : '';

    if (!USER_KEY_RE.test(u)) {
      return new Response(JSON.stringify({ error: 'invalid userKey' }), { status: 400, headers });
    }
    if (nickname.length < 2) {
      return new Response(JSON.stringify({ error: 'invalid nickname' }), { status: 400, headers });
    }
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 10) {
      return new Response(JSON.stringify({ error: 'invalid score' }), { status: 400, headers });
    }
    if (typeof streak !== 'number' || !Number.isInteger(streak) || streak < 0) {
      return new Response(JSON.stringify({ error: 'invalid streak' }), { status: 400, headers });
    }
    if (!DATE_RE.test(date) || Math.abs(daysBetween(date, todayUTC())) > 1) {
      return new Response(JSON.stringify({ error: 'invalid or out-of-range date' }), { status: 400, headers });
    }

    const week = isoWeekKey(date);
    const blob = await loadBlob(ctx.env, week);

    const entry: LeaderboardEntry = blob[u] ?? { nickname, days: {}, total: 0 };
    entry.nickname = nickname;
    const prevScore = entry.days[date] ?? 0;
    if (score > prevScore) entry.days[date] = score;
    entry.total = recomputeTotal(entry);
    blob[u] = entry;

    const pruned: LeaderboardBlob = Object.fromEntries(
      Object.entries(blob)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, MAX_ENTRIES),
    );

    await ctx.env.VISITS.put(`edu:lb:${week}`, JSON.stringify(pruned));
    return new Response(JSON.stringify({ week, total: pruned[u]?.total ?? entry.total }), { headers });
  }

  if (ctx.request.method === 'GET') {
    const weekParam = new URL(ctx.request.url).searchParams.get('week');
    const week = weekParam && WEEK_RE.test(weekParam) ? weekParam : isoWeekKey(todayUTC());
    const blob = await loadBlob(ctx.env, week);
    const entries = Object.values(blob)
      .sort((a, b) => b.total - a.total)
      .slice(0, TOP_N)
      .map((e) => ({ nickname: e.nickname, total: e.total, days: e.days }));
    return new Response(JSON.stringify({ week, entries }), { headers });
  }

  return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers });
};

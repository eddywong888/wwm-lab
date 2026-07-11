interface Env {
  VISITS: KVNamespace;
}

const USER_KEY_RE = /^[0-9a-f]{64}$/;
const MAX_BODY_BYTES = 8 * 1024;

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
}

/**
 * GET  /api/edu/progress?u=<userKey>  → stored progress JSON blob, or {}
 * POST /api/edu/progress?u=<userKey>  → store a progress JSON blob (≤8KB)
 *
 * Stored at KV key `edu:user:<userKey>`. userKey is a hex-SHA-256 derived
 * client-side from nickname+PIN (see apps/wwm-edu/src/store/account.ts) —
 * this endpoint never sees the nickname/PIN themselves.
 */
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const headers = cors();

  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const userKey = new URL(ctx.request.url).searchParams.get('u') ?? '';
  if (!USER_KEY_RE.test(userKey)) {
    return new Response(JSON.stringify({ error: 'invalid userKey' }), { status: 400, headers });
  }

  const kvKey = `edu:user:${userKey}`;

  if (ctx.request.method === 'POST') {
    const raw = await ctx.request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: 'payload too large' }), { status: 413, headers });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: 'invalid JSON' }), { status: 400, headers });
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return new Response(JSON.stringify({ error: 'body must be a JSON object' }), { status: 400, headers });
    }
    await ctx.env.VISITS.put(kvKey, JSON.stringify(parsed));
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  if (ctx.request.method === 'GET') {
    const stored = await ctx.env.VISITS.get(kvKey);
    return new Response(stored ?? '{}', { headers });
  }

  return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers });
};

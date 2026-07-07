interface Env {
  VISITS: KVNamespace;
}

/** Counters that may be incremented via POST /api/hits?k=<key>. */
const ALLOWED_KEYS = ['thane-war-play', 'thane-war-download', 'thane-war-2-play', 'thane-war-2-download'];

/**
 * GET  /api/hits          → all counters (plus the landing-page visit count)
 * POST /api/hits?k=<key>  → increment one counter, returns its new value
 */
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (ctx.request.method === 'POST') {
    const key = new URL(ctx.request.url).searchParams.get('k');
    if (!key || !ALLOWED_KEYS.includes(key)) {
      return new Response(JSON.stringify({ error: 'unknown key' }), { status: 400, headers: cors });
    }
    const raw = await ctx.env.VISITS.get(`hit:${key}`);
    const next = (raw ? parseInt(raw, 10) : 0) + 1;
    await ctx.env.VISITS.put(`hit:${key}`, String(next));
    return new Response(JSON.stringify({ [key]: next }), { headers: cors });
  }

  const out: Record<string, number> = {};
  for (const key of ALLOWED_KEYS) {
    const raw = await ctx.env.VISITS.get(`hit:${key}`);
    out[key] = raw ? parseInt(raw, 10) : 0;
  }
  const visits = await ctx.env.VISITS.get('count');
  out.visits = visits ? parseInt(visits, 10) : 0;
  return new Response(JSON.stringify(out), { headers: cors });
};
